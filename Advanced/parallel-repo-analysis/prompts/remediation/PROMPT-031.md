# PROMPT-031 — Remediate security findings (HIGH)

**Repo:** `$TARGET_REPO`. **Source:** `A1_security.md` (SEC-1..SEC-7).

## Goal
Close the mobile-client security findings, highest-leverage first.

## Steps (by finding)
1. **SEC-1 (HIGH, CI gap):** delegate to PROMPT-023 — ensure equity_sdk + Flutter tests run in CI so
   security regressions are caught. (Prerequisite.)
2. **SEC-2 (token handling):** verify `Authorization`/`x-sso-token`/`x-2fa-token` originate from
   Keystore/EncryptedSharedPreferences, are scoped per host, and are **never logged**. Add a test
   asserting the logging DB / Logcat path scrubs these headers.
3. **SEC-3 (`@Url` host integrity, HIGH):** confirm whether `whitelist_url_tab` actually gates
   outbound hosts. If not, add an outbound-host **allow-list** assertion in `CoreNetworkInterceptor`
   (reject hosts not in the configured set) and a test with an off-list host → blocked.
4. **SEC-4 (Flutter direct `http`):** route the 2 `package:http` call sites through the authenticated
   bridge/`ApiManager`, or document why they must bypass it and ensure TLS pinning + no credentials.
5. **SEC-5 (local PII at rest):** evaluate SQLCipher (or field-level encryption) for PII tables
   (`personal_details`, `kyc_status_data`, portfolio). Add migration if adopted.
6. **SEC-6 (log scrubbing):** ensure `api_failure_logging`/`api_response_time` rows strip tokens/PII;
   add a regression test.

## Acceptance
- Each addressed finding has a regression test; the new tests run in CI and pass (real counts).
- SEC-3 allow-list (or a documented existing equivalent) demonstrably blocks an off-list host.
- No secret/token appears in logs or the logging DB in tests.
- `A1_security.md` statuses updated (INFERRED/UNVERIFIED → VERIFIED) with cited evidence.
