"""Unit tests for the shared currency_core service logic (no HTTP layer)."""

from decimal import Decimal

import pytest

from currency_core import services


def test_convert_returns_decimal():
    result = services.convert(100, "USD", "INR")
    assert isinstance(result, Decimal)


def test_convert_usd_to_inr():
    assert services.convert(100, "USD", "INR") == 8300


def test_convert_is_case_insensitive():
    assert services.convert(100, "usd", "inr") == 8300


def test_same_currency_uses_rate_one():
    assert services.convert(100, "USD", "USD") == 100


def test_fractional_result_is_preserved():
    # 50 EUR -> USD = 50 * 1.08 = 54 (integral); 10 USD -> EUR = 9.2 stays fractional.
    assert services.convert(50, "EUR", "USD") == Decimal("54")
    assert services.convert(10, "USD", "EUR") == Decimal("9.2")


def test_decimal_arithmetic_is_exact():
    # 0.10 + 0.20 worth: 0.30 USD -> USD must be exactly 0.3, not 0.30000000004.
    assert services.convert(Decimal("0.30"), "USD", "USD") == Decimal("0.3")


def test_non_positive_amount_raises():
    with pytest.raises(services.InvalidAmountError):
        services.convert(0, "USD", "INR")
    with pytest.raises(services.InvalidAmountError):
        services.convert(-5, "USD", "INR")


def test_unsupported_currency_raises():
    with pytest.raises(services.UnsupportedCurrencyError):
        services.convert(100, "USD", "GBP")
