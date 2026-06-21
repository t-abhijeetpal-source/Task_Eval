"""Service tests for the FastAPI currency conversion service.

Covers the locked contract (see ../../CONTRACT.md): all six rate pairs,
same-currency identity, the three error classes, Decimal precision/finiteness
guarantees, and the OpenAPI/health surface.
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    return TestClient(app)


# --- Happy path: all six contracted rate pairs ----------------------------
# (amount, from, to, expected converted_amount) — values per CONTRACT.md.
RATE_PAIRS = [
    (100, "USD", "INR", 8300),   # x83
    (100, "USD", "EUR", 92),     # x0.92
    (100, "INR", "USD", 1.2),    # x0.012
    (100, "EUR", "USD", 108),    # x1.08
    (100, "INR", "EUR", 1.1),    # x0.011
    (100, "EUR", "INR", 9000),   # x90
]


@pytest.mark.parametrize("amount,frm,to,expected", RATE_PAIRS)
def test_all_six_rate_pairs(client, amount, frm, to, expected):
    resp = client.post("/convert", json={"amount": amount, "from": frm, "to": to})
    assert resp.status_code == 200
    assert resp.json() == {"converted_amount": expected, "from": frm, "to": to}


def test_valid_conversion_usd_to_inr(client):
    resp = client.post("/convert", json={"amount": 100, "from": "USD", "to": "INR"})
    assert resp.status_code == 200
    assert resp.json() == {"converted_amount": 8300, "from": "USD", "to": "INR"}


def test_case_insensitive_currencies(client):
    resp = client.post("/convert", json={"amount": 100, "from": "usd", "to": "inr"})
    assert resp.status_code == 200
    assert resp.json() == {"converted_amount": 8300, "from": "USD", "to": "INR"}


def test_same_currency_uses_rate_one(client):
    resp = client.post("/convert", json={"amount": 42.5, "from": "USD", "to": "USD"})
    assert resp.status_code == 200
    assert resp.json() == {"converted_amount": 42.5, "from": "USD", "to": "USD"}


def test_amount_sent_as_string_is_exact(client):
    # The Node CLI sends amount as a string; Decimal must keep it exact.
    resp = client.post("/convert", json={"amount": "0.30", "from": "USD", "to": "USD"})
    assert resp.status_code == 200
    assert resp.json()["converted_amount"] == 0.3


# --- Errors: unsupported currency -> 400 ----------------------------------
def test_unsupported_currency(client):
    resp = client.post("/convert", json={"amount": 100, "from": "USD", "to": "GBP"})
    assert resp.status_code == 400
    assert resp.json() == {"error": "Unsupported currency"}


# --- Errors: non-positive amount -> 422 (custom body) ---------------------
def test_negative_amount(client):
    resp = client.post("/convert", json={"amount": -5, "from": "USD", "to": "INR"})
    assert resp.status_code == 422
    assert resp.json() == {"error": "Amount must be positive"}


def test_zero_amount(client):
    resp = client.post("/convert", json={"amount": 0, "from": "USD", "to": "INR"})
    assert resp.status_code == 422
    assert resp.json() == {"error": "Amount must be positive"}


# --- Errors: malformed structural input -> 422 (FastAPI detail) -----------
def test_malformed_request_missing_field(client):
    resp = client.post("/convert", json={"from": "USD", "to": "INR"})  # no amount
    assert resp.status_code == 422
    assert "detail" in resp.json()


def test_malformed_request_non_numeric_amount(client):
    resp = client.post("/convert", json={"amount": "abc", "from": "USD", "to": "INR"})
    assert resp.status_code == 422
    assert "detail" in resp.json()


@pytest.mark.parametrize("bad", ["Infinity", "-Infinity", "NaN"])
def test_non_finite_amount_rejected(client, bad):
    # Non-finite Decimals must be rejected at the boundary (structural 422).
    resp = client.post("/convert", json={"amount": bad, "from": "USD", "to": "INR"})
    assert resp.status_code == 422
    assert "detail" in resp.json()


def test_excessive_magnitude_rejected(client):
    # Beyond max_digits (20) -> structural 422, not a silent overflow.
    resp = client.post("/convert", json={"amount": "1e308", "from": "USD", "to": "INR"})
    assert resp.status_code == 422


def test_excessive_precision_rejected(client):
    # More than 6 decimal places -> structural 422.
    resp = client.post("/convert", json={"amount": "1.1234567", "from": "USD", "to": "INR"})
    assert resp.status_code == 422


# --- Response shape -------------------------------------------------------
def test_response_structure(client):
    resp = client.post("/convert", json={"amount": 50, "from": "EUR", "to": "USD"})
    assert resp.status_code == 200
    body = resp.json()
    assert set(body.keys()) == {"converted_amount", "from", "to"}
    assert body["from"] == "EUR"
    assert body["to"] == "USD"
    assert body["converted_amount"] == 54  # 50 * 1.08 = 54.0 -> 54


# --- Surface: health + OpenAPI contract -----------------------------------
def test_health(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


def test_openapi_documents_convert_contract(client):
    spec = client.get("/openapi.json").json()
    assert "/convert" in spec["paths"]
    assert "post" in spec["paths"]["/convert"]
