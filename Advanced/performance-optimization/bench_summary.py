"""A6 benchmark + profiler for A2's GET /api/summary.

Seeds N expenses into a throwaway temp SQLite DB, then measures the endpoint.
The optimized endpoint (``app/routes.py``) aggregates with a SQL ``GROUP BY``
over an indexed integer-cents column; the naive baseline it replaced lives in
``snapshots/summary_slow.py`` and is used by ``--compare-before``.

Run it from the **A2 service dir** so the ``app`` package imports cleanly:

    cd Advanced/parallel-expense-tracker
    .venv/bin/python ../performance-optimization/bench_summary.py                  # timing (fast path)
    .venv/bin/python ../performance-optimization/bench_summary.py --profile        # cProfile (fast path)
    .venv/bin/python ../performance-optimization/bench_summary.py --profile --before # cProfile (slow path)
    .venv/bin/python ../performance-optimization/bench_summary.py --compare-before  # slow vs fast + improvement %
    .venv/bin/python ../performance-optimization/bench_summary.py --scaling         # N = 1k,10k,50k,100k table
    .venv/bin/python ../performance-optimization/bench_summary.py --json            # structured output

Knobs: ``A6_N`` (default 50000), ``A6_ITERS`` (default 15).
"""
import argparse
import atexit
import io
import json
import os
import shutil
import statistics
import sys
import tempfile
import time

N = int(os.environ.get("A6_N", "50000"))
ITERS = int(os.environ.get("A6_ITERS", "15"))

# Must set DATABASE_URL before importing the app (read once, at import time).
_tmp = tempfile.mkdtemp(prefix="a6_")
os.environ["DATABASE_URL"] = f"sqlite:///{_tmp}/bench.db"


@atexit.register
def _cleanup_tmp() -> None:
    """Remove the throwaway DB dir on exit (success, error, or Ctrl-C)."""
    shutil.rmtree(_tmp, ignore_errors=True)


# Make the A2 app importable when run from the A2 dir, and make this script's
# own folder importable so we can load snapshots/summary_slow.py.
sys.path.insert(0, os.getcwd())
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, Base, SessionLocal  # noqa: E402
from app.models import Expense  # noqa: E402
from app.routes import summary as summary_fast  # noqa: E402  (the optimized endpoint fn)
from app.main import app  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from snapshots.summary_slow import summary_slow  # noqa: E402

CATEGORIES = ["food", "transport", "utilities", "groceries", "entertainment", "health"]


def seed(n: int) -> None:
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    s = SessionLocal()
    rows = [
        {
            # Money is stored as INTEGER cents (no float column anywhere).
            "amount_cents": ((i % 500) + 1) * 100 + 50,
            "category": CATEGORIES[i % len(CATEGORIES)],
            "note": "n",
            "created_at": "2026-01-01T00:00:00+00:00",
        }
        for i in range(n)
    ]
    s.bulk_insert_mappings(Expense, rows)
    s.commit()
    s.close()


def _expected(n: int) -> dict:
    """Ground-truth totals computed directly from the seed formula (integer cents).

    Used to assert the endpoint is exact — never trusting float arithmetic.
    """
    total_cents = sum(((i % 500) + 1) * 100 + 50 for i in range(n))
    return {"count": n, "total_cents": total_cents}


def _assert_correct(body: dict, n: int) -> None:
    exp = _expected(n)
    assert body["count"] == exp["count"], f"count {body['count']} != {exp['count']}"
    # Reconstruct integer cents from the float total and require it to be exact
    # (no float drift): round-trip cents -> float -> cents must be lossless.
    got_cents = round(body["total"] * 100)
    assert got_cents == exp["total_cents"], (
        f"total_cents {got_cents} != {exp['total_cents']} (float drift?)"
    )
    assert body["total"] * 100 == got_cents, "total is not an exact 2-decimal value"


def _percentiles(samples_ms: list) -> dict:
    s = sorted(samples_ms)
    return {
        "min": min(s),
        "p50": statistics.median(s),
        "p95": s[int(len(s) * 0.95) - 1],
        "max": max(s),
        "mean": statistics.mean(s),
    }


