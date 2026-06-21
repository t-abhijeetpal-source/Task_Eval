# PROMPT-AGENT-2 — Outbound API Surface Map

> Read `_shared_constraints.md` first. Output: `docs/agent-analysis/A1_api_map.md`.

**Mission:** Map the outbound API surface — Retrofit service interfaces (Kotlin) and Flutter
routes/HTTP. This is a **client app**: confirm there are no server endpoints.

**Scope:** `equity_sdk/`, `base_app/`, `flutter/pml-flutter/`.

**Method / verification:**
1. `grep -rl '@GET\|@POST\|@PUT\|@DELETE'` over `equity_sdk/src/main` → count interface files.
   Also count base_app. Report HTTP-verb annotation totals per verb.
2. Determine the dominant path pattern: count `@Url` (dynamic) vs static literal-path annotations.
   Note real REST paths are assembled in the repository layer; cite examples.
3. Identify auth injection (OkHttp interceptor adding `Authorization`/`x-sso-token`/`x-2fa-token`).
   Cite the interceptor file.
4. Flutter: count `GoRoute(...)` declarations and outbound call sites
   (`ApiManager.executeWithParser`, direct `package:http`). Cite `app_router.dart`.
5. Mark services with no inbound reference as candidate-unused via reference search.

**Must report:** interface count (VERIFIED), method estimate (mark INFERRED), `@Url` vs static split.
