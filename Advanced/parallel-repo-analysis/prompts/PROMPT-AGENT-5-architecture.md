# PROMPT-AGENT-5 — Architecture & Dependency Analysis

> Read `_shared_constraints.md` first. Output: `docs/agent-analysis/A1_architecture.md`.

**Mission:** Determine the architectural pattern, draw the layer map and module dependency graph,
and find layer violations.

**Scope:** equity vertical.

**Method / verification:**
1. Verdict per pattern (Clean Architecture, Repository iface+impl, UseCase iface+impl, MVVM, MVI,
   Dagger, Hilt, Room, Retrofit) with confidence + cited paths. MVI must be substantiated by a
   sealed-intent + reduced state; if absent, mark `UNVERIFIED / NOT DOMINANT`.
2. Layer map: UI → ViewModel → UseCase → Repository(iface) → Repository(impl) → Remote/Local, each
   with a cited key path. Mermaid diagram.
3. Module dependency graph from `implementation project(':…')` edges (cite the `build.gradle` line
   ranges). State the node count and what scope it covers (so it reconciles with Agent 1's count).
4. **Layer violations:** find presentation reaching into data/Room (e.g. a ViewModel taking a
   `*Database` constructor field; `data/` nested under `presentation/`). Cite `file:line`.
5. When citing the Room layer, use the **verified entity count** (24 in EquityDatabase v19) — never
   an approximate "25".

**Must report:** the architecture verdict, the dependency graph + node count/scope, ≥1 cited violation.