def _time_callable(fn, iters: int) -> list:
    samples = []
    for _ in range(iters):
        t = time.perf_counter()
        fn()
        samples.append((time.perf_counter() - t) * 1000.0)
    return samples


# ---- modes -------------------------------------------------------------------

def run_default(as_json: bool) -> None:
    """Time the live endpoint via TestClient (the current, optimized path)."""
    t0 = time.perf_counter()
    seed(N)
    seed_s = time.perf_counter() - t0

    client = TestClient(app)
    r = client.get("/api/summary")  # warm-up
    assert r.status_code == 200, r.text
    body = r.json()
    _assert_correct(body, N)

    samples = _time_callable(lambda: client.get("/api/summary"), ITERS)
    pct = _percentiles(samples)

    if as_json:
        print(json.dumps({
            "mode": "endpoint",
            "env": {"python": sys.version.split()[0], "db": "sqlite-temp", "n": N, "iters": ITERS},
            "correctness": {
                "count": body["count"], "total": body["total"],
                "total_cents": round(body["total"] * 100),
                "categories": len(body["by_category"]),
            },
            "latency_ms": {k: round(v, 2) for k, v in pct.items()},
        }, indent=2))
        return

    print(f"env: python={sys.version.split()[0]}  N={N}  iters={ITERS}  db=sqlite(temp)")
    print(f"seeded {N} rows in {seed_s:.2f}s")
    print(f"correctness: count={body['count']}  total={body['total']:.2f}  "
          f"categories={len(body['by_category'])}")
    print(f"\n/api/summary latency over {ITERS} runs (N={N}):")
    print(f"  min   = {pct['min']:.2f} ms")
    print(f"  p50   = {pct['p50']:.2f} ms")
    print(f"  p95   = {pct['p95']:.2f} ms")
    print(f"  max   = {pct['max']:.2f} ms")
    print(f"  mean  = {pct['mean']:.2f} ms")


def run_compare_before(as_json: bool) -> None:
    """Measure the naive ORM baseline vs the optimized path, function-level.

    Both are timed by calling the summary function directly with a Session, so
    the comparison isolates the actual optimization (ORM hydration -> SQL
    GROUP BY) without HTTP/serialization noise on either side.
    """
    seed(N)
    db = SessionLocal()
    try:
        slow = summary_slow(db)
        fast_obj = summary_fast(db)
        fast = {"total": fast_obj.total, "count": fast_obj.count,
                "by_category": fast_obj.by_category}
        # Both paths must produce identical numbers.
        assert slow["count"] == fast["count"], (slow["count"], fast["count"])
        assert round(slow["total"] * 100) == round(fast["total"] * 100), (
            slow["total"], fast["total"])
        _assert_correct(fast, N)

        slow_ms = _time_callable(lambda: summary_slow(db), ITERS)
        fast_ms = _time_callable(lambda: summary_fast(db), ITERS)
    finally:
        db.close()

    sp = _percentiles(slow_ms)
    fp = _percentiles(fast_ms)
    improvement = (sp["p50"] - fp["p50"]) / sp["p50"] * 100.0
    speedup = sp["p50"] / fp["p50"] if fp["p50"] else float("inf")

    if as_json:
        print(json.dumps({
            "mode": "compare-before",
            "env": {"python": sys.version.split()[0], "db": "sqlite-temp", "n": N, "iters": ITERS},
            "before": {k: round(v, 2) for k, v in sp.items()},
            "after": {k: round(v, 2) for k, v in fp.items()},
            "improvement_pct": round(improvement, 2),
            "speedup_x": round(speedup, 2),
            "correctness": {"count": fast["count"], "total": fast["total"]},
        }, indent=2))
        return

    print(f"env: python={sys.version.split()[0]}  N={N}  iters={ITERS}  db=sqlite(temp)")
    print(f"correctness (slow == fast): count={fast['count']}  total={fast['total']:.2f}")
    print(f"\nBEFORE (naive ORM .all() + Python sum)  p50 = {sp['p50']:.2f} ms  "
          f"(min {sp['min']:.2f}, mean {sp['mean']:.2f}, max {sp['max']:.2f})")
    print(f"AFTER  (SQL GROUP BY over amount_cents)  p50 = {fp['p50']:.2f} ms  "
          f"(min {fp['min']:.2f}, mean {fp['mean']:.2f}, max {fp['max']:.2f})")
    print(f"\nimprovement: {improvement:.1f}%   speedup: {speedup:.1f}x   (N={N})")


