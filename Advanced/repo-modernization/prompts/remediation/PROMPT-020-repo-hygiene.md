# PROMPT-020 — Repository Hygiene (P3)

## Objective
Remove orphaned root `node_modules/` without a root `package.json`, add appropriate `.gitignore` entries, and prevent recurrence of vendored artifact commits.

## Problem Description
Repository root contains `node_modules/` (markdown/remark packages) with no root `package.json`. Increases clone size and confuses tooling. Prior audit flagged ~99.7% of line count as vendored deps if committed.

## Root Cause
Ad-hoc npm install at repo root for doc tooling without package manifest or gitignore update.

## Desired Outcome
- Remove root `node_modules/` from working tree and ensure not tracked (`git ls-files node_modules` empty).
- If root doc tooling needed: add minimal `package.json` + lockfile at root OR move tooling to `scripts/docs/`.
- Strengthen `.gitignore` for `.next/`, `target/`, `.venv/`, coverage output.
- Optional: `scripts/check-hygiene.sh` in CI failing if node_modules at root without package.json.

## Functional Requirements
1. `git status` clean after clone — no accidental vendored dirs tracked.
2. Document in CONTRIBUTING: never commit node_modules.

## Non-Functional Requirements
- No impact on per-project npm installs.

## Technical Constraints
- Verify nothing depends on root node_modules before deletion.
- Do not delete tracked files user intentionally committed without checking git ls-files.

## Best Practices
- Each project owns its node_modules locally.
- use gitignore-global patterns for OS files.

## Implementation Steps
1. `git ls-files node_modules | head` — if tracked, git rm -r --cached.
2. Delete root node_modules if untracked orphan.
3. Grep scripts for root node module imports.
4. Update .gitignore.
5. Add CI hygiene check (optional one-liner).

## Files/Modules to Modify
- `.gitignore`
- Root `node_modules/` (delete)
- Optional: `scripts/check-hygiene.sh`, CI step

## Testing Requirements
- Fresh clone + make bootstrap unaffected.

## Verification Steps
```bash
test ! -d node_modules || test -f package.json
git ls-files | grep node_modules | wc -l  # expect 0
```

## Documentation Requirements
- CONTRIBUTING: dependency install rules.

## Acceptance Criteria
- [ ] No orphan root node_modules
- [ ] gitignore covers build artifacts
- [ ] make bootstrap still works

## Expected Score Improvement
DX +0.5, Maintainability +0.5 → **+1.0 points**

## Production-Grade Recommendations
- pre-commit hook blocking large files / node_modules commits.
- Git LFS only if truly needed.
