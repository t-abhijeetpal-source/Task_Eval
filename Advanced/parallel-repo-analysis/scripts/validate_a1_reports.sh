#!/usr/bin/env bash
# validate_a1_reports.sh — structural + content gate for the A1 parallel-repo-analysis deliverables.
# Exit 0 = all checks pass. Exit 1 = at least one failure. No network, no target repo required.
set -uo pipefail

# Resolve A1 root relative to this script (scripts/ -> A1 root) so it runs from anywhere.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
A1_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DOCS="$A1_ROOT/docs/agent-analysis"

PASS=0
FAIL=0
pass() { printf '  \033[32mPASS\033[0m %s\n' "$1"; PASS=$((PASS+1)); }
fail() { printf '  \033[31mFAIL\033[0m %s\n' "$1"; FAIL=$((FAIL+1)); }

echo "== A1 report validation =="
echo "A1_ROOT=$A1_ROOT"
echo

# ---- Check 1: 9 required markdown files exist --------------------------------
echo "[1] Required deliverable files"
REQUIRED=(
  A1_plan.md A1_inventory.md A1_api_map.md A1_entities.md A1_tests.md
  A1_architecture.md A1_flow_trace.md A1_verification_report.md
  A1_repository_master_report.md
)
for f in "${REQUIRED[@]}"; do
  if [ -f "$DOCS/$f" ]; then pass "exists: $f"; else fail "missing: $f"; fi
done

# ---- Check 2: master report has Metrics + all completion criteria checked ----
echo "[2] Master report structure"
MASTER="$DOCS/A1_repository_master_report.md"
if [ -f "$MASTER" ]; then
  grep -q '^## Metrics' "$MASTER" && pass "master: has Metrics section" || fail "master: missing Metrics section"
  grep -q '^## Completion criteria' "$MASTER" && pass "master: has Completion criteria section" || fail "master: missing Completion criteria section"
  # Every completion-criteria checkbox must be checked: no '- [ ]' lines anywhere.
  if grep -q '^- \[ \]' "$MASTER"; then
    fail "master: has unchecked completion criteria '- [ ]'"
  else
    pass "master: all checkboxes checked (no '- [ ]')"
  fi
else
  fail "master report not found for structure checks"
fi

# ---- Check 3: verification report has Contradictions + spot-checks -----------
echo "[3] Verification report structure"
VERIFY="$DOCS/A1_verification_report.md"
if [ -f "$VERIFY" ]; then
  grep -qi 'contradiction' "$VERIFY" && pass "verify: mentions contradictions" || fail "verify: no contradictions section"
  grep -qi 'spot-check' "$VERIFY" && pass "verify: has spot-checks" || fail "verify: no spot-checks"
else
  fail "verification report not found for structure checks"
fi

# ---- Check 4: no hardcoded absolute user paths -------------------------------
echo "[4] No hardcoded absolute paths"
if grep -rqn '/Users/abhijeetpal' "$DOCS"; then
  fail "found hardcoded /Users/abhijeetpal path(s):"
  grep -rn '/Users/abhijeetpal' "$DOCS" | sed 's/^/        /'
else
  pass "no /Users/abhijeetpal absolute paths in reports"
fi

# ---- Check 5: no wrong entity count in architecture report -------------------
echo "[5] Architecture entity count"
ARCH="$DOCS/A1_architecture.md"
if [ -f "$ARCH" ]; then
  if grep -qi '25 entit' "$ARCH"; then
    fail "architecture: still says '25 entities' (should be 24)"
  else
    pass "architecture: no stale '25 entities'"
  fi
else
  fail "architecture report not found"
fi

# ---- Check 6: each lane report has a VERIFIED label and an Agent header ------
echo "[6] Lane reports: VERIFIED label + Agent header"
LANES=(A1_inventory.md A1_api_map.md A1_entities.md A1_tests.md A1_architecture.md A1_flow_trace.md)
for f in "${LANES[@]}"; do
  p="$DOCS/$f"
  if [ ! -f "$p" ]; then fail "$f: missing"; continue; fi
  grep -q 'VERIFIED' "$p" && grep -qi 'Agent' "$p" \
    && pass "$f: has VERIFIED + Agent header" \
    || fail "$f: missing VERIFIED label or Agent header"
done

# ---- Optional Phase-3 checks: manifest.json keys (only if present) -----------
MANIFEST="$DOCS/A1_manifest.json"
if [ -f "$MANIFEST" ]; then
  echo "[7] Manifest JSON (Phase 3)"
  if command -v python3 >/dev/null 2>&1; then
    python3 - "$MANIFEST" <<'PY'
import json, sys
required = ["target","commit","date","metrics","lanes"]
try:
    d = json.load(open(sys.argv[1]))
except Exception as e:
    print(f"  \033[31mFAIL\033[0m manifest: invalid JSON ({e})"); sys.exit(3)
missing = [k for k in required if k not in d]
if missing:
    print(f"  \033[31mFAIL\033[0m manifest: missing keys {missing}"); sys.exit(3)
print("  \033[32mPASS\033[0m manifest: has keys " + ", ".join(required))
PY
    rc=$?
    if [ $rc -eq 0 ]; then PASS=$((PASS+1)); else FAIL=$((FAIL+1)); fi
  else
    echo "  (python3 not available — skipping manifest key check)"
  fi
fi

echo
echo "== Summary: $PASS passed, $FAIL failed =="
[ "$FAIL" -eq 0 ] || exit 1
echo "ALL A1 REPORT CHECKS PASSED"
