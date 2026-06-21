# I4 — Currency Conversion Contract (v1.0, LOCKED)

> The single source of truth both components build to: the FastAPI service
> (`fastapi-service/`, which mounts the shared `currency_core.routes.router`) and
> the Node.js CLI (`node-client/`). HTTP behaviour and CLI behaviour are aligned
> against this document; tests and the integration script assert it verbatim.

---

## Endpoint — `POST /convert`

### Request body

```json
{ "amount": "100", "from": "USD", "to": "INR" }
```

| Field | Type | Required | Rule |
|---|---|---|---|
| `amount` | number **or decimal string** | **yes** | finite, `> 0`, ≤ 20 significant digits, ≤ 6 decimal places |
| `from` | string | **yes** | source currency code (case-insensitive); alias for `from_currency` |
| `to` | string | **yes** | target currency code (case-insensitive); alias for `to_currency` |

> **Precision policy.** `amount` is handled as an exact `Decimal` end-to-end — never a
> binary `float`. The Node CLI sends it as a **string** so no precision is lost in transit
> (`Number("0.1")` artefacts never reach the wire). The service quantises results HALF_UP to
> 6 decimal places, renders integral results as integers (`8300`) and fractional results
> trimmed (`1.2`).

### Success — `200`

```json
{ "converted_amount": 8300, "from": "USD", "to": "INR" }
```

`from` / `to` are echoed **upper-cased**. `converted_amount` is a JSON integer when integral,
otherwise a JSON number.

---

## Supported currencies & rates (hardcoded)

Currencies: `USD`, `INR`, `EUR`. Same-currency conversion uses rate `1`.

| From → To | Rate | `100` →  |
|---|---|---|
| USD → INR | 83    | 8300 |
| USD → EUR | 0.92  | 92   |
| INR → USD | 0.012 | 1.2  |
| EUR → USD | 1.08  | 108  |
| INR → EUR | 0.011 | 1.1  |
| EUR → INR | 90    | 9000 |

These six pairs are the canonical test vectors — pytest, the core suite, and the integration
script all assert them.

---

## Error contract

Validation runs in two tiers, in this order:

1. **Structural (Pydantic / `schemas.py`)** — `amount` present, finite, within
   magnitude/precision bounds; `from`/`to` present strings. Failures → **422** with FastAPI's
   `{"detail": [...]}` envelope.
2. **Business (`services.py`)** — amount `> 0`, then currency supported & pair has a rate.

| Case | Status | Body |
|---|---|---|
| Valid conversion | `200` | `{converted_amount, from, to}` |
| Non-positive amount (`amount ≤ 0`) | `422` | `{"error": "Amount must be positive"}` |
| Unsupported currency / no rate | `400` | `{"error": "Unsupported currency"}` |
| Malformed / missing / non-finite / out-of-range amount | `422` | `{"detail": [...]}` |

Order is fixed: **amount-positivity is checked before currency support.**

---

## CLI behaviour — `node src/convert.js <amount> <from> <to>`

- Parses args, validates `amount` as a positive decimal **string** (no float coercion),
  uppercases currencies, POSTs to `${API_URL}/convert` (default `http://localhost:8000`) with a
  `${API_TIMEOUT_MS}`ms timeout (default `5000`).
- On success prints `"<amount> <from> = <converted_amount> <to>"`.

### Exit codes (LOCKED)

| Code | Meaning | Trigger |
|---|---|---|
| `0` | success | `200` from the service |
| `1` | server error | non-2xx response (e.g. `400` unsupported currency) |
| `2` | bad CLI arguments | wrong arg count, non-numeric or non-positive amount |
| `3` | API unavailable | connection refused, or request timeout |

> Note: a non-positive amount is caught client-side by `parseArgs` → exit **2** (the request is
> never sent). A non-positive amount that reaches the *service* (e.g. via curl) → HTTP **422**.

---

## Integration flow

```
node-client → POST /convert (HTTP, JSON, string amount)
            → FastAPI route → currency_core.services.convert (Decimal)
            → 200 {converted_amount, from, to}
            → CLI prints "<amount> <from> = <converted> <to>", exit 0
```

The shared logic lives once in `Intermediate/shared/currency-core/currency_core/`
(`schemas.py`, `services.py`, `routes.py`) and is editable-installed into the service venv; the
I5 dockerized service mounts the same router. No conversion logic is duplicated.
