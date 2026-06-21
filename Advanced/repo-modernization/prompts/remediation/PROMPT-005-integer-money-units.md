# PROMPT-005 — Integer Minor-Units for Money (P1)

## Objective
Replace float-based money fields with integer minor-units (cents/paise) or `Decimal` across all transaction services, eliminating binary floating-point drift and non-finite value acceptance.

## Problem Description
Multiple services use `float` for monetary amounts (`polyglot-fraud-system/schemas.py:11`, `bug-diagnosis/schemas.py:9`, B4 stores float). Float accepts `inf`/`nan`; aggregation can drift. A2 already uses integer cents — inconsistency across portfolio.

## Root Cause
FastAPI/Pydantic tutorials default to `float` for numbers; no monorepo-wide money convention was established.

## Desired Outcome
- Convention: **store and transmit money as integer minor units** (e.g. ₹5000 = 500000 paise or document USD cents).
- Pydantic validators reject non-finite, negative where inappropriate, fractional minor units.
- API JSON uses integer `amount_minor` OR string decimal — document breaking change if needed.
- All existing tests updated; add regression tests for `0.1 + 0.2`, `nan`, `inf`.

## Functional Requirements
1. Migrate A3 fraud schemas/models to integer amount.
2. Migrate B4, I6 bug-diagnosis similarly.
3. Update Node/Rust counterparts in polyglot flows if they pass amounts.
4. Preserve A2 integer-cents approach as reference (`parallel-expense-tracker`).

## Non-Functional Requirements
- Backward compatibility: if breaking API, version schema (`schema_version: "2.0"`) or accept both during transition.
- No performance regression on aggregation queries.

## Technical Constraints
- TDD strictly — failing money tests before schema changes.
- SQLite columns: INTEGER not REAL.
- Rust engine: accept integer in JSON contract (`CONTRACT.md` update).

## Best Practices
- Never use float for money — industry standard is minor units or Decimal.
- Document exponent in OpenAPI/README.
- Centralize `Money` type in shared module if multiple Python services adopt.

## Implementation Steps
1. Audit all `amount`, `price`, `balance` fields (grep).
2. Write failing tests: nan rejected, sum exact, boundary 2dp equivalent.
3. Update SQLAlchemy models + Alembic/SQLite schema where applicable.
4. Update Pydantic schemas + route serialization.
5. Update A3 CONTRACT.md + Rust/Node parsers.
6. Run `make test`, `make a3-integration`.

## Files/Modules to Modify
- `Advanced/polyglot-fraud-system/fastapi-service/app/schemas.py`, `models.py`
- `Basics/fastapi-transaction-service/app/**`
- `Intermediate/bug-diagnosis/app/**`
- `Advanced/polyglot-fraud-system/CONTRACT.md`
- `Advanced/polyglot-fraud-system/rust-engine/**`
- `Advanced/polyglot-fraud-system/node-worker/**`
- All related `tests/`

## Testing Requirements
- Reject `nan`, `inf`, over-precision floats at boundary.
- Exact aggregation test (no 0.30000000000000004).
- A3 integration script passes with integer amounts.

## Verification Steps
```bash
make test
make a3-integration  # after building rust release
```

## Documentation Requirements
- Root or shared doc: "Money representation standard."
- Update API examples in READMEs.

## Acceptance Criteria
- [ ] No float money in DB columns or primary API fields
- [ ] Non-finite inputs rejected with 422
- [ ] All tests green including polyglot E2E

## Expected Score Improvement
Code Quality +1.5, Architecture +0.5 → **+2.0 points**

## Production-Grade Recommendations
- Use `decimal.Decimal` only at boundaries; store int minor units.
- Add property-based tests (hypothesis) for rounding.
