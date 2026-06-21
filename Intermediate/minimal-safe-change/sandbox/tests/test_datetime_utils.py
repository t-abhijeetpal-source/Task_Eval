"""Tests for ``date_string_to_timestamp`` — the regression matrix in code form.

All wall-clock inputs are interpreted as IST (UTC+5:30); see ``app/datetime_utils.py``.
The canonical instant ``2025-08-18 09:15`` IST is Unix second ``1755488700``.
"""

import pytest

from app.datetime_utils import date_string_to_timestamp

# 2025-08-18 09:15 IST == 03:45 UTC == 1755488700.
EXPECTED = 1755488700


def test_iso_space_format_parses_correctly():
    """YYYY-MM-DD HH:mm (space). FAILS before the fix: the lenient DD-MM-YYYY
    parser mis-reads the year as the day and returns a garbage negative value."""
    assert date_string_to_timestamp("2025-08-18 09:15") == EXPECTED


def test_ddmmyyyy_format_still_parses():
    """DD-MM-YYYY HH:mm must keep working (regression guard for the lenient path)."""
    assert date_string_to_timestamp("18-08-2025 09:15") == EXPECTED


def test_iso8601_with_t_separator_parses():
    """ISO-8601 with a 'T' separator must keep working (the no-time fallback path)."""
    assert date_string_to_timestamp("2025-08-18T09:15:00") == EXPECTED


def test_invalid_input_raises_value_error():
    """Unparseable input surfaces a ValueError rather than a silent wrong number."""
    with pytest.raises(ValueError):
        date_string_to_timestamp("not-a-date")


def test_iso_space_is_not_negative():
    """Direct guard against the seeded bug's negative-timestamp symptom."""
    assert date_string_to_timestamp("2025-08-18 09:15") > 0
