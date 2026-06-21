# Date Parser — Business Rules (Spec)

This spec defines the **expected behavior** of `date_string_to_timestamp` in
`sandbox/app/datetime_utils.py`. The safe-change artifact in
`docs/agent-analysis/I3_safe_change.md` is graded against these rules.

## Domain

The source system (`android-monorepo/flutter/pml-flutter`) charts **Indian market**
(NSE/BSE) data, so all wall-clock date strings are interpreted in **IST (UTC+5:30)**.
This makes the canonical example deterministic on any machine, independent of the
host timezone.

## Rules

1. `date_string_to_timestamp(date_string: str) -> int` returns **Unix seconds**.
2. Three input formats are supported, all interpreted as IST:
   | Format | Example | 
   |---|---|
   | `DD-MM-YYYY HH:mm` | `18-08-2025 09:15` |
   | `YYYY-MM-DD HH:mm` (space) | `2025-08-18 09:15` |
   | ISO-8601 with `T` separator | `2025-08-18T09:15:00` |
3. All three representations of the same instant MUST return the **same** timestamp.
   The canonical instant `2025-08-18 09:15` IST = **`1755488700`** (= `03:45` UTC).
4. A returned timestamp for a valid in-range date MUST be **positive** (post-epoch).
5. Unparseable input (e.g. `not-a-date`) MUST raise `ValueError` — never a silent
   wrong number.

## ⚠️ Seeded-bug disclosure

A bug was **intentionally seeded** into the *original* version of
`sandbox/app/datetime_utils.py` to exercise the I3 "smallest safe change" workflow
(reproduce → minimal fix → verify → rollback). The code committed to this repo is the
**fixed** version; the before/after evidence lives in `VERIFICATION_RESULTS.md` and the
buggy→fixed diff in `artifacts/i3-sandbox-fix.patch`.

**The seeded defect:** the parser tried the *lenient* `DD-MM-YYYY HH:mm` path first.
That path reads fields greedily without validating their widths, so it also "succeeds"
on `YYYY-MM-DD HH:mm` input — mis-reading the 4-digit year (`2025`) as the day — and
returned a garbage **negative** timestamp (`-61405935300`) instead of `1755488700`,
violating Rules 3 and 4. This is a faithful Python mirror of the documented Flutter
defect (`DateTimeUtils.dateStringToTimestamp`); see `docs/agent-analysis/I3_safe_change.md`.

This mirrors the disclosure pattern in the sibling `Intermediate/bug-diagnosis` module.
