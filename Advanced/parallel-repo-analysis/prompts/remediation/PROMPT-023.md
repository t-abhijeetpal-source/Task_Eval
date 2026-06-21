# PROMPT-023 — Close the CI test-coverage gap (HIGH)

**Repo:** `$TARGET_REPO (android-monorepo)`. **Source finding:** master Risk #1 / SEC-1 —
Bitbucket runs unit tests for `:base_app` **only** (`bitbucket-pipelines.yml:713`), so equity_sdk's
~303 and Flutter's ~212 unit tests never execute on that pipeline.

## Goal
Make CI execute the equity_sdk and Flutter unit tests on every pipeline run, without breaking the
existing `:base_app` step or build time guarantees.

## Steps
1. **Confirm scope first (do not assume).** Read `bitbucket-pipelines.yml` around line 713 and
   `.gitlab-ci.yml` around line 118. Determine which pipeline is authoritative and whether GitLab's
   `testDevelopmentDebugUnitTest` already runs equity_sdk (the A1 report flagged its scope as
   UNVERIFIED — verify it before adding redundant stages).
2. Add a unit-test step for equity_sdk: `./gradlew -Pci :equity_sdk:testProductionDebugUnitTest`
   (match the flavor the rest of CI uses; reconcile with PROMPT-024 on flavor).
3. Add a Flutter unit-test step: `cd flutter/pml-flutter && flutter test` (gate behind Flutter SDK
   availability in the runner image; add the SDK to the image if absent).
4. Parallelize/cache where possible (Gradle build-cache, configuration-cache) to bound wall-time.

## Acceptance
- CI config shows equity_sdk + Flutter unit-test steps; a triggered pipeline runs them and they pass.
- `A1_tests.md` updated: execution status moves from "NOT RUN" to VERIFIED **with the real
  pass/fail counts from the CI log** (never fabricated).
- No regression to the `:base_app` step.
