"""Business layer — order total + bulk discount calculation.

Business rules: see SPEC.md.
"""

from decimal import Decimal, ROUND_HALF_UP
from typing import List

from app.schemas import Item

# A line item qualifies for the bulk discount at this quantity OR MORE (see SPEC.md rule 3).
BULK_QTY_THRESHOLD = 10
BULK_DISCOUNT_RATE = Decimal("0.10")
# Money is computed with Decimal (never binary float) so customer bills never drift.
_CENTS = Decimal("0.01")


def calculate_line_total(item: Item) -> Decimal:
    """Return the exact total for one line item, applying the bulk discount if it qualifies.

    Uses Decimal arithmetic (price converted via str to avoid binary-float noise) and is
    intentionally *not* rounded here — SPEC.md rule 4 rounds once, at the order level.
    """
    line_total = Decimal(str(item.price)) * item.qty
    if item.qty >= BULK_QTY_THRESHOLD:
        line_total = line_total * (Decimal(1) - BULK_DISCOUNT_RATE)
    return line_total


def calculate_total(items: List[Item]) -> float:
    """Return the order total = sum of line totals (after discounts), rounded to 2 dp.

    Rounds half-up (standard for customer-facing billing), avoiding the float ``round()``
    representation lottery (e.g. ``round(2.675, 2) == 2.67``).
    """
    total = sum((calculate_line_total(item) for item in items), Decimal(0))
    return float(total.quantize(_CENTS, rounding=ROUND_HALF_UP))
