# PROMPT-AGENT-4 — Test Discovery

> Read `_shared_constraints.md` first. Output: `docs/agent-analysis/A1_tests.md`.

**Mission:** Inventory the test setup — frameworks, test layout, coverage gates, and the canonical
CI command. Do NOT run Gradle/Flutter (heavy; state the blocker honestly).

**Scope:** equity vertical + `flutter/pml-flutter`.

**Method / verification:**
1. Identify frameworks from the version catalog / `build.gradle` deps (JUnit, Robolectric, MockK,
   Mockito, Espresso, Compose UI test, coroutines-test; Flutter `flutter_test`/`mockito`/`build_runner`).
   Cite line ranges.
2. Count tests by `find`: `*Test.kt` per module (unit vs instrumented by source set), `*_test.dart`.
   Report repo-wide and per-module.
3. Read the CI YAML (`bitbucket-pipelines.yml`, `.gitlab-ci.yml`) and extract the canonical
   unit-test task(s) **with line numbers**. Flag any module-scope gap (e.g. CI runs only `:base_app`).
   Be careful: generic Gradle tasks may not be module-restricted — label scope UNVERIFIED if so.
4. Inspect coverage/jacoco config: thresholds, whether gates are blocking (`|| true`), flavor mismatch.
5. **Execution = NOT RUN** (SDK blocker). Never fabricate pass/fail counts.

**Must report:** frameworks, counts, canonical CI command (cited), and any CI coverage gap as a risk.
