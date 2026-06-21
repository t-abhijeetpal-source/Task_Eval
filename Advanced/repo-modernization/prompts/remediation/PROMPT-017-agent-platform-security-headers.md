# PROMPT-017 — agent-platform Security Headers (P2)

## Objective
Configure Next.js security headers (CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy) for the deployed agent-platform site.

## Problem Description
`agent-platform/next.config.ts` is empty — no security headers. Public static site lacks baseline browser protections (clickjacking, XSS mitigation via CSP).

## Root Cause
Next.js default config left unchanged; security headers not in task scope originally.

## Desired Outcome
- `next.config.ts` exports `headers()` async function with production-grade defaults.
- CSP allows Next.js inline requirements (nonce or strict-dynamic pattern for Next 16).
- HSTS enabled for production deployment on Vercel.
- Tests or build-time check validates headers present.

## Functional Requirements
1. Headers on all routes `/(.*)`.
2. CSP compatible with Vercel analytics if used (or disallow until configured).
3. Document override process for new external scripts.

## Non-Functional Requirements
- No break of existing UI (test manually or Playwright).
- Lighthouse security score improvement measurable.

## Technical Constraints
- Read Next.js 16 docs in `node_modules/next/dist/docs/` per AGENTS.md.
- TDD if extracting header config to testable module.

## Best Practices
- Start with report-only CSP (`Content-Security-Policy-Report-Only`) then enforce.
- Use `helmet`-equivalent header set adapted for Next.
- Include `X-Content-Type-Options: nosniff`.

## Implementation Steps
1. Research Next 16 `headers()` API.
2. Add security headers config module.
3. Write test parsing exported header config.
4. Run `next build && next start` — curl -I verify headers.
5. Deploy preview; verify on Vercel.

## Files/Modules to Modify
- `agent-platform/next.config.ts`
- `agent-platform/src/lib/security-headers.ts` (optional, new)
- `agent-platform/src/lib/__tests__/security-headers.test.ts` (new)

## Testing Requirements
- Unit test: header array includes CSP, HSTS, X-Frame-Options.
- Optional Playwright: response headers assertion.

## Verification Steps
```bash
cd agent-platform && npm run build && npm start &
curl -I http://localhost:3000 | grep -i content-security-policy
```

## Documentation Requirements
- README: security headers section, CSP modification guide.

## Acceptance Criteria
- [ ] Security headers on all pages
- [ ] Site renders correctly (no CSP break)
- [ ] Tests pass

## Expected Score Improvement
Security +0.5 → **+0.5 points**

## Production-Grade Recommendations
- CSP reporting endpoint.
- securityheaders.com A rating target.
