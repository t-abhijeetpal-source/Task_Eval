# PROMPT-025 — Fix Clean-Architecture layer violations (MED)

**Repo:** `$TARGET_REPO`. **Source finding:** master Risk #3 / `A1_architecture.md` — presentation
reaching into data/local: `IndexDetailsViewModel.kt:77` takes `EquityDatabase` as a constructor
field; `orders/.../paymentoptions` and `quickOrderpad` nest a full `data/` under `presentation/`;
widespread presentation imports of Room entities. `funds` is the clean reference.

## Goal
Route presentation through domain (UseCase/Repository) instead of touching Room/`data` directly, for
the cited offenders, using `funds` as the template.

## Steps
1. **`IndexDetailsViewModel`:** replace the `EquityDatabase` constructor dependency with a
   UseCase/Repository abstraction (mirror `EquityFundsDetailsViewModel` → `GetFundsSubscriptionsUseCase`
   → `EquityCommonRepository`). Move DB access behind a DAO-backed repository method.
2. **`orders/.../paymentoptions` and `quickOrderpad`:** move the `data/` packages nested under
   `presentation/` to the feature's own `data/` layer; have presentation depend on the domain
   interface, not the impl.
3. Replace presentation imports of Room entities with UI/domain models (add mappers where needed).
4. Update the DI wiring (Dagger module/`Injector`) accordingly. Keep diffs minimal and per-feature.

## Acceptance
- The cited offenders no longer reference `EquityDatabase`/DAOs/Room entities from `presentation/`.
- Existing tests still pass (run the equity_sdk unit tests via PROMPT-023's step); add a focused test
  for each refactored ViewModel.
- `A1_architecture.md` layer-violation section updated to reflect the fixes.
