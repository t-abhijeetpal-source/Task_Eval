#!/usr/bin/env bash
# Symlink Tasks Agent skills into Cursor's global skills directory.
# Only touches tasks-* entries — preserves existing FE/BE Agent symlinks.
# See: https://cursor.com/docs/skills
set -euo pipefail

PLUGIN_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="${CURSOR_SKILLS_DIR:-$HOME/.cursor/skills}"
SRC="${PLUGIN_ROOT}/skills"

if [[ ! -d "$SRC" ]]; then
  echo "Error: skills directory not found at $SRC" >&2
  exit 1
fi

mkdir -p "$DEST"

# Prune broken tasks-* symlinks only
pruned=0
for entry in "$DEST"/tasks-*/; do
  [[ -e "$entry" || -L "$entry" ]] || continue
  entry="${entry%/}"
  if [[ -L "$entry" && ! -e "$entry" ]]; then
    rm -f "$entry"
    echo "Pruned stale: $(basename "$entry")"
    (( pruned++ )) || true
  fi
done
[[ $pruned -eq 0 ]] && echo "No stale tasks-* symlinks found"

linked=0
for skill_dir in "$SRC"/tasks-*/; do
  [[ -d "$skill_dir" ]] || continue
  name="$(basename "$skill_dir")"
  target="$DEST/$name"
  if [[ -e "$target" || -L "$target" ]]; then
    rm -rf "$target"
  fi
  ln -s "$skill_dir" "$target"
  echo "Linked $name -> $skill_dir"
  (( linked++ )) || true
done

if [[ $linked -eq 0 ]]; then
  echo "Error: no tasks-* skill directories found in $SRC" >&2
  exit 1
fi

echo ""
echo "Done. Linked $linked Tasks Agent skill(s) to $DEST"
echo "Restart Cursor or run Developer: Reload Window, then type /tasks in Agent chat."
