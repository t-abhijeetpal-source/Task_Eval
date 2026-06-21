# PROMPT-011 — Monorepo Lint, Format, and Pre-Commit (P2)

## Objective
Establish root-level linting/formatting configuration and pre-commit hooks for Python, JavaScript/TypeScript, and Rust across the monorepo.

## Problem Description
No root `ruff.toml`, `eslint.config`, or `.pre-commit-config.yaml`. Style enforcement is ad hoc (I3 workflow runs ruff only in sandbox). Evaluators expect consistent code quality gates.

## Root Cause
Polyglot monorepo grew per-task without shared tooling config.

## Desired Outcome
- Root `pyproject.toml` with ruff format + check rules; extends to all Python projects.
- Root or per-project ESLint for Node + agent-platform.
- `rustfmt` + `clippy` in CI (warnings deny or warn).
- `.pre-commit-config.yaml`: ruff, prettier, trailing whitespace, yaml check.
- `make lint` runs all linters.

## Functional Requirements
1. Pre-commit installs via `pre-commit install` documented in CONTRIBUTING.
2. CI lint job runs same commands as pre-commit.
3. Baseline pass on current code — fix or noqa only with justification.

## Non-Functional Requirements
- Pre-commit completes < 30s on typical commit.
- Auto-fix where safe (ruff format, prettier).

## Technical Constraints
- Do not reformat unrelated files in unrelated tasks — one-time baseline commit acceptable.
- Match existing code style where ruff defaults differ.

## Best Practices
- Start with lenient rules; tighten over time.
- Exclude vendored/generated paths in config.
- Use ruff instead of flake8+black+isort combined.

## Implementation Steps
1. Add root `pyproject.toml` [tool.ruff] section.
2. Run `ruff check --fix` and `ruff format` per Python project; review diff.
3. Add ESLint to Node projects + agent-platform.
4. Add clippy to `make rust` or separate `make lint-rust`.
5. Create `.pre-commit-config.yaml`.
6. Add `make lint` and CI job.

## Files/Modules to Modify
- `pyproject.toml` (new at root)
- `.pre-commit-config.yaml` (new)
- `Makefile` (lint target)
- `.github/workflows/monorepo-verify.yml` (lint job)
- Per-project eslint configs if needed

## Testing Requirements
- `make lint` exits 0 on main.
- Pre-commit hook blocks intentionally bad formatting (local test).

## Verification Steps
```bash
pip install pre-commit ruff
pre-commit run --all-files
make lint
```

## Documentation Requirements
- CONTRIBUTING.md: pre-commit setup, lint commands.

## Acceptance Criteria
- [ ] Root ruff + pre-commit configured
- [ ] make lint green
- [ ] CI enforces lint on PRs

## Expected Score Improvement
Code Quality +1.0, DX +0.5 → **+1.5 points**

## Production-Grade Recommendations
- EditorConfig at root for IDE consistency.
- SonarQube or similar for continuous quality (optional).
