#!/usr/bin/env bash
# A3 deliverable validation gate (A3-003). Structural + consistency checks that
# do NOT require running the test suites — they catch the failure modes a green
# test run can hide: doc drift, stale counts, scoring logic leaking out of Rust,
# resurfaced clutter, missing artifacts. Run `capture_verification.sh` first so
# VERIFICATION_RESULTS.md reflects a real run; this gate then asserts every
# other doc agrees with it.
set -uo pipefail

A3="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$A3"
PASS=0; FAIL=0
ok()   { printf '  ✅ %s\n' "$1"; PASS=$((PASS+1)); }
bad()  { printf '  ❌ %s\n' "$1"; FAIL=$((FAIL+1)); }
have() { [ -e "$1" ] && ok "exists: $1" || bad "missing: $1"; }

echo "== A3 deliverable validation =="

echo "-- [1] required files --"
for f in CONTRACT.md README.md VERIFICATION_RESULTS.md .env.example mise.toml .gitignore \
         docs/agent-analysis/A3_polyglot_system.md docs/agent-analysis/A3_manifest.json \
         docs/A3_engineering_evaluation_audit.md docs/A3_remediation_tracker.md docs/A3_final_scorecard.md \
         RUNBOOK.md \
         scripts/capture_verification.sh scripts/contract_conformance.sh \
         .github/workflows/a3-polyglot-fraud-system.yml \
         docker-compose.yml fastapi-service/Dockerfile node-worker/Dockerfile \
         prompts/coordinator.md prompts/fastapi-agent.md prompts/node-worker-agent.md prompts/rust-engine-agent.md \
         rust-engine/src/lib.rs fastapi-service/app/routes.py node-worker/src/worker.js \
         integration-tests/run_integration.sh; do
  have "$f"
done

echo "-- [2] test-count consistency (source of truth = VERIFICATION_RESULTS.md) --"
vr="VERIFICATION_RESULTS.md"
# Parse ONLY the Status line (the Env line also has "Rust 1.96.0" / "Node 26.3.0").
status_line=$(grep -m1 '^## Status' "$vr")
RUST_N=$(printf '%s' "$status_line" | grep -Eo 'Rust [0-9]+' | awk '{print $2}')
PY_N=$(printf '%s' "$status_line" | grep -Eo 'FastAPI [0-9]+' | awk '{print $2}')
NODE_N=$(printf '%s' "$status_line" | grep -Eo 'Node [0-9]+' | awk '{print $2}')
[ -n "$RUST_N" ] && [ -n "$PY_N" ] && [ -n "$NODE_N" ] \
  && ok "captured counts: Rust $RUST_N · FastAPI $PY_N · Node $NODE_N" \
  || bad "could not parse captured counts from $vr"

check_counts_in() {
  local file="$1"
  [ -f "$file" ] || { bad "missing for count-check: $file"; return; }
  if grep -q "$RUST_N" "$file" && grep -q "$PY_N" "$file" && grep -q "$NODE_N" "$file"; then
    ok "counts ($RUST_N/$PY_N/$NODE_N) present in $file"
  else
    bad "stale/missing counts in $file (expected $RUST_N/$PY_N/$NODE_N)"
  fi
}
check_counts_in README.md
check_counts_in docs/agent-analysis/A3_polyglot_system.md
check_counts_in docs/agent-analysis/A3_manifest.json

echo "-- [3] no stale count claims (6/7/12 from the pre-hardening run) --"
if grep -REn '\b(6 passed|12 passed|Rust 6|Node 12)\b' README.md docs/agent-analysis/A3_polyglot_system.md VERIFICATION_RESULTS.md 2>/dev/null; then
  bad "found stale pre-hardening counts above"
else
  ok "no stale 6/12 count claims"
fi

echo "-- [4] auth docs corrected (no asserted 'no auth on the API/internal') --"
# Match only the original stale ASSERTION ("No auth on the API ... internal callback"),
# not before/after tables that quote the old wording to show it was fixed.
if grep -REin 'no auth\*{0,2} on the (api|/internal)' docs README.md 2>/dev/null; then
  bad "found stale asserted 'no auth on the API/internal' claim above (it is fail-closed now)"
else
  ok "auth docs reflect fail-closed /internal"
fi

echo "-- [5] scoring logic ONLY in Rust (constitution rule #2) --"
# The +40/+20/+30 weights and reason strings must not be reimplemented in
# Python/Node. (Test fixtures asserting expected scores are allowed.)
if grep -REn 'score *\+?= *(40|20|30)|\+= *40' fastapi-service/app node-worker/src 2>/dev/null; then
  bad "scoring arithmetic found outside Rust above"
else
  ok "no scoring arithmetic in FastAPI/Node source"
fi

echo "-- [6] internal token documented as REQUIRED (not optional) --"
grep -qi 'A3_INTERNAL_TOKEN' .env.example && grep -qi 'required' .env.example \
  && ok ".env.example documents A3_INTERNAL_TOKEN as required" \
  || bad ".env.example must document A3_INTERNAL_TOKEN as required"

echo "-- [7] root clutter not resurfaced --"
if ls Screenshot*.png runtime_*.log .DS_Store >/dev/null 2>&1; then
  bad "loose screenshots / runtime logs / .DS_Store back in root"
else
  ok "root clean (no loose screenshots / runtime logs)"
fi

echo "-- [8] CONTRACT version present --"
grep -qE 'schema_version.*1\.0|v1\.0' CONTRACT.md && ok "CONTRACT.md declares a schema version" || bad "CONTRACT.md missing version"

echo
echo "VALIDATION: $PASS passed, $FAIL failed"
[ "$FAIL" = "0" ] || { echo "DELIVERABLE INVALID"; exit 1; }
echo "DELIVERABLE VALID"
