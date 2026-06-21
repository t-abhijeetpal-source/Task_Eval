# PROMPT-010 — Python Lockfiles for Reproducible Builds (P2)

## Objective
Replace range-pinned Python `requirements.txt` files with hash-locked lockfiles using `uv` or `pip-tools`, and wire lock refresh into CI/Makefile.

## Problem Description
Service requirements use ranges (`fastapi>=0.110,<1.0`). Two installs at different times can resolve different versions. Node has package-lock.json; Rust has Cargo.lock; Python is the weak link.

## Root Cause
Python services copied minimal requirements.txt pattern without lock discipline.

## Desired Outcome
- Each Python project: `requirements.in` (ranges) + `requirements.txt` (pinned) OR `uv.lock`.
- `make python` installs from lockfile with `--require-hashes` or `uv sync`.
- CI uses same lockfile; cache key includes lock hash.
- Document lock refresh: `uv lock --upgrade` / `pip-compile --upgrade`.

## Functional Requirements
1. Add locks for all 5+ PY_PROJECTS in Makefile.
2. CI fails if lock out of sync with .in (optional check script).
3. Keep dev dependencies separate (`requirements-dev.txt` locked).

## Non-Functional Requirements
- Lock generation reproducible on Linux/macOS.
- No manual hash editing.

## Technical Constraints
- Do not upgrade major versions during lock introduction — pin current resolved versions.
- DevOps ci-pipeline already has exact pins — use as reference pattern.

## Best Practices
- Prefer `uv` for speed and monorepo workspace support.
- Commit lockfiles; never commit .venv.
- Weekly Dependabot for pip (PROMPT-008).

## Implementation Steps
1. Install uv at repo root or document usage.
2. For each Python project: generate lock from current working venv freeze.
3. Update Makefile `python` target to use `uv sync` or `pip install -r requirements.txt --require-hashes`.
4. Verify `make python` on clean clone.
5. Update README getting started.

## Files/Modules to Modify
- All `**/requirements.txt` and new `requirements.in` / `uv.lock`
- Root `Makefile`
- `mise.toml` (optional uv tool pin)

## Testing Requirements
- Clean clone `make python` green.
- CI pip cache keyed on lock file.

## Verification Steps
```bash
make clean && make python
```

## Documentation Requirements
- README: "Updating Python dependencies" section.

## Acceptance Criteria
- [ ] All Python services have lockfiles
- [ ] make python uses locks
- [ ] CI unchanged behavior, same versions

## Expected Score Improvement
DX +0.5, DevOps +0.5 → **+1.0 points**

## Production-Grade Recommendations
- uv workspace for shared `currency-core` dependency.
- SBOM from lockfiles via syft.
