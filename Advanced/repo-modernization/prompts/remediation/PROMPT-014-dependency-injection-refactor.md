# PROMPT-014 — Dependency Injection Refactor for Python/Node Services (P2)

## Objective
Replace import-time singleton stores with injectable dependencies in Basics FastAPI and Node transaction services, enabling isolated unit tests and multi-worker safety.

## Problem Description
`Basics/fastapi-transaction-service/app/services.py` uses module-level store singleton. Node transaction service instantiates controller dependencies at module load. Tests hit shared mutable state; multiple workers would share in-memory store incorrectly.

## Root Cause
Tutorial-style FastAPI/Express scaffolding optimized for simplicity over testability.

## Desired Outcome
- FastAPI: `Depends(get_transaction_service)` factory; store injected per request or app lifespan.
- Node: `createApp({ store, logger })` factory pattern (partially exists — extend to storage).
- Tests pass explicit in-memory store instances.
- Document pattern in Basics README as teaching artifact.

## Functional Requirements
1. No global mutable singleton for storage in production code path.
2. Existing API behavior unchanged.
3. At least one new test proving isolation (two app instances, separate stores).

## Non-Functional Requirements
- Minimal API latency impact.
- Match patterns from `polyglot-currency-pair/node-client` (best-in-repo DI).

## Technical Constraints
- TDD — write isolation test first (should fail on singleton).
- Small diff — Basics tier should remain readable for learners.

## Best Practices
- FastAPI lifespan for app-scoped resources.
- Interface/protocol for storage (`Protocol` in Python; interface in TS if used).

## Implementation Steps
1. Define `TransactionStore` protocol + in-memory impl.
2. Refactor services to accept store in `__init__`.
3. Wire `Depends()` in routes.
4. Refactor Node `createApp` to accept store injection.
5. Update tests to use fresh store per test module.

## Files/Modules to Modify
- `Basics/fastapi-transaction-service/app/services.py`, `routes.py`, `main.py`
- `Basics/fastapi-transaction-service/tests/`
- `Basics/node-transaction-service/src/**`
- `Basics/node-transaction-service/tests/`

## Testing Requirements
- All existing tests pass.
- New test: two FastAPI TestClients with separate stores don't share transactions.

## Verification Steps
```bash
make rust node python  # basics included in python/node targets
```

## Documentation Requirements
- Comment in services.py explaining DI pattern for learners.

## Acceptance Criteria
- [ ] No module-level store singleton
- [ ] Isolation test passes
- [ ] make test green

## Expected Score Improvement
Architecture +1.0, Testing +0.5 → **+1.5 points**

## Production-Grade Recommendations
- Apply same pattern to A2 expense-tracker (PROMPT-021).
- Use FastAPI `app.dependency_overrides` in tests.
