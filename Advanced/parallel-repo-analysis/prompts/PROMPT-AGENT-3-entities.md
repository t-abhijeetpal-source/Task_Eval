# PROMPT-AGENT-3 — Room Data Model (Database & Entity)

> Read `_shared_constraints.md` first. Output: `docs/agent-analysis/A1_entities.md`.

**Mission:** Reconstruct the Room data model: databases, tables, primary keys, foreign keys,
relationships, indices.

**Scope:** `common-database/` (+ `api_failure_logging/`).

**Method / verification:**
1. **Authoritative source = exported schema JSONs** — the highest-version file per database
   (`schemas/**/<maxver>.json`). Read them, not just the annotations.
2. Reconcile three views and confirm they match exactly: `@Entity` classes ==
   `@Database(entities=[…])` registration == schema `tables[]`.
3. For each table record PK and PK type. Grep `@ForeignKey` across both DB modules and report the
   exact count (expected: 0 — a cache model). State `explicit FKs: NOT FOUND IN REPOSITORY` if 0.
4. Note any composite/unique indices and composite PKs.
5. Draw an ER Mermaid diagram; dashed edges = INFERRED shared-key links (`stock_id`/`isin`,
   detail↔summary), clearly labeled as not DB-enforced.

**Must report:** DB count, table count per DB and total, FK count (VERIFIED), reconciliation result.
