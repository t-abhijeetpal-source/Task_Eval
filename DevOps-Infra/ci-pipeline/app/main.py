"""D3 sample FastAPI service (the unit-under-CI).

Small by design, production-shaped in posture:
  * structured JSON access logs with a per-request ``request_id``,
  * Prometheus metrics at ``GET /metrics``,
  * security response headers on every reply,
  * liveness (``/health``) and readiness (``/ready``) probes,
  * validated, bounded inputs on ``/add`` (out-of-range -> 422).
"""

import os
import time
import uuid

from fastapi import FastAPI, Query, Request
from fastapi.responses import Response

try:  # prometheus_client is a runtime dep; degrade gracefully if absent.
    from prometheus_client import CONTENT_TYPE_LATEST, generate_latest

    from app.metrics import REGISTRY, observe

    _METRICS_ENABLED = True
except ImportError:  # pragma: no cover - exercised only without the optional dep
    _METRICS_ENABLED = False

from app.calc import add, is_even
from app.logging_setup import configure_logging

APP_ENV = os.getenv("APP_ENV", "local")
APP_VERSION = os.getenv("APP_VERSION", "1.0.0")
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

# Bound the inputs so the API cannot be coerced into unbounded arithmetic.
_OPERAND_LIMIT = 1_000_000_000

# Hardening headers applied to every response (sensible defaults for a JSON API).
_SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
    "Cache-Control": "no-store",
}

log = configure_logging(LOG_LEVEL)
app = FastAPI(title="D3 Sample Service", version=APP_VERSION)


def _route_template(request: Request) -> str:
    """Low-cardinality path label: the matched route, else the raw path."""
    route = request.scope.get("route")
    return getattr(route, "path", request.url.path)


@app.middleware("http")
async def observability_middleware(request: Request, call_next):
    """Tag, time, observe, log, and harden every request/response."""
    request_id = getattr(request.state, "request_id", None) or uuid.uuid4().hex
    request.state.request_id = request_id
    start = time.perf_counter()

    try:
        response = await call_next(request)
    except Exception:
        duration_s = time.perf_counter() - start
        path = _route_template(request)
        if _METRICS_ENABLED and path != "/metrics":
            observe(request.method, path, 500, duration_s)
        log.error(
            "request_failed",
            exc_info=True,
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": path,
                "status_code": 500,
                "duration_ms": round(duration_s * 1000, 2),
                "client": request.client.host if request.client else None,
            },
        )
        raise

    duration_s = time.perf_counter() - start
    path = _route_template(request)
    if _METRICS_ENABLED and path != "/metrics":
        observe(request.method, path, response.status_code, duration_s)

    response.headers["X-Request-ID"] = request_id
    for header, value in _SECURITY_HEADERS.items():
        response.headers.setdefault(header, value)

    log.info(
        "request_completed",
        extra={
            "request_id": request_id,
            "method": request.method,
            "path": path,
            "status_code": response.status_code,
            "duration_ms": round(duration_s * 1000, 2),
            "client": request.client.host if request.client else None,
        },
    )
    return response


if _METRICS_ENABLED:

    @app.get("/metrics", include_in_schema=False)
    def metrics() -> Response:
        """Prometheus scrape target."""
        return Response(generate_latest(REGISTRY), media_type=CONTENT_TYPE_LATEST)


@app.get("/")
def root() -> dict:
    return {"service": "d3-sample", "env": APP_ENV, "version": APP_VERSION}


@app.get("/health")
def health() -> dict:
    """Liveness probe — the process is up."""
    return {"status": "ok"}


@app.get("/ready")
def ready() -> dict:
    """Readiness probe — the service can serve traffic (no external deps here)."""
    return {"status": "ready"}


@app.get("/add")
def add_endpoint(
    a: int = Query(..., ge=-_OPERAND_LIMIT, le=_OPERAND_LIMIT),
    b: int = Query(..., ge=-_OPERAND_LIMIT, le=_OPERAND_LIMIT),
) -> dict:
    total = add(a, b)
    return {"a": a, "b": b, "sum": total, "even": is_even(total)}
