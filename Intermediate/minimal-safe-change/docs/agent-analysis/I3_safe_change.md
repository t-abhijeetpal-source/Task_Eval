# I3 — Small Safe Change (Date-String Parser)

This artifact documents one minimal, fully-verified date-parser fix in **two forms**:

- **Primary (in-repo, runnable):** the Python sandbox at `../../sandbox/` — reproducible
  by an evaluator from a clone alone (`make i3-verify`).
- **Extended (optional):** the original Dart fix on `android-monorepo/flutter/pml-flutter`,
  preserved below as a real-world example. That repo is **not vendored** here.

## Metadata

| Field | Sandbox (primary) | Flutter (extended) |
|---|---|---|
| Repository | `Task_Eval` / `Intermediate/minimal-safe-change/sandbox` | `android-monorepo/flutter/pml-flutter` |
| Branch | n/a (committed fixed; buggy state via `artifacts/i3-sandbox-fix.patch`) | `fix/i3-date-string-yyyy-mm-dd-parse` |
| Base commit | n/a (in-repo) | `NOT FOUND IN REPOSITORY` |
| Fix commit | n/a (in-repo) | `NOT FOUND IN REPOSITORY` |
| Verified at | 2026-06-21 · Python 3.12.7 · pytest 8.4.2 · ruff | `NOT FOUND IN REPOSITORY` |
| Status | **REPRODUCED → FIXED → VERIFIED** (5/5 tests, ruff clean) | **IMPLEMENTED AND TEST-VERIFIED** (40/40, per prior run) |

> The Python sandbox reproduces the **exact** garbage value (`-61405935300`) documented
> for the Flutter defect, confirming it is a faithful mirror.

---

## 1. Problem Statement

`DateTimeUtils.dateStringToTimestamp()` returned a garbage negative timestamp when given
`YYYY-MM-DD HH:mm` input (e.g. `"2025-08-18 09:15"`) because the lenient `dd-MM-yyyy HH:mm`
DateFormat silently mis-parsed the year as the day before the ISO fallback could run.

---

## 2. Root Cause

**File:** `lib/core/utils/datetime_utils_internal.dart` — function `dtuDateStringToTimestamp` (lines 4–25)

The parser tried `DateFormat('dd-MM-yyyy HH:mm')` first. That formatter is lenient: it accepts
`2025-08-18 09:15` without throwing, interpreting `2025` as the day component. The nested
`yyyy-MM-dd HH:mm` catch block never executed, producing timestamp `-61405935300` instead of
`1755488700`.

An existing test explicitly documented this as known-broken behavior and directed callers to use
`dateStringToTimestampV2` instead.

---

## 3. Files Changed

| File | Reason |
|---|---|
| `lib/core/utils/datetime_utils_internal.dart` | Detect `YYYY-MM-DD HH:mm` via regex and parse with the correct formatter before the lenient DD-MM-YYYY attempt |
| `test/core/utils/date_time_utils_test.dart` | Flip the documented-bug test to assert correct parsing |
| `test/core/utils/datetime_utils_internal_test.dart` | New focused tests for `dtuDateStringToTimestamp` (required by TDD guard) |

---

## 4. Diff Summary

**Branch:** `fix/i3-date-string-yyyy-mm-dd-parse`

```diff
 int dtuDateStringToTimestamp(String dateString) {
   try {
+    // Try yyyy-MM-dd first — dd-MM-yyyy DateFormat is lenient and mis-parses ISO dates.
+    if (RegExp(r'^\d{4}-\d{2}-\d{2} \d{2}:\d{2}').hasMatch(dateString)) {
+      final DateFormat formatter2 = DateFormat('yyyy-MM-dd HH:mm');
+      final DateTime parsedDate = formatter2.parse(dateString);
+      return parsedDate.millisecondsSinceEpoch ~/ 1000;
+    }
     try {
       final DateFormat formatter1 = DateFormat('dd-MM-yyyy HH:mm');
       ...
     } catch (e1) {
-      try { /* yyyy-MM-dd fallback — unreachable on lenient misparse */ }
-      catch (e2) { DateTime.parse(...) }
+      final DateTime parsedDate = DateTime.parse(dateString);
+      return parsedDate.millisecondsSinceEpoch ~/ 1000;
     }
```

**Hunk rationale:**
- **Regex guard:** Only routes space-separated `YYYY-MM-DD HH:mm` strings to the ISO formatter; ISO-8601 with `T` separator still falls through to `DateTime.parse`.
- **Removed nested try/catch:** The old inner fallback was dead code for the bug case because lenient parse never throws.
- **Test updates:** Assert equality instead of `isNot(equals(...))`; add direct unit tests on the internal function.

---

## 5. Test Results

### Before fix (failing)

```text
Command: flutter test test/core/utils/datetime_utils_internal_test.dart --name "parses YYYY-MM-DD HH:mm format"
Output:
  Expected: <1755488700>
    Actual: <-61405935300>
  Some tests failed.
```

### After fix (passing)

```text
Command: flutter test test/core/utils/datetime_utils_internal_test.dart test/core/utils/date_time_utils_test.dart
Output:
  00:05 +40: All tests passed!
```

### Lint

```text
Command: flutter analyze lib/core/utils/datetime_utils_internal.dart
Output:
  No issues found! (ran in 4.8s)
```

---

## 6. Risk Assessment

**Low**

