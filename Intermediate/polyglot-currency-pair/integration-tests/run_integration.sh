#!/usr/bin/env bash
# I4 end-to-end integration test:
#   Node CLI -> HTTP POST /convert -> FastAPI (currency_core router) -> 200 -> CLI output
# Runs the REAL components against the locked contract (../CONTRACT.md):
#   * all 6 rate pairs produce the exact contracted output line
#   * all 4 CLI exit codes (0 success, 1 server error, 2 bad args, 3 unavailable)
# Fails loudly rather than testing a stale server: frees the port first and verifies health.
set -u

# Resolve the component root from this script's location (robust to moves/renames).
I4="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT="${I4_PORT:-8744}"
RUNDIR="$I4/integration-tests/.run"
PYBIN="$I4/fastapi-service/.venv/bin/python"
API="http://localhost:$PORT"

# A port with (almost certainly) nothing listening — used for the unavailable path.
DEAD_API="http://localhost:8799"

pass=0
# Teardown frees the port directly: killing the subshell ($SP) does not always
# reap the uvicorn grandchild, so target the actual listener.
teardown() {
  [ -n "${SP:-}" ] && kill "$SP" 2>/dev/null
  # SIGTERM the listener, give uvicorn a moment to release the socket, then SIGKILL.
  local listeners; listeners=$(lsof -tiTCP:"$PORT" -sTCP:LISTEN 2>/dev/null)
  [ -n "$listeners" ] && kill $listeners 2>/dev/null
  for _ in 1 2 3 4 5 6 7 8; do
    listeners=$(lsof -tiTCP:"$PORT" -sTCP:LISTEN 2>/dev/null)
    [ -z "$listeners" ] && return 0
    sleep 0.25
  done
  [ -n "$listeners" ] && kill -9 $listeners 2>/dev/null
}
fail() { echo "FAIL: $1"; teardown; exit 1; }
check() { # check "<label>" "<expected>" "<actual>"
  if [ "$2" = "$3" ]; then echo "  PASS  $1"; pass=$((pass+1));
  else fail "$1 — expected [$2], got [$3]"; fi
}

# 0. preconditions + free the port
[ -x "$PYBIN" ] || fail "service venv missing ($PYBIN) — run: make i4-verify (or build the venv)"
[ -d "$I4/node-client/node_modules" ] || ( cd "$I4/node-client" && npm install --silent ) || fail "npm install failed"
OLD=$(lsof -tiTCP:$PORT -sTCP:LISTEN 2>/dev/null); [ -n "$OLD" ] && { echo "freeing port $PORT (killing $OLD)"; kill $OLD 2>/dev/null; sleep 1; }
rm -rf "$RUNDIR"; mkdir -p "$RUNDIR"

echo "== starting FastAPI on :$PORT =="
( cd "$I4/fastapi-service" && "$PYBIN" -m uvicorn app.main:app --port "$PORT" >"$RUNDIR/api.log" 2>&1 ) &
SP=$!
UP=""
for _ in $(seq 1 40); do
  if ! kill -0 "$SP" 2>/dev/null; then fail "uvicorn died on startup; see api.log:\n$(cat "$RUNDIR/api.log")"; fi
  if curl -s "$API/health" >/dev/null 2>&1; then UP=1; break; fi
  sleep 0.25
done
[ -n "$UP" ] || fail "server did not become healthy on :$PORT"
grep -q "address already in use" "$RUNDIR/api.log" && fail "port $PORT was occupied — refusing to test a stale server"

cli() { ( cd "$I4/node-client" && API_URL="$1" node src/convert.js "${@:2}" ); }

echo "== all 6 rate pairs (Node CLI -> live FastAPI) =="
check "USD->INR" "100 USD = 8300 INR" "$(cli "$API" 100 USD INR)"
check "USD->EUR" "100 USD = 92 EUR"   "$(cli "$API" 100 USD EUR)"
check "INR->USD" "100 INR = 1.2 USD"  "$(cli "$API" 100 INR USD)"
check "EUR->USD" "100 EUR = 108 USD"  "$(cli "$API" 100 EUR USD)"
check "INR->EUR" "100 INR = 1.1 EUR"  "$(cli "$API" 100 INR EUR)"
check "EUR->INR" "100 EUR = 9000 INR" "$(cli "$API" 100 EUR INR)"

echo "== exit codes (the locked CLI contract) =="
cli "$API" 100 USD INR >/dev/null 2>&1;     check "exit 0 (success)"        "0" "$?"
cli "$API" 100 USD GBP >/dev/null 2>&1;     check "exit 1 (unsupported)"    "1" "$?"
cli "$API" 100 USD     >/dev/null 2>&1;     check "exit 2 (bad args)"       "2" "$?"
cli "$DEAD_API" 100 USD INR >/dev/null 2>&1; check "exit 3 (unavailable)"   "3" "$?"

echo "== precision over real HTTP (string amount stays exact) =="
check "0.30 USD->USD" "0.30 USD = 0.3 USD" "$(cli "$API" 0.30 USD USD)"

teardown
echo "INTEGRATION: PASS ($pass checks)"
exit 0
