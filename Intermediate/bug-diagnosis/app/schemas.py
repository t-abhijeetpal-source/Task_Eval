"""Pydantic schemas for the orders service."""

from typing import List

from pydantic import BaseModel, Field


class Item(BaseModel):
    price: float = Field(..., gt=0, description="Unit price, must be > 0")
    qty: int = Field(..., ge=1, description="Quantity, integer >= 1")


# Upper bound guards the in-memory store against an unbounded-payload (DoS) request;
# 1000 line items per order is far above any realistic order.
MAX_ITEMS_PER_ORDER = 1000


class OrderCreate(BaseModel):
    items: List[Item] = Field(..., min_length=1, max_length=MAX_ITEMS_PER_ORDER)


class OrderCreated(BaseModel):
    id: int


class OrderTotal(BaseModel):
    id: int
    total: float