- **Blast radius:** Single utility function used by chart view-models and data adapters (~15 call sites). DD-MM-YYYY and ISO-8601 (`T`) paths unchanged.
- **Consumers:** `PMLLiveChartViewModel`, `PMLAtmPcrChartViewModel`, `chart_data_adapter`, `prf_price_synchronizer` — all benefit from correct YYYY-MM-DD parsing via the shared `dateStringToTimestamp` API.
- **Coverage:** 40 tests in the two date-time test files; new test file adds direct coverage of the internal parser.

---

## 7. Rollback Plan

```bash
cd android-monorepo/flutter/pml-flutter
git checkout development
git branch -D fix/i3-date-string-yyyy-mm-dd-parse
```

Or, after merge: `git revert <commit-sha>`.

No database or persisted state changes — pure in-memory parsing logic.

---

## 8. Agent vs Verified

### Agent Suggested

- Identified the documented misparse in `date_time_utils_test.dart` as the fix target.
- Proposed routing `YYYY-MM-DD HH:mm` inputs to the ISO formatter before the lenient DD-MM-YYYY attempt.
- Created branch `fix/i3-date-string-yyyy-mm-dd-parse`.
- Added `datetime_utils_internal_test.dart` to satisfy the TDD guard hook.
- Refined regex after ISO-8601 regression (`T` separator must still use `DateTime.parse`).

### Manually Verified

- Baseline failure reproduced: `Actual: <-61405935300>` on YYYY-MM-DD input.
- Post-fix: `flutter test test/core/utils/datetime_utils_internal_test.dart test/core/utils/date_time_utils_test.dart` → **40/40 passed**.
- `flutter analyze lib/core/utils/datetime_utils_internal.dart` → **No issues found**.
- Caller search via grep confirmed ~15 usages of `dateStringToTimestamp`; no signature changes.

> **Sections 1–8 above describe the extended Flutter example.** The primary, in-repo
> Python sandbox carries the same workflow with *executed-this-clone* evidence in
> [`../../VERIFICATION_RESULTS.md`](../../VERIFICATION_RESULTS.md) and the git-apply-able
> diff in [`../../artifacts/i3-sandbox-fix.patch`](../../artifacts/i3-sandbox-fix.patch).

---

## 9. Business Impact

`date_string_to_timestamp` feeds **chart x-axes and time-series alignment** for market
data. The defect mis-parsed `YYYY-MM-DD HH:mm` timestamps into a garbage **negative**
value (~year 23 AD), so any code path receiving that format would:

| Severity | Surface | Effect |
|---|---|---|
| **Display (high-visibility, low-compliance)** | Live/ATM-PCR charts, price sync | Data points plotted at a nonsensical epoch → blank/compressed charts, broken zoom, misaligned series. Visible but not financially incorrect. |
| **Compliance (low-visibility, high-stakes)** | Any persisted/exported timestamp derived from this path | A negative Unix second written to a record or audit/export is a *silent* data-integrity fault — far more dangerous than the visible chart glitch because it can pass review unnoticed. |

The fix is therefore **Low risk to ship** (additive guard, no signature change) but closes
a **disproportionately high-impact** correctness gap — exactly the asymmetry I3 targets.

---

## 10. Cross-language pattern

The same defect class — *a lenient/greedy parser ordered before a stricter one, silently
"succeeding" on input meant for the stricter path* — reproduces identically across stacks:

| | Primary (Python sandbox) | Extended (Flutter) |
|---|---|---|
| Symbol | `date_string_to_timestamp` | `DateTimeUtils.dateStringToTimestamp` |
| Lenient parser | manual greedy `DD-MM-YYYY` field read | `DateFormat('dd-MM-yyyy HH:mm')` (lenient) |
| Guard added | `re.match(r"^\d{4}-\d{2}-\d{2} \d{2}:\d{2}")` | `RegExp(r'^\d{4}-\d{2}-\d{2} \d{2}:\d{2}')` |
| Wrong value | `-61405935300` | `-61405935300` |
| Correct value | `1755488700` | `1755488700` |
| Proof | `pytest` 5/5 + `ruff` (this clone) | `flutter test` 40/40 (external repo) |

The guard-then-fallthrough fix is the **minimal** correction in both: it routes the ISO
shape to the right formatter without touching the working `DD-MM-YYYY` or ISO-`T` paths.

---

## Appendix — Regression Test Matrix

| Format | Input | Expected | Test name | Status |
|---|---|---|---|---|
| `YYYY-MM-DD HH:mm` (space) | `2025-08-18 09:15` | `1755488700` | `test_iso_space_format_parses_correctly` | ✅ (was ❌ pre-fix: `-61405935300`) |
| `DD-MM-YYYY HH:mm` | `18-08-2025 09:15` | `1755488700` | `test_ddmmyyyy_format_still_parses` | ✅ (unchanged by fix) |
| ISO-8601 `T` | `2025-08-18T09:15:00` | `1755488700` | `test_iso8601_with_t_separator_parses` | ✅ (unchanged by fix) |
| Invalid | `not-a-date` | `ValueError` | `test_invalid_input_raises_value_error` | ✅ |
| Sign guard | `2025-08-18 09:15` | `> 0` | `test_iso_space_is_not_negative` | ✅ (was ❌ pre-fix) |

All inputs interpreted as IST (UTC+5:30); see [`../../SPEC.md`](../../SPEC.md).
