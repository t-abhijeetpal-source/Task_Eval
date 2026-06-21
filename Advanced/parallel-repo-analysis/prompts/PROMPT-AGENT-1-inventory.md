# PROMPT-AGENT-1 — Repository / Artifact Inventory

> Read `_shared_constraints.md` first. Output: `docs/agent-analysis/A1_inventory.md`.

**Mission:** Produce a module/artifact inventory of the repo: Gradle modules, Retrofit services,
repositories, ViewModels, models, jobs, utils, configs.

**Scope:** all top-level modules (counts only) + the equity vertical (deep).

**Method / verification:**
1. Enumerate modules from `settings.gradle` (`include ':…'`) and cross-check `build.gradle`
   `project(':…')` references. Report both raw include-line count and unique `:module` count.
2. Per equity-vertical module, grep naming conventions and report counts per group:
   `*Service.kt`, `*Repository*.kt` (iface/impl), `*ViewModel*.kt`, `*UseCase*.kt`, `*Dao.kt`,
   model/DTO classes, DI components/modules.
3. Cite `settings.gradle` / `build.gradle` line ranges for module facts. Label everything
   VERIFIED/INFERRED. Cap ~15 per group; summarize the tail with `+N more in <path>`.
4. Note any module whose code exists only as `build/` copies → `NOT FOUND IN REPOSITORY`.

**Must report:** module count (with the include-vs-unique distinction), per-group counts, and the
biggest modules by file count.
