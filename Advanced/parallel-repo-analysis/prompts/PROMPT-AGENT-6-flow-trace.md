# PROMPT-AGENT-6 — End-to-End Flow Trace

> Read `_shared_constraints.md` first. Output: `docs/agent-analysis/A1_flow_trace.md`.

**Mission:** Trace ONE end-to-end flow from UI to its final side effect (a DB write and/or API call),
resolving DI bindings at each hop.

**Scope:** a search / portfolio / recent flow.

**Method / verification:**
1. Pick a concrete user action (recommended: "user taps/bookmarks a stock in search → recorded").
2. Trace `file::function` per hop: Fragment → ViewModel → UseCase → Repository(impl) → side effects.
   Resolve each DI binding (`@Provides`/`@Binds`, which Dagger module, which DAO provider).
3. Identify the **final side effect(s)** with cited line numbers. If a repository method fans out to
   both a Retrofit call and a Room write (e.g. `Completable.mergeArrayDelayError`), document both
   and that they run in parallel.
4. Sequence Mermaid diagram. Tag any hop you couldn't fully resolve `(inferred)`.

**Must report:** the hop count, the final side effect(s) with `file:line`, and the DI resolution.
