"""Service layer — currency conversion business logic.

Conversion logic lives here, NOT in the routes. Uses hardcoded rates and exact
``Decimal`` arithmetic (no binary float rounding error). Raises typed errors
that the route layer maps to HTTP status codes.

Precision policy: results are rounded HALF_UP to 6 decimal places, then rendered
as an integer when integral (``8300``) and a trimmed decimal otherwise (``9.2``).
"""

from decimal import ROUND_HALF_UP, Decimal
from typing import Dict, Tuple, Union

#: Inputs accepted by ``convert`` — anything losslessly representable as Decimal.
Number = Union[Decimal, int, float, str]

SUPPORTED_CURRENCIES = {"USD", "INR", "EUR"}

# Hardcoded conversion rates, keyed by (from, to). Decimal so amount * rate stays
# exact (mixing Decimal with float would raise TypeError).
RATES: Dict[Tuple[str, str], Decimal] = {
    ("USD", "INR"): Decimal("83"),
    ("USD", "EUR"): Decimal("0.92"),
    ("INR", "USD"): Decimal("0.012"),
    ("EUR", "USD"): Decimal("1.08"),
    ("INR", "EUR"): Decimal("0.011"),
    ("EUR", "INR"): Decimal("90"),
}

#: Quantisation step for the 6-decimal-place precision policy.
_PRECISION = Decimal("0.000001")


class InvalidAmountError(Exception):
    """Raised when the amount is not strictly positive."""


class UnsupportedCurrencyError(Exception):
    """Raised when a currency is not supported, or the pair has no rate."""


def _as_decimal(value: Number) -> Decimal:
    """Coerce supported inputs to Decimal without going through binary float.

    ``Decimal(str(x))`` avoids float artefacts (e.g. ``Decimal(0.1)``).
    """
    if isinstance(value, Decimal):
        return value
    return Decimal(str(value))


def _normalize_number(value: Decimal) -> Decimal:
    """Round to the precision policy, then render integrals without a fraction.

    Keeps `100 USD -> INR` rendering as `8300` (per the contract) while
    preserving fractional results like `1.2`. FastAPI's encoder then maps an
    integral Decimal to a JSON int and a fractional one to a JSON number.
    """
    quantized = value.quantize(_PRECISION, rounding=ROUND_HALF_UP)
    if quantized == quantized.to_integral_value():
        return quantized.to_integral_value()
    # Drop trailing zeros for fractional results (9.200000 -> 9.2).
    return quantized.normalize()


def convert(amount: Number, from_currency: str, to_currency: str) -> Decimal:
    """Convert `amount` from one currency to another.

    Validation order matches the API contract:
      1. amount must be > 0          -> InvalidAmountError (HTTP 422)
      2. currencies must be supported -> UnsupportedCurrencyError (HTTP 400)
    """
    amount = _as_decimal(amount)
    if not amount.is_finite() or amount <= 0:
        raise InvalidAmountError("Amount must be positive")

    frm = from_currency.upper()
    to = to_currency.upper()

    if frm not in SUPPORTED_CURRENCIES or to not in SUPPORTED_CURRENCIES:
        raise UnsupportedCurrencyError("Unsupported currency")

    if frm == to:
        rate = Decimal(1)
    else:
        rate = RATES.get((frm, to))
        if rate is None:
            raise UnsupportedCurrencyError("Unsupported currency")

    return _normalize_number(amount * rate)
