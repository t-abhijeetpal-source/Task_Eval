# PROMPT-029 — Document/centralize the Retrofit base-URL provider (LOW)

**Repo:** `$TARGET_REPO`. **Source finding:** master Unknowns / `A1_flow_trace.md` — the Retrofit
base-URL provider and the exact Dagger component installing the scrip-event module were INFERRED,
not walked. Combined with the dominant `@Url`-dynamic pattern (374 `@Url`), URL/host assembly is
spread across the repository layer.

## Goal
Make the base-URL/host resolution explicit and discoverable, and document where it lives.

## Steps
1. Trace the OkHttp/Retrofit setup: which Dagger module `@Provides` the `Retrofit`/`OkHttpClient`,
   what base URL it uses, and how `@Url`-dynamic calls resolve their host (flavor/env config).
2. If host selection is scattered, centralize it behind a single `BaseUrlProvider`/host resolver and
   route `@Url` builders through it (coordinate with SEC-3's allow-list in PROMPT-031).
3. Document the resolved provider + the Dagger component installing `CommonScripEventModule` in the
   architecture/data-flow doc; update `A1_flow_trace.md` Unknowns → VERIFIED with cited `file:line`.

## Acceptance
- The base-URL provider and scrip-event module's installing component are named with `file:line`.
- `@Url` host assembly goes through one resolver (or the doc explains why it cannot yet).
