"""Unit tests for the pure arithmetic layer (`app.calc`)."""

import pytest

from app.calc import add, is_even


@pytest.mark.parametrize(
    "a, b, expected",
    [
        (2, 3, 5),
        (-1, 1, 0),
        (-5, -7, -12),
        (0, 0, 0),
        (0, 9, 9),
    ],
)
def test_add(a, b, expected):
    assert add(a, b) == expected


def test_add_is_commutative():
    assert add(7, -4) == add(-4, 7)


def test_add_large_ints_no_overflow():
    # Python ints are arbitrary precision: arithmetic stays exact at any scale.
    big = 10**50
    assert add(big, big) == 2 * big
    assert add(big, -big) == 0


@pytest.mark.parametrize("n, expected", [(4, True), (0, True), (-2, True), (3, False), (-3, False)])
def test_is_even(n, expected):
    assert is_even(n) is expected


def test_is_even_large_values():
    assert is_even(10**18) is True
    assert is_even(10**18 + 1) is False
