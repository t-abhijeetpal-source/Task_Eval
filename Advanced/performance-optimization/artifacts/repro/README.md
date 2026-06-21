# A6 reproduction artifacts

Raw, machine-generated benchmark output captured on **2026-06-21**, **Python 3.12.7**,
macOS arm64, SQLite temp file. Every metric in `docs/agent-analysis/A6_performance_improvement.md`
traces to one of these files. Regenerate with:

```bash
cd Advanced/parallel-expense-tracker && . .venv/bin/activate
B=../performance-optimization/bench_summary.py
python $B --compare-before  > ../performance-optimization/artifacts/repro/BEFORE_baseline.txt
python $B                   > ../performance-optimization/artifacts/repro/AFTER_optimized.txt
python $B --profile --before> ../performance-optimization/artifacts/repro/cProfile_before.txt
python $B --profile         > ../performance-optimization/artifacts/repro/cProfile_after.txt
python $B --scaling         > ../performance-optimization/artifacts/repro/scaling.txt
```

| File | Mode | Headline metric |
|---|---|---|
| `BEFORE_baseline.txt` | `--compare-before` | naive ORM p50 **328.71 ms** vs optimized **28.89 ms** → **91.2%** / 11.4× |
| `AFTER_optimized.txt` | default (endpoint, TestClient) | `/api/summary` p50 **30.65 ms** @ N=50k |
| `cProfile_before.txt` | `--profile --before` | 11,002,001 calls / 4.584s — hotspot `orm/state.__init__` (1.403s), 2M attr reads |
| `cProfile_after.txt` | `--profile` | 48,111 calls / 0.318s — `fetchall`/`execute` only, ORM hydration gone |
| `scaling.txt` | `--scaling` | slow grows O(N) (3.73→677 ms); fast stays ~flat → speedup 7.5–12.3× |

Absolute latencies vary run-to-run with machine load; the **ratio** (≈11×) and the
profile **shape** (ORM hydration eliminated) are the stable, reproducible claims.
