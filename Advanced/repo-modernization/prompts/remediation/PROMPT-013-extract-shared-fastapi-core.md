# PROMPT-013 — Extract Shared FastAPI Core (P2)

## Objective
Eliminate verbatim duplication between `Intermediate/dockerize-service` and `Intermediate/polyglot-currency-pair/fastapi-service` by extracting shared conversion logic into a reusable package.

## Problem Description
`dockerize-service` is a stripped copy of the currency FastAPI service with middleware added. Changes must be made twice; drift is inevitable. Evaluators penalize copy-paste architecture.

## Root Cause
I5 task required dockerizing "a service" — duplicated I4 rather than importing shared module (partial exception: `currency_core` exists for Python logic but HTTP layer duplicated).

## Desired Outcome
- Shared package `Intermediate/shared/currency-api/` or extend `currency_core` with FastAPI router factory.
- Both I4 and I5 import same router + service layer; I5 adds only observability/docker-specific wiring.
- Single test suite for core logic; thin integration tests per deployment variant.

## Functional Requirements
1. Extract routes, services, schemas common to both apps.
2. dockerize-service `main.py` becomes thin: mount shared router + extra middleware.
3. No behavior change — all existing tests pass without modification of assertions.

## Non-Functional Requirements
- Shared package installable via editable pip path in both requirements.txt.
- Clear module boundaries documented.

## Technical Constraints
- TDD — extract with tests passing at each step.
- Do not break I4 node-client integration or I5 Docker HEALTHCHECK.

## Best Practices
- DRY at domain layer, not premature abstraction at infra layer.
- Follow existing `currency_core` pattern in `Intermediate/shared/`.

## Implementation Steps
1. Diff I4 fastapi-service vs dockerize-service — list identical files.
2. Move identical modules to `shared/currency-api/`.
3. Update imports in both apps.
4. Consolidate duplicate tests or use parametrized tests against both app factories.
5. Run `make test`, I4 verify, dockerize CI workflow.

## Files/Modules to Modify
- `Intermediate/shared/currency-api/` (new)
- `Intermediate/polyglot-currency-pair/fastapi-service/`
- `Intermediate/dockerize-service/`
- Related tests and requirements.txt

## Testing Requirements
- All I4 and I5 tests green.
- No duplicate source files >80% similar (verify with diff stat).

## Verification Steps
```bash
make i4-verify
# dockerize-service CI workflow locally: pytest in dockerize-service
```

## Documentation Requirements
- shared package README with usage for new FastAPI services.

## Acceptance Criteria
- [ ] Single source for currency HTTP logic
- [ ] Both services pass tests
- [ ] dockerize-service main.py < 50 lines

## Expected Score Improvement
Architecture +1.0, Maintainability +0.5 → **+1.5 points**

## Production-Grade Recommendations
- Publish shared wheel internally if repo grows.
- Add import-linter rule forbidding cross-task duplication.
