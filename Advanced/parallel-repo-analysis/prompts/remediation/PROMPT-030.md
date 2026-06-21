# PROMPT-030 — Dependency audit & upgrade pass (MED)

**Repo:** `$TARGET_REPO`. **Source finding:** `A1_dependencies.md` — versions were read from build
files at major/minor precision; exact resolved patch versions and transitive CVEs are UNVERIFIED
(build blocker). Dual async stacks (RxJava + Coroutines) also noted.

## Goal
Produce a verified dependency report, flag vulnerable/outdated libs, and propose a safe upgrade set.

## Steps
1. Resolve the real dependency tree: `./gradlew :equity_sdk:dependencies` (+ `:base_app`,
   `:common-database`) and `flutter pub deps` for pml-flutter. Capture to an artifact.
2. Run a vulnerability scan (e.g. the OWASP dependency-check Gradle plugin, or
   `gradle :app:dependencyCheckAnalyze`); list any CVEs with severity.
3. Cross-check the pinned majors against `A1_dependencies.md` and correct any drift; fill in exact
   patch versions (Kotlin 2.0.20, AGP 8.9.1, Room, Retrofit/OkHttp, MockK 1.13.13, etc.).
4. Propose upgrades for anything EOL/vulnerable; note the RxJava→Coroutines convergence as a tracked
   item (PERF-1), not a blind bulk change.

## Acceptance
- A committed dependency report (tree + CVE scan) exists and is reproducible by the listed commands.
- `A1_dependencies.md` UNVERIFIED rows become VERIFIED with exact versions.
