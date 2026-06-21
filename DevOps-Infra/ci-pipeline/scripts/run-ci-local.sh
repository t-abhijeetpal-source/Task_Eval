#!/usr/bin/env bash
# Local execution of the EXACT pipeline stages defined in .github/workflows/ci.yml,
# mirroring deterministic install + fail-fast ordering. Captures per-stage timing + exit codes.
#
# Stage map (matches ci.yml):
#   1-lint        ruff check + format + mypy
#   2-unit        pytest unit (fast pure-logic gate, --no-cov)
#   3-integration pytest integration + build-artifact (coverage gate --cov-fail-under=80)
#   3b-security   pip-audit on the runtime lockfile
#   4-build       compile + build-info.json + zip artifact
#   5-container   docker build (multi-stage, non-root)
#   5b-smoke      run container, curl /health + /add, always clean up
set -uo pipefail
cd "$(dirname "$0")/.."
SHA="$(git rev-parse --short HEAD 2>/dev/null || echo local)"
IMAGE="d3-sample"
SMOKE_NAME="d3-smoke-local"
SMOKE_PORT="18080"

# Always remove the smoke-test container, however the script exits.
cleanup() { docker rm -f "$SMOKE_NAME" >/dev/null 2>&1 || true; }
trap cleanup EXIT

run_stage() {
  local name="$1"; shift
  echo "===== [$(date '+%H:%M:%S')] STAGE: ${name} ====="
  local t0=$SECONDS
  "$@"
  local rc=$?
  echo "----- stage '${name}' exit=${rc} duration=$((SECONDS - t0))s -----"
  if [ "$rc" -ne 0 ]; then
    echo "❌ PIPELINE FAILED at stage: ${name} (exit ${rc}) — downstream stages skipped (fail-fast)"
    exit "$rc"
  fi
  echo ""
}

# Canonical runtime is Python 3.12 (matches CI). Prefer it locally; warn on drift.
PY="$(command -v python3.12 || true)"
if [ -z "$PY" ]; then
  PY="$(command -v python3)"
  echo "⚠️  python3.12 not found; using $($PY --version 2>&1) — CI runs 3.12 (local/CI version drift)."
fi

# Deterministic dependency install from the lockfile (mirrors CI).
[ -d .venv ] || "$PY" -m venv .venv
# shellcheck disable=SC1091
. .venv/bin/activate
pip install -q -r requirements-dev.txt

smoke_test() {
  docker run -d --name "$SMOKE_NAME" -p "${SMOKE_PORT}:8000" "${IMAGE}:${SHA}" >/dev/null
  local i
  for i in $(seq 1 30); do
    curl -fs "http://localhost:${SMOKE_PORT}/health" >/dev/null 2>&1 && break
    sleep 1
  done
  echo "health: $(curl -fs "http://localhost:${SMOKE_PORT}/health")" || return 1
  echo "add:    $(curl -fs "http://localhost:${SMOKE_PORT}/add?a=2&b=3")" || return 1
  curl -fs "http://localhost:${SMOKE_PORT}/health" >/dev/null || return 1
  curl -fs "http://localhost:${SMOKE_PORT}/add?a=2&b=3" >/dev/null || return 1
  cleanup
}

run_stage "1-lint"        bash -c "ruff check . && ruff format --check . && mypy app"
run_stage "2-unit"        python -m pytest tests/test_unit.py -q --no-cov
run_stage "3-integration" python -m pytest tests/test_integration.py tests/test_build_artifact.py -q
run_stage "3b-security"   pip-audit -r requirements.txt --strict
run_stage "4-build"       bash -c "python -m compileall -q app && printf '{\"commit\":\"%s\",\"built_at\":\"%s\"}\n' \"$SHA\" \"$(date -u +%FT%TZ)\" > build-info.json && zip -qr \"d3-app-${SHA}.zip\" app requirements.txt build-info.json && echo \"artifact: d3-app-${SHA}.zip\""
# Use BuildKit when buildx is present; fall back to the legacy builder otherwise
# (CI uses docker/setup-buildx-action so it always gets BuildKit).
DOCKER_BUILD_ENV=()
docker buildx version >/dev/null 2>&1 || DOCKER_BUILD_ENV=(env DOCKER_BUILDKIT=0)
run_stage "5-container"   "${DOCKER_BUILD_ENV[@]}" docker build -q -t "${IMAGE}:${SHA}" -t "${IMAGE}:latest" .
run_stage "5b-smoke"      smoke_test

echo "✅ ALL STAGES PASSED (commit ${SHA})"
