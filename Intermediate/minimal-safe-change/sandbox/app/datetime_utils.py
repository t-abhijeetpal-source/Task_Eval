"""Date-string -> Unix-timestamp parsing for chart/market data.

A faithful, runnable Python mirror of the Flutter defect documented in
``docs/agent-analysis/I3_safe_change.md`` (``DateTimeUtils.dateStringToTimestamp``
in ``android-monorepo/flutter/pml-flutter``).

Timestamps are interpreted in **IST (UTC+5:30)** because the source app serves the
Indian market (NSE/BSE). This keeps the canonical example deterministic across
machines: ``2025-08-18 09:15`` IST == Unix second ``1755488700``.

SEEDED BUG (this file as originally written): the lenient ``DD-MM-YYYY`` parser is
tried *first*. It reads fields greedily without validating their widths, so it also
"succeeds" on ``YYYY-MM-DD HH:mm`` input — mis-reading the 4-digit year as the day —
and returns a garbage negative timestamp instead of routing to the ISO formatter.
See SPEC.md for the disclosure.
"""

from __future__ import annotations

import re
from datetime import datetime, timedelta, timezone

# The source Flutter app targets the Indian market; parse wall-clock times as IST.
IST = timezone(timedelta(hours=5, minutes=30))

_DMY_RE = re.compile(r"^(\d+)-(\d+)-(\d+) (\d+):(\d+)$")


def _parse_lenient_dmy(date_string: str) -> int:
    """Lenient ``DD-MM-YYYY HH:mm`` parse.

    Mirrors Dart's lenient ``DateFormat('dd-MM-yyyy HH:mm')``: it reads each field
    greedily and does *not* validate field widths. For a genuine ``18-08-2025 09:15``
    it is correct; for ``2025-08-18 09:15`` it mis-reads day=2025, month=08, year=18.
    """
    match = _DMY_RE.match(date_string)
    if match is None:
        raise ValueError(f"not DD-MM-YYYY HH:mm: {date_string!r}")
    day, month, year, hour, minute = (int(group) for group in match.groups())
    # Build from the 1st of the month + a day offset so an out-of-range "day" (e.g.
    # 2025) does not raise — exactly how the lenient formatter silently overflows.
    base = datetime(year, month, 1, tzinfo=IST)
    base += timedelta(days=day - 1, hours=hour, minutes=minute)
    return int(base.timestamp())


def _parse_iso_space(date_string: str) -> int:
    """Strict ``YYYY-MM-DD HH:mm`` (space separator) parse, interpreted as IST."""
    parsed = datetime.strptime(date_string, "%Y-%m-%d %H:%M").replace(tzinfo=IST)
    return int(parsed.timestamp())


def _parse_iso_t(date_string: str) -> int:
    """ISO-8601 with a ``T`` separator (e.g. ``2025-08-18T09:15:00``), interpreted as IST."""
    parsed = datetime.fromisoformat(date_string)
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=IST)
    return int(parsed.timestamp())


def date_string_to_timestamp(date_string: str) -> int:
    """Convert a date string to Unix seconds (IST wall-clock).

    Supported formats: ``DD-MM-YYYY HH:mm``, ``YYYY-MM-DD HH:mm`` (space), and
    ISO-8601 with a ``T`` separator.
    """
    # Route space-separated YYYY-MM-DD HH:mm to the strict ISO formatter first.
    # The lenient DD-MM-YYYY parser below also matches this shape and mis-reads the
    # year as the day, so it must be intercepted before that attempt.
    if re.match(r"^\d{4}-\d{2}-\d{2} \d{2}:\d{2}", date_string):
        return _parse_iso_space(date_string)
    try:
        # Lenient DD-MM-YYYY (e.g. 18-08-2025 09:15).
        return _parse_lenient_dmy(date_string)
    except ValueError:
        # ISO-8601 with a 'T' separator (e.g. 2025-08-18T09:15:00).
        return _parse_iso_t(date_string)
