"""Pure arithmetic functions exercised by the unit tests.

Kept deliberately small; Python ints are arbitrary precision, so these never
overflow — input bounding is enforced at the HTTP boundary (see ``app.main``).
"""


def add(a: int, b: int) -> int:
    """Return the sum of two integers."""
    return a + b


def is_even(n: int) -> bool:
    """Return True if ``n`` is even."""
    return n % 2 == 0
