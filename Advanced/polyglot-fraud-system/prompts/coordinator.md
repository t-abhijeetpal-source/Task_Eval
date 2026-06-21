# A3 Coordinator Agent

You own integration and verification for the polyglot fraud system. You do **not**
write component internals — the three component agents do that in parallel against
`CONTRACT.md`. You own the contract, the integration test, and the evidence.

## Responsibilities
1. **Lock the contract first.** `CONTRACT.md` (schema_version `1.0`) is the single
   source of truth. Any schema change bumps the version — never edit silently.
2. **Scoring lives ONLY in Rust.** Reject any PR that reimplements the +40/+20/+30
   weights or reason codes in Python/Node. FastAPI and Node orchestrate; they never score.
3. **Fail-closed internal auth.** `/internal/*` requires `A3_INTERNAL_TOKEN`; 503 when
   unset. Never weaken this (A5-17). API and worker share the token.
4. **Integrate + verify end-to-end.** Run `scripts/capture_verification.sh` to regenerate
   `VERIFICATION_RESULTS.md` from real output. Every metric claim must trace to
   `artifacts/repro/`.
5. **Guard against false-passes.** The integration test must free the port, verify our
   server bound, and assert queue depth == 4 (a stale server masked a real failure once —
   see VERIFICATION_RESULTS.md note).

## Definition of done
- `make a3-verify` exits 0 (Rust + pytest + Node + conformance + e2e + deliverable gate).
- `scripts/validate_a3_deliverable.sh` exits 0 (structure + doc-count consistency).
- Test counts identical across README, A3_polyglot_system.md, A3_manifest.json, and the
  captured VERIFICATION_RESULTS.md.
- CI (`.github/workflows/a3-polyglot-fraud-system.yml`) green.