def run_scaling(as_json: bool) -> None:
    """Slow vs fast p50 across input sizes — shows the O(N) divergence."""
    sizes = [int(x) for x in os.environ.get("A6_SCALING", "1000,10000,50000,100000").split(",")]
    iters = int(os.environ.get("A6_SCALING_ITERS", "8"))
    results = []
    for n in sizes:
        seed(n)
        db = SessionLocal()
        try:
            slow_ms = _time_callable(lambda: summary_slow(db), iters)
            fast_ms = _time_callable(lambda: summary_fast(db), iters)
        finally:
            db.close()
        sp50 = statistics.median(slow_ms)
        fp50 = statistics.median(fast_ms)
        results.append({
            "n": n,
            "before_p50_ms": round(sp50, 2),
            "after_p50_ms": round(fp50, 2),
            "speedup_x": round(sp50 / fp50, 1) if fp50 else None,
        })

    if as_json:
        print(json.dumps({
            "mode": "scaling",
            "env": {"python": sys.version.split()[0], "iters": iters},
            "rows": results,
        }, indent=2))
        return

    print(f"env: python={sys.version.split()[0]}  iters/size={iters}  db=sqlite(temp)")
    print(f"\nScaling — p50 latency by row count (slow naive ORM vs fast SQL GROUP BY):")
    print(f"\n| N | before p50 (ms) | after p50 (ms) | speedup |")
    print(f"|---|---|---|---|")
    for r in results:
        print(f"| {r['n']:,} | {r['before_p50_ms']:.2f} | {r['after_p50_ms']:.2f} | {r['speedup_x']}x |")


def run_profile(before: bool) -> None:
    """cProfile the hot path — fast endpoint by default, slow snapshot with --before."""
    import cProfile
    import pstats

    seed(N)
    print(f"env: python={sys.version.split()[0]}  N={N}  iters={ITERS}  db=sqlite(temp)")

    if before:
        db = SessionLocal()
        try:
            summary_slow(db)  # warm-up
            pr = cProfile.Profile()
            pr.enable()
            for _ in range(10):
                summary_slow(db)
            pr.disable()
        finally:
            db.close()
        label = "BEFORE (naive ORM .all(), 10 calls)"
    else:
        client = TestClient(app)
        r = client.get("/api/summary")  # warm-up
        assert r.status_code == 200, r.text
        pr = cProfile.Profile()
        pr.enable()
        for _ in range(10):
            client.get("/api/summary")
        pr.disable()
        label = "AFTER (SQL GROUP BY endpoint, 10 calls)"

    st = pstats.Stats(pr, stream=(buf := io.StringIO())).sort_stats("tottime")
    st.print_stats(12)
    print(f"\n===== cProfile {label} (top by tottime) =====")
    print(buf.getvalue())


def main() -> None:
    p = argparse.ArgumentParser(description="A6 benchmark for GET /api/summary")
    p.add_argument("--profile", action="store_true", help="cProfile the hot path")
    p.add_argument("--before", action="store_true",
                   help="with --profile: profile the naive ORM baseline instead of the endpoint")
    p.add_argument("--compare-before", action="store_true",
                   help="time slow (naive ORM) vs fast (SQL GROUP BY) and print improvement %")
    p.add_argument("--scaling", action="store_true",
                   help="slow-vs-fast p50 across N=1k,10k,50k,100k")
    p.add_argument("--json", action="store_true", help="emit structured JSON")
    args = p.parse_args()

    if args.profile:
        run_profile(before=args.before)
    elif args.compare_before:
        run_compare_before(args.json)
    elif args.scaling:
        run_scaling(args.json)
    else:
        run_default(args.json)


if __name__ == "__main__":
    main()
