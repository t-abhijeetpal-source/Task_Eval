"""In-memory order storage."""

import threading
from typing import Dict, List

from app.schemas import Item


class OrderStore:
    def __init__(self) -> None:
        self._orders: Dict[int, List[Item]] = {}
        self._next_id = 1
        # FastAPI runs sync route handlers in a threadpool, so add() can be called
        # concurrently. The id read-modify-write below is not atomic (and free-threaded
        # CPython removes the GIL that incidentally masked it) — guard it with a lock so
        # concurrent orders never collide on an id or overwrite each other.
        self._lock = threading.Lock()

    def add(self, items: List[Item]) -> int:
        with self._lock:
            order_id = self._next_id
            self._next_id += 1
            self._orders[order_id] = items
        return order_id

    def get(self, order_id: int):
        with self._lock:
            return self._orders.get(order_id)

    def count(self) -> int:
        """Return the number of stored orders (encapsulated; callers don't touch internals)."""
        with self._lock:
            return len(self._orders)

    def clear(self) -> None:
        with self._lock:
            self._orders.clear()
            self._next_id = 1


store = OrderStore()
