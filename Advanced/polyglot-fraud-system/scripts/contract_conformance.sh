#!/usr/bin/env bash
# A3 contract conformance (A3-017): drive the 4 canonical CONTRACT.md vectors
# straight through the REAL Rust engine binary (stdin -> stdout) and assert the
# exact score / risk_level / reasons. This is the narrow "the engine still
# implements the locked contract" gate — cheaper and more targeted than the
# full cross-language integration test, and it fails loudly the moment the
# single source of truth for scoring drifts from CONTRACT.md.
set -euo pipefail

A3="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENGINE="${ENGINE_BIN:-$A3/rust-engine/target/release/fraud-engine}"
[ -x "$ENGINE" ] || { echo "FAIL: engine binary not built ($ENGINE) — run: (cd rust-engine && cargo build --release)"; exit 1; }

# Prefer the pinned service venv (3.12.7); fall back to system python3.
PYBIN="$A3/fastapi-service/.venv/bin/python"; [ -x "$PYBIN" ] || PYBIN="$(command -v python3)"

echo "== contract conformance: 4 canonical vectors through $ENGINE =="
ENGINE="$ENGINE" "$PYBIN" - <<'PY'
import json, os, subprocess, sys

ENGINE = os.environ["ENGINE"]
# id, amount, country, merchant, expected_score, expected_risk, expected_reasons
VECTORS = [
    ("txn_base",    5000,  "IN", "electronics",   0,  "low",    []),
    ("txn_high",    15000, "IN", "electronics",   40, "medium", ["high_amount"]),
    ("txn_foreign", 5000,  "US", "electronics",   20, "low",    ["foreign_country"]),
    ("txn_all",     15000, "US", "gambling",      90, "high",
        ["high_amount", "foreign_country", "high_risk_merchant"]),
]

passed = failed = 0
for tid, amount, country, merchant, exp_score, exp_risk, exp_reasons in VECTORS:
    txn = json.dumps({
        "transaction_id": tid, "user_id": "u1", "amount": amount,
        "country": country, "merchant_category": merchant,
        "timestamp": "2026-06-17T10:00:00Z",
    })
    proc = subprocess.run([ENGINE], input=txn, capture_output=True, text=True)
    if proc.returncode != 0:
        print(f"  {tid:12} engine exit {proc.returncode}: {proc.stderr.strip()}  FAIL")
        failed += 1
        continue
    out = json.loads(proc.stdout)
    ok = (out["score"] == exp_score and out["risk_level"] == exp_risk
          and out["reasons"] == exp_reasons)
    mark = "PASS" if ok else "FAIL"
    print(f"  {tid:12} score={out['score']:<3} risk={out['risk_level']:<7} "
          f"reasons={out['reasons']}  expect {exp_score}/{exp_risk}/{exp_reasons}  {mark}")
    passed += ok
    failed += (not ok)

print(f"CONTRACT CONFORMANCE: {passed} passed, {failed} failed")
sys.exit(0 if failed == 0 else 1)
PY
