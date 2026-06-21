#!/usr/bin/env bash
# run_a1_analysis.sh — orchestrator entrypoint for the A1 parallel repository analysis.
#
# This task's primary deliverables are *analysis reports* produced by 6 independent
# specialist agents + a coordinator (see docs/agent-analysis/). Re-running the full
# multi-agent fan-out requires an agent runtime and a live TARGET_REPO checkout, which
# are not always present. So this script:
#   * --validate-only  : validate the committed reports (always runnable, no target repo)
#   * (default)        : run evidence capture against TARGET_REPO if set, then validate
#   * --help           : usage
#
# Phases mirror the SKILL.md workflow:
#   Phase 1 Plan  -> Phase 2 Fan-out (6 lanes) -> Phase 3 Cross-verify -> Phase 4 Consolidate
# Live agent fan-out is documented in prompts/ (Phase 2 of the master program). When an
# agent runtime is unavailable, this script captures reproducible grep-based evidence
# instead and validates the existing reports.
set -uo pipefail

A1_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$A1_ROOT/artifacts/repro"
mkdir -p "$LOG_DIR"
RUN_LOG="$LOG_DIR/run_a1_analysis.log"

# Load .env if present (for TARGET_REPO).
if [ -f "$A1_ROOT/.env" ]; then set -a; . "$A1_ROOT/.env"; set +a; fi
TARGET_REPO="${TARGET_REPO:-}"

log() { echo "[$(date -u '+%Y-%m-%dT%H:%M:%SZ' 2>/dev/null || echo now)] $*" | tee -a "$RUN_LOG"; }

usage() {
  cat <<EOF
Usage: run_a1_analysis.sh [--validate-only] [--help]

  --validate-only   Run only the report validator (no target repo needed).
  --help            Show this help.
  (no args)         Capture evidence from \$TARGET_REPO (if set), then validate.

Environment:
  TARGET_REPO   Path to the analyzed repo (android-monorepo). Optional for
                validation; required for live evidence capture. Set in .env
                (copy from .env.example) or export it.

Outputs/logs: $LOG_DIR/
EOF
}

validate() {
  log "Phase: validate committed reports"
  bash "$A1_ROOT/scripts/validate_a1_reports.sh" 2>&1 | tee -a "$RUN_LOG"
  return "${PIPESTATUS[0]}"
}

capture_evidence() {
  if [ -z "$TARGET_REPO" ]; then
    log "TARGET_REPO not set — skipping live evidence capture (validation still runs)."
    return 0
  fi
  if [ ! -d "$TARGET_REPO" ]; then
    log "TARGET_REPO=$TARGET_REPO not a directory — skipping evidence capture."
    return 0
  fi
  log "Phase 2/3: capture evidence from TARGET_REPO=$TARGET_REPO"
  if [ -x "$A1_ROOT/scripts/capture_evidence.sh" ]; then
    TARGET_REPO="$TARGET_REPO" bash "$A1_ROOT/scripts/capture_evidence.sh" 2>&1 | tee -a "$RUN_LOG"
  else
    log "scripts/capture_evidence.sh not present/executable — skipping."
  fi
}

main() {
  : > "$RUN_LOG"
  log "=== A1 parallel repo analysis run ==="
  log "A1_ROOT=$A1_ROOT  TARGET_REPO=${TARGET_REPO:-<unset>}"
  case "${1:-}" in
    --help|-h) usage; exit 0 ;;
    --validate-only) validate; exit $? ;;
    "") capture_evidence; validate; exit $? ;;
    *) echo "Unknown option: $1" >&2; usage; exit 2 ;;
  esac
}
main "$@"
