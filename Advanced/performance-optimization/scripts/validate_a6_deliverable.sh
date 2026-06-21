#!/usr/bin/env bash
# Structural + content validation for the A6 performance-optimization deliverable.
# Fails (exit 1) on any missing artifact, stale claim, or broken bench. Designed to
# run in CI and locally; mirrors what `make a6-verify` gates on (minus the live bench).
#
#   bash scripts/validate_a6_deliverable.sh
#
# Exit 0 = deliverable structurally complete and free of known stale claims.
set -uo pipefail

# Resolve A6 root (this script lives in $A6_ROOT/scripts/).
A6_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$A6_ROOT"

fail=0
pass() { printf '  \033[32mok\033[0m   %s\n' "$1"; }
err()  { printf '  \033[31mFAIL\033[0m %s\n' "$1"; fail=1; }

echo "== A6 deliverable validation =="
echo "root: $A6_ROOT"

# 1) Required files exist and are non-empty.
echo "-- required files --"
REQUIRED=(
  "README.md"
  "bench_summary.py"
  "snapshots/summary_slow.py"
  "scripts/validate_a6_deliverable.sh"
  "prompts/performance-engineer.md"
  "docs/agent-analysis/A6_performance_improvement.md"
  "docs/agent-analysis/A6_manifest.json"
  "docs/agent-analysis/A6_secondary_findings.md"
  "docs/A6_engineering_evaluation_audit.md"
  "docs/A6_remediation_tracker.md"
  "docs/A6_final_scorecard.md"
  "artifacts/repro/README.md"
  "artifacts/repro/BEFORE_baseline.txt"
  "artifacts/repro/AFTER_optimized.txt"
  "artifacts/repro/cProfile_before.txt"
  "artifacts/repro/cProfile_after.txt"
)
for f in "${REQUIRED[@]}"; do
  if [[ -s "$f" ]]; then pass "$f"; else err "missing/empty: $f"; fi
done

# 2) No stale environment claims in ACTIVE report sections.
#    Python 3.14 and ../A6/ path references must not appear outside a clearly
#    labelled "Historical" block. We grep the whole report but allow the word
#    in the dedicated historical section (lines tagged HISTORICAL).
echo "-- stale-claim scan (report) --"
REPORT="docs/agent-analysis/A6_performance_improvement.md"
# Strip the historical appendix (everything after the HISTORICAL marker) before scanning.
ACTIVE="$(awk '/<!-- HISTORICAL -->/{exit} {print}' "$REPORT")"
if grep -qE "3\.14" <<<"$ACTIVE"; then err "Python 3.14 claim in active report section"; else pass "no Python 3.14 in active sections"; fi
if grep -qE "\.\./A6/|\"A6/|Advanced Task/A2" <<<"$ACTIVE"; then err "stale ../A6/ or 'Advanced Task' path in active report"; else pass "no stale ../A6/ paths in active sections"; fi

# 3) Report must state the live python + test count we actually run on.
echo "-- report accuracy markers --"
grep -q "3.12.7" "$REPORT" && pass "report names Python 3.12.7" || err "report does not mention Python 3.12.7"
grep -qE "40 (passed|tests)" "$REPORT" && pass "report names 40-test suite" || err "report does not state 40 passed"

# 4) Manifest is valid JSON with the keys we promise.
echo "-- manifest --"
if python3 -c "import json,sys; d=json.load(open('docs/agent-analysis/A6_manifest.json')); assert d['target'] and d['metrics']['improvement_pct']>80" 2>/dev/null; then
  pass "A6_manifest.json valid JSON, improvement_pct > 80"
else
  err "A6_manifest.json invalid or improvement_pct <= 80"
fi

# 5) bench_summary.py imports/parses and exposes the documented modes.
echo "-- bench harness --"
if python3 -c "import ast; ast.parse(open('bench_summary.py').read())" 2>/dev/null; then
  pass "bench_summary.py parses"
else
  err "bench_summary.py syntax error"
fi
for mode in -- "--compare-before" "--scaling" "--json" "--profile"; do
  grep -q -- "$mode" bench_summary.py && pass "bench supports $mode" || err "bench missing mode $mode"
done

# 6) snapshot is the naive .all() baseline (guards against someone optimizing it).
grep -q "db.query(Expense).all()" snapshots/summary_slow.py \
  && pass "snapshot is the naive ORM .all() baseline" \
  || err "snapshot/summary_slow.py is not the naive baseline"

echo ""
if [[ $fail -eq 0 ]]; then
  echo "== ✅ A6 VALIDATION PASSED =="
else
  echo "== ❌ A6 VALIDATION FAILED =="
fi
exit $fail
