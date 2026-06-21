# PROMPT-COORD-4 — Consolidation (Phase 4)

> Coordinator role. Inputs: 6 lane reports + verification report. Output:
> `docs/agent-analysis/A1_repository_master_report.md`.

**Mission:** Merge the verified findings into one master report a stakeholder can read top-to-bottom.

**Merge order:** Inventory → Architecture → Entities → API → Flow → Tests (structure → organization →
data → interfaces → dynamic behavior → quality gates). Reconcile later lanes against earlier facts.

**Required sections:**
1. **Metrics** table — Files scanned · Modules · Endpoints · Entities · Tests · Contradictions
   resolved. Each cell carries a VERIFIED/INFERRED status. Counts must match the manifest.
2. Repository overview, architecture summary (+ layer & module Mermaid diagrams).
3. API inventory, entity inventory (+ ER diagram), data flows (+ sequence diagram).
4. Test strategy, **Risks** (severity-ranked, cited), Unknowns, Recommendations.
5. **Agent Findings vs Verified Findings** — what each specialist reported vs what the coordinator
   confirmed against source.
6. **Completion criteria** — checklist, every box `[x]`.
7. (Remediation) a backlog table linking to the audit/tracker.

**Rule:** use only VERIFIED values in headline metrics; mark anything else INFERRED/UNVERIFIED.
Use the corrected entity count (24 EquityDatabase + 3 LoggingDataBase = 27 total).
