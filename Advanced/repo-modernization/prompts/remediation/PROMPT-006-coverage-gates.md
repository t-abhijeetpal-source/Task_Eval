# PROMPT-006 — Test Coverage Gates (P1)

## Objective
Introduce coverage measurement and minimum thresholds across Python, Node, and Rust projects; enforce in CI with `fail_under` gates.

## Problem Description
The repository has 85–104 real tests but zero coverage tracking. Evaluators cannot assess depth. The test-discovery task documents external coverage gates but this repo enforces none.

## Root Cause
Portfolio focused on behavioral tests passing, not quantified coverage metrics.

## Desired Outcome
- Python: `pytest-cov` with per-project `.coveragerc` or `pyproject.toml` `[tool.coverage]`, `fail_under=70` (adjust per maturity).
- Node: Jest `--coverage --coverageThreshold='{"global":{"lines":70}}'`.
- Rust: `cargo tarpaulin` or llvm-cov in CI (threshold 60% for integration-heavy crates).
- CI uploads to Codecov or artifact HTML (optional).
- Root `make coverage` aggregates reports.

## Functional Requirements
1. Add coverage config to each testable project.
2. Extend monorepo CI (PROMPT-001) with coverage step.
3. Exclude test files, venv, migrations from coverage.
4. Document baseline percentages in README (honest numbers).

## Non-Functional Requirements
- Coverage run adds ≤3 min to CI.
- Thresholds set at or below current baseline to avoid immediate red — ratchet up over time.

## Technical Constraints
- Do not write coverage-only tests that assert nothing — meaningful assertions required.
- agent-platform covered in PROMPT-002 separately.

## Best Practices
- Ratchet: CI fails if coverage drops below previous commit.
- Separate unit vs integration coverage reporting.
- Exclude `if __name__ == "__main__"` blocks.

## Implementation Steps
1. Measure current coverage per project (baseline).
2. Set `fail_under` 5 points below baseline.
3. Add pytest-cov to requirements-dev.txt files.
4. Update package.json jest config for Node projects.
5. Add `make coverage` target to root Makefile.
6. Wire into CI workflow.

## Files/Modules to Modify
- Each project's `pytest.ini` / `pyproject.toml` / `package.json`
- Root `Makefile`
- `.github/workflows/monorepo-verify.yml` (or new coverage job)

## Testing Requirements
- Verify coverage fails when a source file has zero test hits (throwaway branch test).

## Verification Steps
```bash
make coverage
# Inspect lcov/html output; confirm fail_under enforced
```

## Documentation Requirements
- README badge or table: current coverage % per tier.
- CONTRIBUTING: "New code must include tests; coverage must not drop."

## Acceptance Criteria
- [ ] Coverage measured for all Python/Node/Rust projects
- [ ] CI fails on threshold breach
- [ ] Baseline documented honestly

## Expected Score Improvement
Testing +1.5, CI/CD +0.5 → **+2.0 points**

## Production-Grade Recommendations
- Codecov GitHub integration with PR comments.
- Diff coverage gate (only changed lines) for faster feedback.
