# I3 — AI-Judge Scoring Rubric (Smallest Safe Change)

A weighted rubric for an AI judge (or human reviewer) grading an I3 submission. The
question I3 answers for a reviewer: *"What changed, why exactly these files, what could
it break, how is it proven, and how do I revert it?"* Weights sum to **100**.

## Scoring dimensions

| # | Dimension | Weight | What full marks looks like |
|---|---|---:|---|
| 1 | **Minimal diff / blast radius** | 20 | Fix touches ≤3 files (ideally 1). No drive-by reformatting, renames, or unrelated cleanups. Every hunk is justified in a Files-Changed table. |
| 2 | **Before/after test proof** | 25 | A test that **fails before** the change and **passes after**, with *real* pasted output for both states (not described, not predicted). |
| 3 | **Root cause cited** | 12 | Exact `file:line`/function named, with the mechanism (why it fails), not just the symptom. |
| 4 | **Risk assessment + callers search** | 13 | Inbound callers enumerated (grep/ripgrep output) to bound impact; Low/Medium/High justified by blast radius, consumers, coverage. |
| 5 | **Rollback plan** | 10 | Exact revert command (`git revert` / branch delete / one-line undo) **and** a statement of data/state caveats. Bonus if the rollback is actually verified. |
| 6 | **Agent-suggested vs manually-verified separation** | 10 | The two are kept in distinct sections; "verified" items are backed by executed commands + output. No blurring. |
| 7 | **Quality gates beyond tests** | 6 | Lint/type-check/compile re-run after the change with real output (tests necessary, not sufficient). |
| 8 | **Reproducibility & honesty** | 4 | An evaluator can reproduce from a clone alone (e.g. `make i3-verify`); unverifiable external facts marked `NOT FOUND IN REPOSITORY`; seeded bugs disclosed. |
| | **Total** | **100** | |

## Banding

| Score | Band |
|---|---|
| 95–100 | Exemplary — surgical, fully proven, reproducible, honest |
| 85–94 | Strong — minor gaps (e.g. rollback not verified) |
| 70–84 | Adequate — proof present but thin on risk/callers or gates |
| < 70 | Insufficient — missing before/after proof or unjustified diff |

## Anti-patterns (deduct hard)

- **Claiming success without running tests** — any "should pass" / predicted output. (Caps dimension 2 at 0.)
- **Fabricated output or invented SHAs** for facts not present in the repo (use `NOT FOUND IN REPOSITORY`).
- **Scope creep** — refactors, dependency bumps, signature changes folded into a "safe" change.
- **Diff noise** — reformatting, reordered imports, stray debug prints in the diff.
- **Symptom-only root cause** — "it was wrong, now it's right" with no mechanism.
- **Blurring agent vs verified** — presenting generated text as if executed.
- **Only-after proof** — showing the passing run but never reproducing the failure.
- **Externally-dependent proof** — verification that needs a repo/SDK an evaluator can't clone.

## How this submission maps to the rubric

| Dim | Evidence in this module |
|---|---|
| 1 | `artifacts/i3-sandbox-fix.patch` — 1 file, every hunk justified in the artifact's Files-Changed table |
| 2 | `VERIFICATION_RESULTS.md` §1 (2 failed) → §4 (5 passed), real pytest output |
| 3 | Artifact §2 + SPEC.md — `date_string_to_timestamp`, lenient parser mechanism |
| 4 | `scripts/caller_search.sh` output (8 refs) in VERIFICATION_RESULTS.md §2 |
| 5 | VERIFICATION_RESULTS.md §6 — reverse patch validated; no persisted state |
| 6 | Artifact §8 — Agent Suggested vs Manually Verified |
| 7 | `ruff check .` → clean (VERIFICATION_RESULTS.md §4) |
| 8 | `make i3-verify` (clone-only); Flutter facts marked `NOT FOUND IN REPOSITORY`; seeded-bug disclosure in SPEC.md |
