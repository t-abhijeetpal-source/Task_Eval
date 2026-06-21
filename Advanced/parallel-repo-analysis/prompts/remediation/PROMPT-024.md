# PROMPT-024 — Make coverage gates valid and blocking (MED)

**Repo:** `$TARGET_REPO`. **Source finding:** master Risk #2 — production-vs-development flavor
mismatch likely voids jacoco reports; gates are non-blocking (`|| true`); thresholds are 20% root /
10% equity_sdk / none for common-database.

## Goal
Produce valid coverage reports and enforce them as blocking gates at sane thresholds.

## Steps
1. Find the jacoco config (root `build.gradle` + per-module). Identify the flavor each test task and
   each jacoco report task targets; align them so the report consumes the same flavor's `.exec`/class
   files that the tests produce (the production/development mismatch is the root cause).
2. Remove `|| true` (and any `ignoreFailures = true`) from the coverage verification task so a miss
   fails the build.
3. Set explicit thresholds: keep/raise root and equity_sdk; **add** a threshold for
   `:common-database`. Start at current real coverage rounded down, then ratchet up.
4. Wire the verification task into the CI step added by PROMPT-023.

## Acceptance
- `./gradlew jacocoTestCoverageVerification` (or the project's task) produces a non-empty report and
  **fails** when below threshold (prove by temporarily lowering coverage locally).
- Gates are blocking in CI; thresholds documented.
- No `|| true` remains on coverage tasks.
