"""Integration tests for the FastAPI surface (exercises routes + middleware)."""

import warnings

import pytest
from fastapi.testclient import TestClient

from app.main import _OPERAND_LIMIT, _SECURITY_HEADERS, app


def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


def test_ready(client):
    r = client.get("/ready")
    assert r.status_code == 200
    assert r.json() == {"status": "ready"}


def test_root_reports_metadata(client):
    r = client.get("/")
    assert r.status_code == 200
    body = r.json()
    assert body["service"] == "d3-sample"
    assert {"env", "version"} <= body.keys()


def test_add_endpoint_full_body(client):
    r = client.get("/add", params={"a": 2, "b": 3})
    assert r.status_code == 200
    assert r.json() == {"a": 2, "b": 3, "sum": 5, "even": False}


def test_add_endpoint_even_flag(client):
    r = client.get("/add", params={"a": 2, "b": 2})
    assert r.status_code == 200
    assert r.json()["even"] is True


def test_add_endpoint_negative(client):
    r = client.get("/add", params={"a": -4, "b": -6})
    assert r.json() == {"a": -4, "b": -6, "sum": -10, "even": True}


def test_add_endpoint_at_bounds(client):
    r = client.get("/add", params={"a": _OPERAND_LIMIT, "b": -_OPERAND_LIMIT})
    assert r.status_code == 200
    assert r.json()["sum"] == 0


@pytest.mark.parametrize(
    "params",
    [
        {"a": 1},  # missing b
        {"b": 1},  # missing a
        {},  # missing both
        {"a": "x", "b": 2},  # non-integer
        {"a": _OPERAND_LIMIT + 1, "b": 0},  # over the upper bound
        {"a": -_OPERAND_LIMIT - 1, "b": 0},  # under the lower bound
    ],
)
def test_add_endpoint_invalid_params_422(client, params):
    r = client.get("/add", params=params)
    assert r.status_code == 422


def test_security_and_request_id_headers(client):
    r = client.get("/health")
    assert r.headers["X-Request-ID"]
    for header, value in _SECURITY_HEADERS.items():
        assert r.headers[header] == value


def test_request_ids_are_unique(client):
    first = client.get("/health").headers["X-Request-ID"]
    second = client.get("/health").headers["X-Request-ID"]
    assert first != second


def test_metrics_endpoint(client):
    # Generate some traffic so the counters are non-zero.
    client.get("/add", params={"a": 1, "b": 1})
    r = client.get("/metrics")
    assert r.status_code == 200
    assert "http_requests_total" in r.text
    assert "http_request_duration_seconds" in r.text


def test_metrics_records_errors():
    """A 4xx is reflected in the error counter (middleware observe path)."""
    with TestClient(app) as c:
        c.get("/add", params={})  # 422
        body = c.get("/metrics").text
    assert "http_request_errors_total" in body


def test_unhandled_exception_records_500(monkeypatch):
    """The middleware's failure branch observes + logs a 500, then re-raises."""

    async def boom():
        raise RuntimeError("synthetic failure")

    app.add_api_route("/_boom", boom, include_in_schema=False)
    try:
        with TestClient(app, raise_server_exceptions=False) as c:
            r = c.get("/_boom")
        assert r.status_code == 500
    finally:
        app.router.routes = [
            route for route in app.router.routes if getattr(route, "path", None) != "/_boom"
        ]


def test_endpoints_emit_no_deprecation_warnings(client):
    with warnings.catch_warnings():
        warnings.simplefilter("error", DeprecationWarning)
        for path, params in (("/health", None), ("/ready", None), ("/add", {"a": 1, "b": 2})):
            assert client.get(path, params=params).status_code == 200
