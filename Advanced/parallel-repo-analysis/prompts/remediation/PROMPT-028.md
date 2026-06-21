# PROMPT-028 — Refresh stale documentation (LOW)

**Repo:** `$TARGET_REPO`. **Source finding:** master Risk #5 — stale coverage figure (78.6%) and a
wrong `pml-flutter` path appear in existing docs.

## Goal
Correct the drifted facts so docs match reality.

## Steps
1. Find the stale `78.6%` coverage claim (`grep -rn '78.6'`). Replace it with the **current** number
   produced by the valid jacoco report from PROMPT-024, or remove the hard-coded figure and link to
   the generated report. Never invent a number.
2. Find the wrong `pml_flutter`/`pml-flutter` path references (`grep -rn 'pml_flutter'`) and correct
   them to the actual module path (`flutter/pml-flutter`).
3. Scan for other obviously stale counts that the A1 reports corrected (e.g. Retrofit "71").

## Acceptance
- No `78.6%` literal remains unless it is the real current value; coverage is sourced from the report.
- Flutter path references resolve to real directories (`test -d`).
