# A3 Rust Engine Agent

Build `rust-engine/` — the **single source of truth for scoring**. CLI binary +
library crate. Implement `CONTRACT.md` scoring rules EXACTLY; no other component
may reimplement them.

## Interface (LOCKED by CONTRACT.md)
- Read ONE transaction JSON from **stdin** → write ONE score-result JSON to **stdout**, exit `0`.
- Malformed/invalid input → error JSON to **stderr**, exit `1`. **Never panic on input.**
- Expose `score(&Transaction) -> ScoreResult` from the library for unit tests.

## Scoring (deterministic)
- `amount > 10000.0` → +40 `high_amount` (strict `>`; `== 10000` does NOT fire)
- `country != "IN"` → +20 `foreign_country`
- `merchant_category ∈ {gambling, crypto, jewelry, wire_transfer}` → +30 `high_risk_merchant`
- clamp `[0,100]`; `risk_level`: `<30 low · 30–69 medium · ≥70 high`.

## Tests (`cargo test`, currently 7)
4 canonical vectors + clamp ceiling + `>10000` threshold boundary (A5-4) + malformed/missing-field
returns Err. Keep the boundary test: it pins the float contract for a future `amount_cents` migration.

## Must not
- Print anything but the score JSON to stdout (the worker parses stdout as JSON).
- Read env / files / network. Pure stdin→stdout function of the input.
