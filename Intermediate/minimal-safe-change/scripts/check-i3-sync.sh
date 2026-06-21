#!/usr/bin/env bash
# check-i3-sync.sh — single-source-of-truth guard for the I3 agent spec.
#
# The canonical agent body lives in I3_agent.md. skills/tasks-safe-change/SKILL.md
# re-publishes that same body with a YAML frontmatter header prepended. This script
# fails (exit 1) if the skill body drifts from the canonical file, so CI catches any
# edit made to one copy but not the other. Frontmatter and surrounding blank lines
# are ignored in the comparison.
set -euo pipefail

# Resolve repo paths relative to this script (scripts/ -> minimal-safe-change/ -> repo root).
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
I3_DIR="$(dirname "$SCRIPT_DIR")"
REPO_ROOT="$(cd "$I3_DIR/../.." && pwd)"

CANON="$I3_DIR/I3_agent.md"
SKILL="$REPO_ROOT/skills/tasks-safe-change/SKILL.md"

for f in "$CANON" "$SKILL"; do
  if [[ ! -f "$f" ]]; then
    echo "check-i3-sync: missing file: $f" >&2
    exit 1
  fi
done

tmp_canon="$(mktemp)"
tmp_skill="$(mktemp)"
trap 'rm -f "$tmp_canon" "$tmp_skill"' EXIT

# Strip a leading YAML frontmatter block (--- ... ---), then trim leading/trailing
# blank lines. Applied to both files so the comparison is frontmatter-agnostic.
strip_normalize() {
  awk '
    NR==1 && $0=="---" { infm=1; next }
    infm && $0=="---"  { infm=0; next }
    infm              { next }
    { print }
  ' "$1" | sed -e '/./,$!d' | awk '{ lines[NR]=$0 } END { last=NR; while (last>0 && lines[last]=="") last--; for (i=1;i<=last;i++) print lines[i] }'
}

strip_normalize "$CANON" > "$tmp_canon"
strip_normalize "$SKILL" > "$tmp_skill"

if diff -u "$tmp_canon" "$tmp_skill" > /tmp/i3-sync.diff 2>&1; then
  echo "✅ check-i3-sync: SKILL.md body is in sync with I3_agent.md"
  exit 0
else
  echo "❌ check-i3-sync: SKILL.md body has DRIFTED from I3_agent.md (canonical)." >&2
  echo "   Re-sync skills/tasks-safe-change/SKILL.md with Intermediate/minimal-safe-change/I3_agent.md." >&2
  echo "   --- diff (canonical vs skill body) ---" >&2
  cat /tmp/i3-sync.diff >&2
  exit 1
fi
