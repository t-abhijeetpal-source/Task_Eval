# PROMPT-001 — Monorepo-Wide CI Gate (P0)

## Objective
Create a root GitHub Actions workflow that runs the full polyglot test suite (`make test` or equivalent) on every push/PR to `main`, enforcing the README's "85+ passing" claim with automated regression protection.

## Problem Description
CI currently exercises only a fraction of the repository. Root `ci.yml` scopes to `DevOps-Infra/ci-pipeline` (5 tests). Task-specific workflows are path-filtered and never run Rust, Node, or Basics Python on unrelated changes. A developer can break `Basics/rust-logcount-cli` and merge with zero CI signal.

## Root Cause
CI was built per-task (D3 demo, A2, A6, I1, I3) without a coordinating monorepo gate. The Makefile already defines the canonical test matrix but CI never invokes it.

## Desired Outcome
- One workflow `monorepo-verify.yml` at `.github/workflows/` runs on all pushes/PRs to protected branches.
- Rust (13), Node (30), Python (85+), I1, I3, I4 verifiers all execute and must pass.
- Workflow uses `mise` or explicit runtime versions matching `mise.toml` (Python 3.12.7, Node 22.11.0, Rust 1.83.0).
- README badge links to this workflow status.

## Functional Requirements
1. Job matrix or sequential stages: `rust` → `node` → `python` → `i1-verify` → `i3-verify` → `i4-verify`.
2. Cache: `cargo` registry, npm, pip per project path.
3. Upload JUnit/XML artifacts on failure.
4. `workflow_dispatch` for manual re-runs.
5. Concurrency group with cancel-in-progress.

## Non-Functional Requirements
- Wall time ≤ 15 minutes on `ubuntu-latest` (parallelize rust/node where possible).
- Deterministic: pin actions (`@v4`), use lockfiles (`package-lock.json`, `Cargo.lock`).
- No secrets required for test execution.

## Technical Constraints
- Do not modify application logic — CI/tooling only.
- Some paths contain spaces — quote in shell loops (see root `Makefile:17-19`).
- `i4-verify` starts live HTTP — ensure port binding works in CI (use ephemeral ports if needed).

## Best Practices
- Mirror Makefile targets exactly — single source of truth.
- Fail fast: rust before node before python.
- Emit `$GITHUB_STEP_SUMMARY` with per-language pass counts.

## Implementation Steps
1. Read root `Makefile` — identify all targets in `make test`.
2. Create `.github/workflows/monorepo-verify.yml`:
   - `actions/checkout@v4`
   - Install mise OR setup-python/node + rust-toolchain with pinned versions
   - Run `make rust`, `make node`, `make python`, `make i1-verify`, `make i3-verify`, `make i4-verify`
3. Add status badge to root `README.md` (optional, if user approves doc change).
4. Verify on a feature branch via `workflow_dispatch`.

## Files/Modules to Modify
- `.github/workflows/monorepo-verify.yml` (new)
- Optionally `README.md` (badge)

## Testing Requirements
- Trigger workflow on a branch; confirm all stages green.
- Introduce intentional failure in a Rust test on a throwaway branch; confirm CI fails and reports which stage.

## Verification Steps
```bash
# Local pre-check
make test
# After merge: GitHub Actions → monorepo-verify → all green
```

## Documentation Requirements
- Add section to root README under "Verification" noting CI enforces full suite.
- Update `Advanced/repo-modernization/docs/agent-analysis/A4_engineering_evaluation_audit.md` finding F-001 status.

## Acceptance Criteria
- [ ] Workflow runs on every push/PR to main
- [ ] All Makefile test targets pass in CI
- [ ] Failure in any language blocks merge (if branch protection enabled)
- [ ] No application code changed

## Expected Score Improvement
CI/CD +2.0, Testing +1.5 → **+3.5 points**

## Production-Grade Recommendations
- Add required status check in GitHub branch protection.
- Consider nightly scheduled run + Slack notification on failure.
- Split into parallel jobs once stable to reduce wall time.
