"""API layer — HTTP routing only."""

import logging

from fastapi import APIRouter, HTTPException

from app import services
from app.schemas import OrderCreate, OrderCreated, OrderTotal
from app.storage import store

logger = logging.getLogger("orders.api")

router = APIRouter()


@router.post("/orders", response_model=OrderCreated, status_code=201)
def create_order(payload: OrderCreate) -> OrderCreated:
    order_id = store.add(payload.items)
    logger.info("order created id=%s line_items=%d", order_id, len(payload.items))
    return OrderCreated(id=order_id)


@router.get("/orders/{order_id}/total", response_model=OrderTotal)
def get_order_total(order_id: int) -> OrderTotal:
    items = store.get(order_id)
    if items is None:
        logger.warning("order total requested for missing id=%s", order_id)
        raise HTTPException(status_code=404, detail="Order not found")
    total = services.calculate_total(items)
    logger.info("order total computed id=%s total=%s", order_id, total)
    return OrderTotal(id=order_id, total=total)
