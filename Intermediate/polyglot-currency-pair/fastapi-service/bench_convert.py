"""Micro-benchmark for POST /convert (in-process, via TestClient).

Measures per-request latency without network or process overhead, so it reflects
the route + Pydantic + Decimal cost. Prints p50/p95/p99 and exits non-zero if p50
exceeds the threshold, so CI can gate on it.

    python bench_convert.py [--iterations N] [--threshold-ms M]

Defaults: 2000 iterations, p50 threshold 10ms (per the I4 efficiency bar).
"""

import argparse
import time

from fastapi.testclient import TestClient

from app.main import app


def percentile(sorted_ms, q):
    if not sorted_ms:
        return 0.0
    idx = min(len(sorted_ms) - 1, int(q * len(sorted_ms)))
    return sorted_ms[idx]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--iterations", type=int, default=2000)
    ap.add_argument("--threshold-ms", type=float, default=10.0)
    args = ap.parse_args()

    client = TestClient(app)
    payload = {"amount": "100", "from": "USD", "to": "INR"}

    # Warm up (route compile, validators, encoder caches).
    for _ in range(50):
        client.post("/convert", json=payload)

    samples = []
    for _ in range(args.iterations):
        t0 = time.perf_counter()
        resp = client.post("/convert", json=payload)
        samples.append((time.perf_counter() - t0) * 1000.0)
        assert resp.status_code == 200, resp.status_code

    samples.sort()
    p50 = percentile(samples, 0.50)
    p95 = percentile(samples, 0.95)
    p99 = percentile(samples, 0.99)

    print(f"POST /convert — {args.iterations} iterations (in-process TestClient)")
    print(f"  p50 = {p50:.3f} ms")
    print(f"  p95 = {p95:.3f} ms")
    print(f"  p99 = {p99:.3f} ms")
    print(f"  min = {samples[0]:.3f} ms   max = {samples[-1]:.3f} ms")

    if p50 > args.threshold_ms:
        print(f"FAIL: p50 {p50:.3f} ms exceeds threshold {args.threshold_ms} ms")
        return 1
    print(f"OK: p50 {p50:.3f} ms within threshold {args.threshold_ms} ms")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
