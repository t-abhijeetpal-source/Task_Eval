# PROMPT-019 — Operational Documentation (P2)

## Objective
Add root `ARCHITECTURE.md`, `CONTRIBUTING.md`, and DevOps runbooks so the repository meets operational documentation standards for onboarding and incident response.

## Problem Description
Excellent task-level docs exist but no system-level architecture doc, no contributor guide, and only A2 has a runbook. Evaluators expect production repos to document how to contribute, deploy, and troubleshoot.

## Root Cause
Portfolio structured as graded tasks rather than unified product documentation.

## Desired Outcome
- `ARCHITECTURE.md`: monorepo map, tier purposes, data flows (A3 polyglot, A2 stack), CI overview mermaid.
- `CONTRIBUTING.md`: branch naming, make bootstrap, pre-commit, PR checklist, evidence culture.
- `DevOps-Infra/RUNBOOK.md`: terraform validate, k8s apply, compose recovery, observability stack startup.
- Cross-links from root README.

## Functional Requirements
1. ARCHITECTURE.md includes mermaid diagram of tiers + deployed app.
2. CONTRIBUTING.md references make targets and CI requirements post-PROMPT-001.
3. Runbook: symptom → diagnosis → fix for common failures (SQLite locked, port in use, mise missing).

## Non-Functional Requirements
- Docs accurate to current repo state — no stale paths.
- Readable in <15 min for new contributor.

## Technical Constraints
- Documentation only — no code changes unless fixing broken doc links.

## Best Practices
- ADR template optional in `docs/adr/`.
- Keep honest "portfolio not product" framing.

## Implementation Steps
1. Inventory existing READMEs — extract architecture facts.
2. Draft ARCHITECTURE.md with tier table + flagship flows.
3. Draft CONTRIBUTING.md from Makefile + CI workflows.
4. Consolidate DevOps troubleshooting from task READMEs into RUNBOOK.md.
5. Link from root README.

## Files/Modules to Modify
- `ARCHITECTURE.md` (new)
- `CONTRIBUTING.md` (new)
- `DevOps-Infra/RUNBOOK.md` (new)
- `README.md` (links)

## Testing Requirements
- Peer review: follow CONTRIBUTING on fresh clone mentally — no dead ends.
- All linked paths exist (`markdown-link-check` optional).

## Verification Steps
```bash
test -f ARCHITECTURE.md && test -f CONTRIBUTING.md
grep -l RUNBOOK DevOps-Infra/RUNBOOK.md
```

## Documentation Requirements
- Self-referential: CONTRIBUTING mentions how to update ARCHITECTURE on structural changes.

## Acceptance Criteria
- [ ] Three new docs committed
- [ ] Root README links to them
- [ ] No broken internal links

## Expected Score Improvement
Documentation +1.0 → **+1.0 points**

## Production-Grade Recommendations
- MkDocs or Docusaurus site for unified docs portal.
- On-call rotation doc if ever operationalized.
