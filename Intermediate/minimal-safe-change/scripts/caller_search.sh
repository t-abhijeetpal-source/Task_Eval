#!/usr/bin/env bash
# caller_search.sh — bound the blast radius of a change by listing inbound callers.
#
# Usage:   ./scripts/caller_search.sh <symbol> [search_root]
# Example: ./scripts/caller_search.sh date_string_to_timestamp sandbox
#
# Prints a file:line table of every reference to <symbol> plus a total count.
# Prefers ripgrep (rg); falls back to grep -rn. Always exits 0 — zero matches is a
# valid, informative result (the symbol is unused / safe to change), not an error.
set -euo pipefail

SYMBOL="${1:-}"
SEARCH_ROOT="${2:-.}"

if [[ -z "$SYMBOL" ]]; then
  echo "usage: $0 <symbol> [search_root]" >&2
  exit 2
fi

echo "Caller search for '${SYMBOL}' under '${SEARCH_ROOT}'"
echo "----------------------------------------------------------------------"

if command -v rg >/dev/null 2>&1; then
  matches="$(rg --line-number --no-heading --color never \
    --glob '!**/.venv/**' --glob '!**/node_modules/**' --glob '!**/.git/**' \
    --glob '!**/__pycache__/**' \
    -- "$SYMBOL" "$SEARCH_ROOT" 2>/dev/null || true)"
else
  matches="$(grep -rn \
    --exclude-dir=.venv --exclude-dir=node_modules --exclude-dir=.git \
    --exclude-dir=__pycache__ \
    -- "$SYMBOL" "$SEARCH_ROOT" 2>/dev/null || true)"
fi

if [[ -n "$matches" ]]; then
  printf '%s\n' "$matches"
  count="$(printf '%s\n' "$matches" | grep -c '' || true)"
else
  count=0
fi

echo "----------------------------------------------------------------------"
echo "Total references: ${count}"
exit 0
