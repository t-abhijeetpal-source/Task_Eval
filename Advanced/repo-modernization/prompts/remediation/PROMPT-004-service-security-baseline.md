# PROMPT-004 — Application Security Baseline for All Services (P0)

## Objective
Implement a consistent security middleware baseline — authentication hooks, CORS policy, rate limiting, security headers, request body size caps — across all public HTTP services, using `Intermediate/dockerize-service` as the reference implementation.

## Problem Description
Only `dockerize-service` implements CORS, rate limiting, and security headers. All other FastAPI/Express services expose unauthenticated, unthrottled endpoints. Evaluators map this to OWASP A01 (Broken Access Control) and A05 (Security Misconfiguration).

## Root Cause
Services were built as isolated learning exercises without a shared security module or enforced baseline.

## Desired Outcome
- Shared Python module `Intermediate/shared/service-security/` (or similar) exportable by all FastAPI apps.
- Each service: CORS allowlist (env-configurable), rate limit (e.g. 60/min/IP), security headers middleware, max body size.
- API key or JWT auth **stub** on mutating endpoints (configurable, disabled in test via env).
- Express services: `helmet`, `express-rate-limit`, CORS.

## Functional Requirements
1. Extract patterns from `dockerize-service/app/main.py` into reusable module.
2. Apply to: B4 fastapi-transaction, A2 expense-tracker, A3 fraud fastapi, I6 bug-diagnosis, I4 currency (if not already).
3. Node B5: add helmet + rate-limit middleware.
4. Document env vars: `CORS_ORIGINS`, `RATE_LIMIT_PER_MINUTE`, `API_KEY` (optional).
5. Tests: 429 on rate exceed, 401 without API key when enabled, CORS preflight.

## Non-Functional Requirements
- Middleware order: security headers → CORS → rate limit → routes (match dockerize-service).
- Zero perf regression >5ms p50 on health endpoints.
- Fail-closed when misconfigured in production mode (`ENV=production` requires API_KEY).

## Technical Constraints
- TDD: write security tests before middleware integration.
- Do not break existing test suites — use env to disable auth in pytest.
- Minimal diff per service — import shared module, don't copy-paste.

## Best Practices
- Use `slowapi` or Starlette middleware for FastAPI rate limiting.
- Constant-time comparison for API keys (`hmac.compare_digest`).
- Separate `/health` from rate limit (probe exemption).

## Implementation Steps
1. Read `dockerize-service/app/main.py` — catalog middleware stack.
2. Create `shared/service-security/` package with `install_security(app, settings)`.
3. Add failing tests per service for 429/401/CORS.
4. Integrate module into each FastAPI `main.py`.
5. Add helmet/rate-limit to Node B5 `app.js`.
6. Run full `make test`.

## Files/Modules to Modify
- `Intermediate/shared/service-security/` (new package)
- `Basics/fastapi-transaction-service/app/main.py`
- `Advanced/parallel-expense-tracker/app/main.py`
- `Advanced/polyglot-fraud-system/fastapi-service/app/main.py`
- `Intermediate/bug-diagnosis/app/main.py`
- `Basics/node-transaction-service/src/app.js`
- Corresponding `tests/` files

## Testing Requirements
- Per service: ≥3 new security tests (rate, CORS, auth when enabled).
- Existing tests still pass with auth disabled in test env.

## Verification Steps
```bash
make test
# Manual: curl -I localhost:PORT/health → verify security headers
# Manual: rapid curl loop → 429
```

## Documentation Requirements
- Root `SECURITY.md` documenting baseline and env vars.
- Per-service README: security configuration section.

## Acceptance Criteria
- [ ] All public services have CORS + rate limit + headers
- [ ] Auth stub available and tested (optional enable)
- [ ] `make test` green
- [ ] No regression in functional tests

## Expected Score Improvement
Security +2.5, Production Readiness +1.0 → **+3.5 points**

## Production-Grade Recommendations
- Add OAuth2/JWT for real deployments.
- Wire security events to structured logging.
- Add OWASP ZAP baseline scan in CI (PROMPT-008 companion).
