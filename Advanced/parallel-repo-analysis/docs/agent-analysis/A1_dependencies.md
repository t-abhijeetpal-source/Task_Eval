# A1 — Dependency & Version Inventory

**Target:** `$TARGET_REPO (android-monorepo)` — equity vertical
**Date:** 2026-06-21
**Method:** Consolidated from `A1_architecture.md` (stack) and `A1_tests.md` (test frameworks), both
citing `build.gradle` / version catalog. VERIFIED = cited from a build file in a lane report;
recapture exact patch versions with `TARGET_REPO` set. Legend: VERIFIED / INFERRED / UNVERIFIED.

## Toolchain / build

| Component | Version | Source | Status |
|---|---|---|---|
| Kotlin | 2.0.20 | `A1_architecture.md` / master (build.gradle) | VERIFIED |
| Android Gradle Plugin (AGP) | 8.9.1 | master stack | VERIFIED |
| JDK | 17 | master stack | VERIFIED |
| minSdk / targetSdk | 24 / 35 | master stack | VERIFIED |
| Build flavors | dev / staging / prod / preProd (4) | master stack | VERIFIED |

## Runtime libraries

| Library | Role | Source | Status |
|---|---|---|---|
| Dagger (+ Hilt) | DI (mixed classic + Hilt) | `A1_architecture.md` | VERIFIED |
| Room (Rx / KTX) | local persistence | `A1_architecture.md`, `A1_entities.md` | VERIFIED |
| Retrofit / OkHttp | remote HTTP | `A1_api_map.md` | VERIFIED |
| RxJava | async (legacy) | master stack | VERIFIED |
| Kotlin Coroutines | async (newer) | master stack | VERIFIED |
| Jetpack Compose | UI | master stack | VERIFIED |

## Test libraries

| Library | Version | Source | Status |
|---|---|---|---|
| JUnit4 | 4.13.2 | `A1_tests.md` (catalog `build.gradle:272-292`) | VERIFIED |
| Robolectric | 4.13 | `A1_tests.md` | VERIFIED |
| MockK | 1.13.13 | `A1_tests.md` | VERIFIED |
| Mockito | 5.x | `A1_tests.md` | VERIFIED |
| Espresso | 3.6.1 | `A1_tests.md` | VERIFIED |
| Compose UI test | (catalog) | `A1_tests.md` | VERIFIED |
| coroutines-test | (catalog) | `A1_tests.md` | VERIFIED |
| Flutter `flutter_test` / `mockito` / `build_runner` | (pubspec `71-82`) | `A1_tests.md` | VERIFIED |

## Notes & risks

- **Patch-version precision:** the lane reports cite major/minor from `build.gradle`; exact resolved
  patch versions (and transitive CVEs) require `./gradlew :equity_sdk:dependencies` against a live
  checkout — **UNVERIFIED** here (build blocker). Tracked as RT-EXT-030 (dependency audit pass).
- **Dual async stacks** (RxJava + Coroutines) — see `A1_performance.md` PERF-1.
- **Stale doc drift:** a 78.6% coverage figure appears in older docs and is not current
  (master Risk #5) — refresh tracked as RT-EXT-028.
