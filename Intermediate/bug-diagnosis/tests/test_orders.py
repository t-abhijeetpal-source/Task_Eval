"""Tests for the orders service, encoding the SPEC.md rules.

`test_bulk_discount_applies_at_threshold_of_10` is the reproduction test for the
seeded bug (boundary at qty == 10).
"""

import threading

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.schemas import MAX_ITEMS_PER_ORDER, Item
from app.services import calculate_total
from app.storage import OrderStore, store


@pytest.fixture(autouse=True)
def reset_store():
    store.clear()
    yield
    store.clear()


@pytest.fixture
def client():
    return TestClient(app)


# --- No discount below threshold (qty 9) ----------------------------------
def test_no_discount_below_threshold():
    assert calculate_total([Item(price=100, qty=9)]) == 900.0


# --- REPRODUCTION: discount must apply at exactly qty == 10 ---------------
def test_bulk_discount_applies_at_threshold_of_10():
    # SPEC rule 3: qty >= 10 qualifies. 10 * 100 = 1000, minus 10% = 900.
    assert calculate_total([Item(price=100, qty=10)]) == 900.0


# --- Discount above threshold (qty 11) ------------------------------------
def test_discount_above_threshold():
    assert calculate_total([Item(price=100, qty=11)]) == 990.0


# --- Mixed order ----------------------------------------------------------
def test_mixed_order_total():
    # 100*9 = 900 (no disc) + 50*10 = 500 -> 450 (disc) = 1350
    items = [Item(price=100, qty=9), Item(price=50, qty=10)]
    assert calculate_total(items) == 1350.0


# --- API integration: total endpoint reflects the discount ----------------
def test_api_order_total_at_threshold(client):
    created = client.post("/orders", json={"items": [{"price": 100, "qty": 10}]})
    assert created.status_code == 201
    oid = created.json()["id"]
    total = client.get(f"/orders/{oid}/total")
    assert total.status_code == 200
    assert total.json() == {"id": oid, "total": 900.0}


# --- HARDENING A: monetary precision (Decimal, not binary float) ----------
def test_money_uses_decimal_not_float_round():
    # round(2.675, 2) == 2.67 in binary float (representation lottery); correct money is 2.68.
    assert calculate_total([Item(price=2.675, qty=1)]) == 2.68


def test_discounted_line_has_no_float_noise():
    # 0.07 * 10 = 0.70, minus 10% = 0.63 exactly — never 0.6300000000000001.
    assert calculate_total([Item(price=0.07, qty=10)]) == 0.63


# --- HARDENING B: concurrent order creation never collides on an id -------
def test_concurrent_add_allocates_unique_ids():
    s = OrderStore()
    n = 500
    ids = []
    guard = threading.Lock()

    def worker():
        oid = s.add([Item(price=1, qty=1)])
        with guard:
            ids.append(oid)

    threads = [threading.Thread(target=worker) for _ in range(n)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()

    assert len(set(ids)) == n          # no duplicate ids
    assert s.count() == n              # no lost/overwritten orders


# --- HARDENING C: oversized order is rejected (DoS guard) -----------------
def test_oversized_order_rejected(client):
    payload = {"items": [{"price": 1, "qty": 1}] * (MAX_ITEMS_PER_ORDER + 1)}
    resp = client.post("/orders", json=payload)
    assert resp.status_code == 422


def test_max_size_order_accepted(client):
    payload = {"items": [{"price": 1, "qty": 1}] * MAX_ITEMS_PER_ORDER}
    resp = client.post("/orders", json=payload)
    assert resp.status_code == 201


# --- HARDENING: observability — routes emit structured logs -----------------
def test_routes_emit_logs(client, caplog):
    with caplog.at_level("INFO", logger="orders.api"):
        oid = client.post("/orders", json={"items": [{"price": 100, "qty": 10}]}).json()["id"]
        client.get(f"/orders/{oid}/total")
        client.get("/orders/999999/total")  # missing -> warning
    messages = [r.getMessage() for r in caplog.records]
    assert any("order created" in m for m in messages)
    assert any("order total computed" in m for m in messages)
    assert any("missing id=999999" in m for m in messages)
