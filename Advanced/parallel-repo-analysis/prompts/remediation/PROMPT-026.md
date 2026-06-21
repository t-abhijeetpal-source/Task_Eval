# PROMPT-026 — Guardrail against presentation→data imports (MED)

**Repo:** `$TARGET_REPO`. **Source finding:** master Risk #3 — once PROMPT-025 fixes the violations,
add an automated rule so they cannot be reintroduced.

## Goal
Add a static check that fails the build when a `presentation/` (or `*ViewModel`) source imports
`androidx.room.*`, a Room entity/DAO, or a feature's `data/` package.

## Steps
1. Prefer **Konsist** (Kotlin architecture-test library): add a test asserting "classes in
   `..presentation..` do not depend on `..data..` or `androidx.room..`". Place it in a module that
   runs in CI.
2. If Konsist isn't desired, add a **detekt** custom rule or a CI grep gate
   (`grep -rn 'androidx.room' equity_sdk/**/presentation` must be empty), wired into the pipeline.
3. Allow-list any intentional exceptions explicitly with a comment + rationale (there should be none
   after PROMPT-025).
4. Document the rule in the architecture doc.

## Acceptance
- The rule fails when a presentation file imports Room/data (prove by a temporary violation), and
  passes on the cleaned tree.
- The check runs in CI (ties into PROMPT-023).
