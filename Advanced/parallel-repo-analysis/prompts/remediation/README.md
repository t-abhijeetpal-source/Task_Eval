# Target-repo remediation prompts (PROMPT-023..032)

Self-contained prompts that fix the **analyzed** repo (`android-monorepo`), each derived from a
verified finding in the A1 reports. This deliverable does **not** have write access to that repo
(program constitution), so these are **Spec Ready**: hand a prompt to an agent with a writable
`TARGET_REPO` checkout and it can execute end-to-end.

| Prompt | Sev | Fixes | From |
|---|---|---|---|
| PROMPT-023 | HIGH | CI runs only `:base_app` unit tests | master Risk #1 / SEC-1 |
| PROMPT-024 | MED | jacoco coverage gates void / non-blocking | master Risk #2 |
| PROMPT-025 | MED | layer violations (presentation→data) | master Risk #3 |
| PROMPT-026 | MED | no guardrail preventing re-introduction | master Risk #3 |
| PROMPT-027 | LOW | undocumented 27-table no-FK Room model | master Risk #4 |
| PROMPT-028 | LOW | stale coverage % + wrong pml-flutter path | master Risk #5 |
| PROMPT-029 | LOW | Retrofit base-URL provider undocumented | master Unknowns |
| PROMPT-030 | MED | unaudited dependency versions/CVEs | `A1_dependencies.md` |
| PROMPT-031 | HIGH | security findings | `A1_security.md` |
| PROMPT-032 | MED | performance findings | `A1_performance.md` |

**Order if executing live:** 023 (CI) → 024 (gates) → 025/026 (layers) → 031 (security) →
032 (perf) → 027/028/029/030 (docs/deps). Each prompt ends with an acceptance check.

> Every prompt is read-mostly + minimal-diff, with a required green-CI / passing-test gate before
> claiming done, and forbids fabricating pass/fail.
