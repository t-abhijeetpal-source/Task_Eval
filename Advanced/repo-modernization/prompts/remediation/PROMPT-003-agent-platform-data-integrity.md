# PROMPT-003 — agent-platform Data Integrity & Demo Labeling (P0)

## Objective
Eliminate fabricated "live platform" metrics and remove developer-machine path leaks from the deployed static site; replace with honest demo labeling or real data sources.

## Problem Description
The live AgentOS dashboard presents hardcoded metrics, activity feeds, and trend charts as if operational. `agent-platform/src/lib/data.ts:459` ships `/Users/abhijeetpal/Desktop/workspace/android-monorepo` into the public JavaScript bundle. This is an architectural integrity failure for evaluators and a minor information-disclosure issue.

## Root Cause
The site was bootstrapped with placeholder/demo literals that were never replaced before Vercel deployment. No separation between "demo fixtures" and "live metrics."

## Desired Outcome
- Remove all absolute local filesystem paths from committed/bundled code.
- Dashboard metrics either: (a) computed from real repo artifacts at build time, or (b) clearly labeled **"Demo data — illustrative only"** in UI.
- Activity feed timestamps static but labeled; or generated from git log at build time.
- Author name/path references use repo-relative paths only (`Advanced/parallel-repo-analysis`, not `/Users/...`).

## Functional Requirements
1. Grep and eliminate `/Users/` paths from `agent-platform/src/**`.
2. Add visible "Demo" badge on dashboard metrics section.
3. Optional build script: ingest `docs/agent-analysis/*.md` mtime/count for real-ish stats.
4. Update `agents-content.json` generation if paths are embedded there.

## Non-Functional Requirements
- No runtime backend required (keep static SSG compatible).
- Bundle size must not increase >10%.
- Accessibility: demo labels must be readable (not tooltip-only).

## Technical Constraints
- TDD for any new data helper functions.
- Do not invent fake "live" numbers — honesty over polish.
- Preserve existing navigation and agent catalog UX.

## Best Practices
- Separate modules: `demoMetrics.ts` vs `repoStats.ts` (build-time).
- Use Next.js `generateStaticParams` / build-time fs read for real counts.
- Environment variable `DEMO_MODE=true` default for clarity.

## Implementation Steps
1. Audit `src/lib/data.ts`, `agents-content.json`, components consuming metrics.
2. Remove/replace hardcoded paths with repo-relative strings.
3. Add UI disclaimer component `<DemoDataBanner />`.
4. Optional: `scripts/build-stats.ts` run in `prebuild` — count tasks, tests from Makefile output.
5. Write tests asserting no `/Users/` in exported data helpers.
6. Deploy preview; verify bundle with `next build && grep -r "/Users/" .next/` → empty.

## Files/Modules to Modify
- `agent-platform/src/lib/data.ts`
- `agent-platform/src/components/*` (dashboard, metrics)
- `agent-platform/src/content/agents-content.json` (if needed)
- `agent-platform/scripts/build-stats.ts` (optional, new)

## Testing Requirements
- Test: `getAgentMetrics()` contains no absolute paths.
- Test: demo banner renders on dashboard route.
- Snapshot test for metrics section includes "Demo" label.

## Verification Steps
```bash
cd agent-platform
npm test
npm run build
grep -r "/Users/" .next/static/ && echo FAIL || echo PASS
```

## Documentation Requirements
- README section: "Data sources — static demo vs build-time repo stats."
- Update audit finding F-003 status.

## Acceptance Criteria
- [ ] Zero `/Users/` paths in source or build output
- [ ] Dashboard clearly labeled as demo OR uses build-time real counts
- [ ] Tests pass; build green
- [ ] Live site redeployed

## Expected Score Improvement
Production Readiness +1.5, Architecture +1.0, Security +0.5 → **+3.0 points**

## Production-Grade Recommendations
- If real metrics needed later: lightweight API route reading GitHub API (rate-limited, cached).
- Add content-security-policy (PROMPT-017) alongside this change.
