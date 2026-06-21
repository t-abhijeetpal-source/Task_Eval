# A1 — Agent & Coordinator Prompts

These are the self-contained prompts that drive the parallel analysis, preserved so the run is
**reproducible** (AUDIT-022). Six lane prompts fan out independently; two coordinator prompts run
after. Shared rules (apply to every agent) live in `_shared_constraints.md`.

| File | Role | Phase | Output |
|---|---|---|---|
| `_shared_constraints.md` | Scope, evidence rules, independence | all | — |
| `PROMPT-AGENT-1-inventory.md` | Repository inventory | 2 | `A1_inventory.md` |
| `PROMPT-AGENT-2-api-map.md` | Outbound API surface | 2 | `A1_api_map.md` |
| `PROMPT-AGENT-3-entities.md` | Room data model | 2 | `A1_entities.md` |
| `PROMPT-AGENT-4-tests.md` | Test discovery | 2 | `A1_tests.md` |
| `PROMPT-AGENT-5-architecture.md` | Architecture & deps | 2 | `A1_architecture.md` |
| `PROMPT-AGENT-6-flow-trace.md` | End-to-end flow trace | 2 | `A1_flow_trace.md` |
| `PROMPT-COORD-3-verify.md` | Cross-verification | 3 | `A1_verification_report.md` |
| `PROMPT-COORD-4-consolidate.md` | Consolidation | 4 | `A1_repository_master_report.md` |

Run order: all 6 AGENT prompts in parallel (no cross-reading) → COORD-3 → COORD-4.
`remediation/` holds the target-repo fix prompts (PROMPT-023..032).
