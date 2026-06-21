# PROMPT-007 — A3 E2E CI + SQLite/Queue Hardening (P1)

## Objective
Add the A3 polyglot integration test to CI and harden fraud-system SQLite concurrency and file-queue worker safety.

## Problem Description
`make a3-integration` validates the full FastAPI→Node→Rust pipeline but runs only manually. Fraud SQLite lacks WAL/busy_timeout (unlike A2). File queue has no claim/lock — duplicate processing under multiple workers.

## Root Cause
Integration script was repaired locally but never wired to CI. Database setup copied minimal SQLAlchemy template without production pragmas.

## Desired Outcome
- CI job `a3-integration` builds Rust release binary, runs `integration-tests/run_integration.sh`.
- `polyglot-fraud-system/fastapi-service/app/database.py` applies WAL + busy_timeout on connect (mirror A2).
- Queue: atomic claim via `rename()` to `.processing` suffix or `fcntl` lock before worker reads.
- Concurrency test: two workers, four files → exactly four scores, no duplicates.

## Functional Requirements
1. Workflow `.github/workflows/a3-polyglot-fraud.yml` on path filter `Advanced/polyglot-fraud-system/**`.
2. Steps: `cargo build --release`, venv setup, run integration script.
3. SQLite event listener for PRAGMA on engine connect.
4. Worker claims file before processing; skip if already claimed.

## Non-Functional Requirements
- Integration job ≤ 10 min.
- Idempotent worker runs (safe to retry).

## Technical Constraints
- `A3_INTERNAL_TOKEN` must be set in integration (already in script).
- Port 8078 must be free in CI (script already handles).

## Best Practices
- Match A2 `database.py:25-37` pattern exactly.
- Use exclusive file create for queue claim (O_EXCL).
- Test crash mid-process → file moves to failed/, not stuck in processing.

## Implementation Steps
1. Add WAL/busy_timeout to A3 database.py with test proving PRAGMA applied.
2. Implement queue claim in `queue.py` and `worker.js`.
3. Write concurrency test (pytest or jest with temp dir).
4. Create CI workflow; verify green.
5. Add `make a3-integration` to monorepo CI (PROMPT-001).

## Files/Modules to Modify
- `Advanced/polyglot-fraud-system/fastapi-service/app/database.py`
- `Advanced/polyglot-fraud-system/fastapi-service/app/queue.py`
- `Advanced/polyglot-fraud-system/node-worker/src/worker.js`
- `Advanced/polyglot-fraud-system/fastapi-service/tests/`
- `Advanced/polyglot-fraud-system/node-worker/tests/`
- `.github/workflows/a3-polyglot-fraud.yml` (new)

## Testing Requirements
- Integration script PASS in CI.
- Unit test: WAL mode verified via `PRAGMA journal_mode`.
- Concurrency test: no double POST of scores.

## Verification Steps
```bash
cd Advanced/polyglot-fraud-system/rust-engine && cargo build --release
make a3-integration
```

## Documentation Requirements
- Update A3 README with concurrency guarantees.
- Note CI badge for integration.

## Acceptance Criteria
- [ ] CI runs a3-integration on relevant PRs
- [ ] SQLite WAL enabled
- [ ] Queue claim prevents double processing
- [ ] All tests green

## Expected Score Improvement
Testing +1.0, Performance +1.0 → **+2.0 points**

## Production-Grade Recommendations
- Replace file queue with SQS/RabbitMQ for real deployments.
- Add dead-letter queue for failed transactions.
