# A1 — Security Review (Lane 7, optional)

**Agent:** A7 — Security Analysis Agent
**Target:** `$TARGET_REPO (android-monorepo)` — equity vertical
**Date:** 2026-06-21
**Method:** Derived from the 6 verified lane reports + master report (read-only). Where a claim was
re-grepped this run it is **VERIFIED**; where it follows from another lane's verified evidence it is
**INFERRED**; where it needs a live check it is **UNVERIFIED** (recapture with `TARGET_REPO` set).
Legend: VERIFIED / INFERRED / UNVERIFIED.

> Scope note: this is a **client app** (no server endpoints — `A1_api_map.md`), so the threat model
> is mobile-client: token handling, outbound-URL integrity, local-cache exposure, and CI gaps that
> let security regressions ship.

## Findings (7)

| # | Severity | Finding | Evidence | Status |
|---|---|---|---|---|
| SEC-1 | HIGH | **Security regressions in equity_sdk + Flutter are not gated by CI.** Bitbucket runs unit tests for `:base_app` only, so the ~303 equity_sdk + ~212 Flutter tests (incl. any security/validation tests) never run on that pipeline. A vulnerable change to the auth/URL layer could merge un-tested. | `A1_tests.md` / master Risk #1 → `bitbucket-pipelines.yml:713` | VERIFIED (Bitbucket); GitLab scope UNVERIFIED |
| SEC-2 | HIGH | **Auth tokens are injected on every outbound call** (`Authorization`, `x-sso-token`, `x-2fa-token`) by `CoreNetworkInterceptor`. Confirm these come from secure storage (Keystore/EncryptedSharedPreferences), are not logged, and are scoped to the correct hosts. | `A1_api_map.md` § Auth (VERIFIED interceptor) | INFERRED (storage/logging not re-read) |
| SEC-3 | HIGH | **Dynamic `@Url` dominates (374 `@Url` vs 5 static paths); real paths/hosts are assembled in the repository layer.** If any URL/host is built from server- or deeplink-supplied input without an allow-list, this is an SSRF/host-spoofing surface. A `whitelist_url_tab` table exists (LoggingDataBase) — confirm it actually gates outbound hosts. | `A1_api_map.md` (374 `@Url`), `A1_entities.md` (`whitelist_url_tab`) | INFERRED — needs taint check |
| SEC-4 | MED | **2 direct `package:http` calls in Flutter bypass the native bridge** (`ApiManager`), so they likely bypass `CoreNetworkInterceptor`'s auth-header + URL handling. Verify they don't carry credentials over an unpinned/unvalidated channel. | `A1_api_map.md` (2 direct `package:http` call sites) | INFERRED |
| SEC-5 | MED | **Local Room cache stores user/account data unencrypted by default** (`personal_details`, `kyc_status_data`, portfolio tables) with **0 FKs / app-enforced integrity**. On a rooted device this is readable. Confirm whether SQLCipher or app-level encryption is applied to PII tables. | `A1_entities.md` (tables, 0 FK) | UNVERIFIED |
| SEC-6 | MED | **Failure/response logging DB** (`api_failure_logging`, `api_response_time`) can capture request/response metadata. Ensure URLs/headers/bodies persisted there are scrubbed of tokens and PII. | `A1_entities.md` (LoggingDataBase 3 tables) | INFERRED |
| SEC-7 | LOW | **`minSdk 24`** keeps the app on Android 7.0+, which lacks some newer platform hardening (e.g. stricter TLS defaults, scoped storage). Acceptable for reach, but note for the threat model. | `A1_architecture.md` / master (stack: minSdk 24) | VERIFIED (config) |

## Recommendations (mapped to remediation)

1. **SEC-1** → PROMPT-023 (add equity_sdk + Flutter test stages to CI) — the single highest-leverage fix.
2. **SEC-2/3/4** → PROMPT-031: audit token storage, add an outbound-host allow-list assertion, route
   the 2 Flutter `http` calls through the authenticated bridge (or justify them).
3. **SEC-5/6** → PROMPT-031: encrypt PII Room tables (SQLCipher) and add a log-scrubbing test.

> All findings are analysis-only; no target-repo code was modified (program constitution).
