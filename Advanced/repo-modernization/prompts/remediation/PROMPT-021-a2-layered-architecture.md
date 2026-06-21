# PROMPT-021 — A2 Layered Architecture Refactor (P3)

## Objective
Refactor `Advanced/parallel-expense-tracker` to introduce service and repository layers, moving business logic out of route handlers.

## Problem Description
A2 inlines business logic in `routes.py` with no service/repository separation — inconsistent with B4/I4 quality bar. Name "parallel-expense-tracker" implies concurrency that doesn't exist.

## Root Cause
Speed of parallel frontend+backend task delivery prioritized working HTTP over layering.

## Desired Outcome
- `app/services/expense_service.py` — create/list/summary logic.
- `app/repositories/expense_repository.py` — SQLAlchemy queries.
- `routes.py` — thin HTTP adapter, exception mapping only.
- Rename or document "parallel" as "concurrent UI+API development" not runtime parallelism.

## Functional Requirements
1. Zero behavior change — all 16+ pytest cases pass unchanged.
2. Summary SQL GROUP BY optimization (A6) remains in repository layer.
3. Routes ≤15 lines per handler.

## Non-Functional Requirements
- Improved testability: unit test service with mocked repo.

## Technical Constraints
- TDD: write service unit tests before extraction.
- Preserve integer cents money model.

## Best Practices
- Match I4 currency service exception → HTTP mapping pattern.
- Use FastAPI Depends for db session + service factory.

## Implementation Steps
1. Write service tests for create expense, list, summary aggregation.
2. Extract repository with current SQL.
3. Slim routes to delegate.
4. Run `make a2-verify`.

## Files/Modules to Modify
- `Advanced/parallel-expense-tracker/app/routes.py`
- `Advanced/parallel-expense-tracker/app/services/` (new)
- `Advanced/parallel-expense-tracker/app/repositories/` (new)
- `Advanced/parallel-expense-tracker/tests/`

## Testing Requirements
- All existing tests pass.
- ≥2 new service unit tests with mocked repository.

## Verification Steps
```bash
make a2-verify
```

## Documentation Requirements
- Update A2 README project structure diagram.

## Acceptance Criteria
- [ ] Three-layer structure
- [ ] make a2-verify green
- [ ] No logic in routes beyond HTTP concerns

## Expected Score Improvement
Architecture +0.5 → **+0.5 points**

## Production-Grade Recommendations
- Apply DI pattern from PROMPT-014.
- Add async if IO-bound scaling needed later.
