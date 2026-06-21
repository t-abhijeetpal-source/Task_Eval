#!/usr/bin/env bash
# capture_evidence.sh — reproduce the A1 headline counts directly from $TARGET_REPO.
# Writes timestamped grep/find evidence to artifacts/repro/. Re-runnable; read-only on target.
#
# Without TARGET_REPO it cannot capture live numbers — it then prints the documented blocker and
# leaves the committed placeholder evidence in place (still exits 0 so CI/validation don't break).
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
A1_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
OUT="$A1_ROOT/artifacts/repro"
mkdir -p "$OUT"
EV="$OUT/A1_evidence_counts.txt"

if [ -f "$A1_ROOT/.env" ]; then set -a; . "$A1_ROOT/.env"; set +a; fi
TARGET_REPO="${TARGET_REPO:-}"

if [ -z "$TARGET_REPO" ] || [ ! -d "$TARGET_REPO" ]; then
  cat <<EOF
[capture_evidence] BLOCKER: TARGET_REPO not set or not a directory.
  The android-monorepo is not checked out in this environment, so live counts cannot be captured.
  Expected reproduction commands are documented in $OUT/A1_evidence_counts.txt (marked INFERRED).
  To capture for real: set TARGET_REPO in .env to an android-monorepo checkout and re-run.
EOF
  exit 0
fi

T="$TARGET_REPO"
COMMIT="$(git -C "$T" rev-parse HEAD 2>/dev/null || echo unknown)"
{
  echo "# A1 evidence — captured from TARGET_REPO"
  echo "# target_commit: $COMMIT"
  echo "# captured by scripts/capture_evidence.sh (LIVE)"
  echo

  echo "## Files scanned"
  echo "kotlin_equity_src = $(find "$T/equity_sdk" "$T/base_app" "$T/common-database" -name '*.kt' 2>/dev/null | wc -l | tr -d ' ')"
  echo "dart_pml_flutter  = $(find "$T/flutter/pml-flutter/lib" -name '*.dart' 2>/dev/null | wc -l | tr -d ' ')"

  echo "## Modules (settings.gradle)"
  echo "include_lines = $(grep -c '^[[:space:]]*include' "$T/settings.gradle" 2>/dev/null || echo NA)"
  echo "unique_module_refs = $(grep -oE \"':[A-Za-z0-9_:.-]+'\" "$T/settings.gradle" 2>/dev/null | sort -u | wc -l | tr -d ' ')"

  echo "## Retrofit interfaces (equity_sdk)"
  echo "retrofit_service_files = $(grep -rlE '@(GET|POST|PUT|DELETE)' "$T/equity_sdk/src/main" 2>/dev/null | wc -l | tr -d ' ')"
  echo "url_dynamic = $(grep -rohE '@Url' "$T/equity_sdk/src/main" 2>/dev/null | wc -l | tr -d ' ')"

  echo "## Room model"
  echo "foreign_keys = $(grep -rn '@ForeignKey' "$T/common-database/src" "$T/api_failure_logging/src" 2>/dev/null | wc -l | tr -d ' ')"

  echo "## Tests"
  echo "kotlin_Test_kt_repo_wide = $(find "$T" -name '*Test.kt' 2>/dev/null | wc -l | tr -d ' ')"
  echo "dart_test = $(find "$T/flutter/pml-flutter" -name '*_test.dart' 2>/dev/null | wc -l | tr -d ' ')"

  echo "## CI test scope"
  grep -n 'UnitTest' "$T/bitbucket-pipelines.yml" 2>/dev/null | head -5 || echo "bitbucket-pipelines.yml not found"
} | tee "$EV"

echo
echo "[capture_evidence] wrote $EV (commit $COMMIT)"
