# PROMPT-012 — Remove Dead Nested CI Workflow (P2)

## Objective
Delete the non-functional CI workflow nested inside `Advanced/parallel-expense-tracker/.github/` and document that GitHub only executes repo-root workflows.

## Problem Description
`Advanced/parallel-expense-tracker/.github/workflows/ci.yml` never runs on GitHub (workflows must live at repository root). A superseding workflow exists at `.github/workflows/a2-parallel-expense-tracker.yml`. The dead copy causes onboarding confusion and duplicate maintenance risk.

## Root Cause
Early A2 task placed workflow in project folder before monorepo CI relocation pattern was established.

## Desired Outcome
- Remove nested `.github/workflows/ci.yml` under A2.
- Add note in A2 README pointing to root `a2-parallel-expense-tracker.yml`.
- Optional: add CI redirect comment in A2 docs/agent-analysis if referenced.

## Functional Requirements
1. Delete dead workflow file(s) only — no behavior change (root workflow already covers A2).
2. Grep repo for references to nested path; update docs.

## Non-Functional Requirements
- Zero CI regression — root workflow unchanged.

## Technical Constraints
- Tooling/docs only — no application code.

## Best Practices
- Single source of truth for CI at repo root.
- Path-filtered workflows per task pattern documented in CONTRIBUTING.

## Implementation Steps
1. Confirm `.github/workflows/a2-parallel-expense-tracker.yml` covers all steps in nested file.
2. Diff nested vs root workflow — port any missing steps to root if found.
3. Delete `Advanced/parallel-expense-tracker/.github/workflows/ci.yml`.
4. Remove empty `.github` dirs if orphaned.
5. Update A2 README CI section.

## Files/Modules to Modify
- `Advanced/parallel-expense-tracker/.github/workflows/ci.yml` (delete)
- `Advanced/parallel-expense-tracker/README.md`
- Any docs referencing nested CI path

## Testing Requirements
- Trigger root A2 workflow via path-filtered PR — still green.

## Verification Steps
```bash
test ! -f Advanced/parallel-expense-tracker/.github/workflows/ci.yml && echo OK
gh workflow list  # shows a2-parallel-expense-tracker only
```

## Documentation Requirements
- Short note in root README CI section: "All workflows live at .github/workflows/."

## Acceptance Criteria
- [ ] Nested workflow removed
- [ ] Root A2 workflow still passes
- [ ] Docs updated

## Expected Score Improvement
CI/CD +0.5, DX +0.5 → **+1.0 points**

## Production-Grade Recommendations
- Add CI architecture ADR explaining path-filter vs monorepo-wide gates (PROMPT-001).
