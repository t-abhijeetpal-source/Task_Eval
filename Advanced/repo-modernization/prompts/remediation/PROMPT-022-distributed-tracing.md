# PROMPT-022 — Distributed Tracing for Polyglot Flow (P3)

## Objective
Add OpenTelemetry trace propagation across the A3 fraud pipeline (FastAPI → Node worker → Rust engine callback) and document trace visualization for the observability demo.

## Problem Description
`observability-bolt-on` has metrics and logs but no tracing. `request_id` is generated locally, never propagated across services. Polyglot debugging requires correlated traces.

## Root Cause
Tracing considered out of scope for individual task demos.

## Desired Outcome
- OTel SDK in FastAPI and Node worker with W3C tracecontext propagation.
- Rust engine logs include trace_id from env/stdin JSON (minimal instrumentation).
- Optional: Jaeger or Tempo in observability compose stack.
- Demo: single transaction visible as one trace across three processes.

## Functional Requirements
1. Trace starts at POST /transactions, continues through worker HTTP callback.
2. Exporter configurable via `OTEL_EXPORTER_OTLP_ENDPOINT`.
3. Disabled by default in tests (no external collector required).

## Non-Functional Requirements
- Overhead <2ms p50 when exporter off.
- Low-cardinality span names.

## Technical Constraints
- Do not break a3-integration when OTel disabled.
- Keep dependency weight reasonable.

## Best Practices
- Auto-instrumentation for FastAPI/httpx/fetch.
- Propagate `traceparent` header on internal callbacks.

## Implementation Steps
1. Add otel deps to A3 fastapi + node-worker.
2. Configure TracerProvider in main/worker startup.
3. Inject trace context into queue JSON payload.
4. Add Jaeger service to observability compose (optional).
5. Document trace demo in observability README.

## Files/Modules to Modify
- `Advanced/polyglot-fraud-system/fastapi-service/`
- `Advanced/polyglot-fraud-system/node-worker/`
- `DevOps-Infra/observability-bolt-on/docker-compose.yml` (optional Jaeger)
- A3 integration test (assert trace headers optional)

## Testing Requirements
- Unit test: trace context injected in queue payload when enabled.
- Integration: manual verify in Jaeger UI.

## Verification Steps
```bash
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317 make a3-integration
# Open Jaeger → search traces
```

## Documentation Requirements
- observability README: tracing section with screenshot placeholder.

## Acceptance Criteria
- [ ] Trace propagation works across A3 components
- [ ] Tests pass with OTel disabled
- [ ] Documentation complete

## Expected Score Improvement
Observability +1.0 → **+1.0 points**

## Production-Grade Recommendations
- Tail-based sampling for production.
- Correlate traces with structured logs via trace_id field.
