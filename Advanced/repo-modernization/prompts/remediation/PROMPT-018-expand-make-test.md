# PROMPT-018 — Expand make test to Full Repository (P2)

## Objective
Extend root Makefile `test` target to include all DevOps-Infra Python test suites and update README badge to reflect accurate total test count (~104 cases).

## Problem Description
`make test` runs 85 cases but repo contains ~104 per prior audit. DevOps-Infra projects (reproducible-dev-env, kubernetes-manifests, ci-pipeline, observability-bolt-on) are omitted. README "85 passing" undercounts and misleads.

## Root Cause
Makefile `PY_PROJECTS` list hardcoded to five paths; DevOps tier added later without Makefile update.

## Desired Outcome
- New Makefile variables: `DEVOPS_PY_PROJECTS` with four paths.
- Target `make test-devops` or fold into `make test`.
- README badge updated to actual count after verification (`make test 2>&1 | grep passed` aggregate).
- Optional: `make test-all` alias.

## Functional Requirements
1. All 104+ tests run in single `make test`.
2. Failure in DevOps project fails entire target.
3. Document runtime expectation (~5-10 min full suite).

## Non-Functional Requirements
- Idempotent venv creation per project (existing pattern).
- Clear echo banners per project.

## Technical Constraints
- Some DevOps tests may need docker — skip cleanly if unavailable (document unlike core tests).

## Best Practices
- Single source of truth for project lists in Makefile.
- Generate project list from script optional future improvement.

## Implementation Steps
1. Count tests per project: `pytest --collect-only -q`.
2. Add DevOps paths to Makefile.
3. Run full `make test` locally; fix any failures.
4. Update README badge number and verification table.

## Files/Modules to Modify
- `Makefile`
- `README.md` (test count section)

## Testing Requirements
- Full `make test` green on clean clone after `make bootstrap`.

## Verification Steps
```bash
make clean && make test
# Sum passed counts == README claim
```

## Documentation Requirements
- README verification table lists all projects and counts.

## Acceptance Criteria
- [ ] make test includes DevOps suites
- [ ] README count matches reality
- [ ] All green locally

## Expected Score Improvement
Testing +0.5, DX +0.5 → **+1.0 points**

## Production-Grade Recommendations
- Wire full make test into PROMPT-001 CI workflow.
