# PROMPT-002 — agent-platform CI, Tests, and Error Boundaries (P0)

## Objective
Add automated quality gates and minimal test coverage for the deployed Next.js `agent-platform` site — the portfolio's public front door on Vercel.

## Problem Description
`agent-platform/` has zero tests, zero CI workflow, empty `next.config.ts`, and no React error/loading boundaries. Production deploys are ungated. Any TypeScript or build regression ships directly to the live URL.

## Root Cause
The site was treated as a static showcase rather than a shipped artifact. CI investment focused on backend task folders.

## Desired Outcome
- GitHub Actions workflow: install → lint → typecheck → test → build.
- Vitest or Jest + React Testing Library with ≥5 meaningful tests (data helpers, key components).
- `error.tsx` and `loading.tsx` at appropriate route segments.
- Build must pass with `next build` in CI before merge.

## Functional Requirements
1. Workflow `.github/workflows/agent-platform.yml` path-filtered to `agent-platform/**`.
2. Scripts in `agent-platform/package.json`: `"test"`, `"lint"`, `"typecheck"`, `"build"`.
3. Tests cover: agent list rendering, tier filtering, markdown content loader smoke.
4. ESLint via `eslint-config-next` (already standard for Next 16).

## Non-Functional Requirements
- Test suite completes in < 60s.
- No network calls in unit tests (mock fetch/content).
- Compatible with Next.js 16 App Router conventions.

## Technical Constraints
- Follow TDD: write failing tests before any implementation fixes.
- Read `agent-platform/AGENTS.md` — Next.js 16 may differ from training data.
- Do not break Vercel deployment (verify `next build` output).

## Best Practices
- Co-locate tests: `src/lib/__tests__/`, `src/components/__tests__/`.
- Use `@testing-library/react` — test behavior, not implementation.
- Pin Node 22 to match `mise.toml`.

## Implementation Steps
1. Add devDependencies: vitest, @testing-library/react, @testing-library/jest-dom, jsdom.
2. Configure `vitest.config.ts` with path aliases matching `tsconfig.json`.
3. Write failing tests for critical paths.
4. Add `error.tsx` / `loading.tsx` under `src/app/`.
5. Create CI workflow mirroring local commands.
6. Run `npm test && npm run build` locally; paste green output.

## Files/Modules to Modify
- `agent-platform/package.json`
- `agent-platform/vitest.config.ts` (new)
- `agent-platform/src/**/__tests__/*` (new)
- `agent-platform/src/app/error.tsx`, `loading.tsx` (new)
- `.github/workflows/agent-platform.yml` (new)

## Testing Requirements
- Minimum 5 test cases, all behavioral.
- Build step in CI is mandatory gate.
- Coverage optional in this prompt (see PROMPT-006).

## Verification Steps
```bash
cd agent-platform
npm install
npm test
npm run lint
npm run build
```

## Documentation Requirements
- Update `agent-platform/README.md` with test/build commands.
- Note CI workflow in root README verification section.

## Acceptance Criteria
- [ ] CI workflow green on PR
- [ ] ≥5 tests pass
- [ ] `next build` succeeds
- [ ] error/loading boundaries present

## Expected Score Improvement
Production Readiness +2.0, Testing +1.5, CI/CD +1.0 → **+4.5 points**

## Production-Grade Recommendations
- Add Playwright smoke test for homepage (1 test).
- Wire Vercel preview deployments to require CI pass.
- Add Sentry or similar (see PROMPT-003 companion work).
