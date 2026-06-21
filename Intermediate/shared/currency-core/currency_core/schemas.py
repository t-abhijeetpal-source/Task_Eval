"""Pydantic schemas — the validation layer (API boundary contract).

Financial amounts use ``Decimal`` (never ``float``) so values are exact and
non-finite inputs are rejected here, at the boundary:

  * ``Infinity`` / ``NaN`` (sent as JSON numbers or strings) -> 422 (structural)
  * magnitudes beyond ``max_digits`` (e.g. ``1e308``)        -> 422 (structural)
  * precision beyond 6 decimal places                        -> 422 (structural)

Business rules that need a *specific* error body (amount must be > 0, currency
supported) stay in the service layer so they can map to the contracted bodies.

Precision policy: at most 6 decimal places, at most 20 significant digits.
"""

from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, field_validator

#: Precision policy — see module docstring.
MAX_DIGITS = 20
DECIMAL_PLACES = 6


class ConvertRequest(BaseModel):
    """Request body for POST /convert.

    `from` is a Python keyword, so it is accepted via alias and stored as
    `from_currency`. `populate_by_name` lets tests build it either way.
    """

    amount: Decimal = Field(
        ...,
        max_digits=MAX_DIGITS,
        decimal_places=DECIMAL_PLACES,
        description="Amount to convert. Decimal; finite, <= 6 dp (validated > 0 in service).",
    )
    from_currency: str = Field(..., alias="from", description="Source currency code")
    to_currency: str = Field(..., alias="to", description="Target currency code")

    model_config = ConfigDict(
        populate_by_name=True,
        json_schema_extra={"example": {"amount": "100.00", "from": "USD", "to": "INR"}},
    )

    @field_validator("amount")
    @classmethod
    def amount_must_be_finite(cls, v: Decimal) -> Decimal:
        """Reject Infinity / NaN explicitly (defense in depth on top of constraints)."""
        if not v.is_finite():
            raise ValueError("Amount must be a finite number")
        return v


class ConvertResponse(BaseModel):
    """Response body for a successful conversion (documents the contract)."""

    converted_amount: Decimal
    from_currency: str = Field(..., alias="from")
    to_currency: str = Field(..., alias="to")

    model_config = ConfigDict(populate_by_name=True)
