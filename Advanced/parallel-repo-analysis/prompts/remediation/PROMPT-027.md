# PROMPT-027 — Publish the Room data-model documentation (LOW)

**Repo:** `$TARGET_REPO`. **Source finding:** master Risk #4 / `A1_entities.md` — 27 tables across
2 Room DBs with **0 enforced foreign keys** (a cache model). Consumers may wrongly assume relational
integrity; the model is undocumented.

## Goal
Add an in-repo doc describing the data model, the no-FK design decision, and the INFERRED shared-key
conventions so engineers don't assume DB-level integrity.

## Steps
1. Generate the table list from the **authoritative exported schemas** (`common-database/schemas/.../19.json`
   = 24 tables; `api_failure_logging/schemas/.../7.json` = 3 tables). Do not hand-type.
2. Document for each table: PK + PK type; note the single composite unique index on
   `kyc_status_data(moduleName, irStatus, subType)`.
3. State explicitly: **no `@ForeignKey` anywhere; integrity is app-enforced.** List the INFERRED
   shared-key links (`stock_id`/`isin`; detail↔summary) and mark them as conventions, not constraints.
4. Include the ER Mermaid diagram from `A1_entities.md`. Commit under the repo's docs folder.

## Acceptance
- Doc exists, table count matches schema JSONs exactly (24 + 3 = 27), and the no-FK decision is stated.
- A reviewer can map every table to its schema source.
