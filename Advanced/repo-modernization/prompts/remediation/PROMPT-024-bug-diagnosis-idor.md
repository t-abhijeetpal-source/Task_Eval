# PROMPT-024 — bug-diagnosis IDOR and UUID IDs (P3)

## Objective
Replace sequential integer order IDs in `Intermediate/bug-diagnosis` with non-enumerable UUIDs and add optional auth stub to prevent unauthorized order access.

## Problem Description
Bug-diagnosis service exposes sequential integer IDs enabling order enumeration (IDOR) without authentication. Documented in security review as LOW but easy fix for evaluation points.

## Root Cause
Tutorial CRUD used auto-increment IDs for simplicity.

## Desired Outcome
- Primary key: UUID v4 string in API paths.
- Storage layer generates UUID on create.
- Tests updated; enumeration test proves old sequential pattern gone.
- Optional: integrate API key from PROMPT-004 shared security module.

## Functional Requirements
1. `GET /orders/{id}` accepts UUID only (422 on invalid format).
2. Migration or storage reset for in-memory store (no production data).
3. Existing bug-diagnosis behavior tests adapted to UUID pattern.

## Non-Functional Requirements
- No perf impact for demo scale.

## Technical Constraints
- TDD — write UUID validation tests first.
- Keep I6 task teaching focus (bug was date parser — don't scope creep).

## Best Practices
- Use uuid4 for random IDs; never expose internal counter.
- Return 404 for valid UUID not found (not 403) to avoid existence leak — or 403 with auth.

## Implementation Steps
1. Update models/schemas to UUID strings.
2. Update storage to dict keyed by UUID.
3. Fix routes and tests.
4. Run pytest in bug-diagnosis project.

## Files/Modules to Modify
- `Intermediate/bug-diagnosis/app/models.py`, `schemas.py`, `storage.py`, `routes.py`
- `Intermediate/bug-diagnosis/tests/`

## Testing Requirements
- Cannot iterate orders by incrementing integer.
- Invalid UUID format → 422.

## Verification Steps
```bash
cd Intermediate/bug-diagnosis && pytest -v
```

## Documentation Requirements
- Note UUID IDs in I6 README.

## Acceptance Criteria
- [ ] UUID IDs throughout
- [ ] Enumeration test passes
- [ ] pytest green

## Expected Score Improvement
Security +0.5 → **+0.5 points**

## Production-Grade Recommendations
- Combine with auth middleware (PROMPT-004).
- Rate limit list endpoints if added.
