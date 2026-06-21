# FastAPI Currency Conversion Service (I4)

Exposes `POST /convert` with hardcoded rates. Clean separation: route → service → validation.

## Installation

```bash
cd fastapi-service
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```

## Run

```bash
uvicorn app.main:app --port 8000          # http://localhost:8000/docs
```

## Test & benchmark

```bash
pytest -v                 # 23 service tests (TestClient)
python bench_convert.py   # perf gate: p50 POST /convert < 10ms
```

Money is handled as exact **`Decimal`** (never binary `float`) end-to-end; results are quantised
HALF_UP to 6 decimal places. See the locked [`CONTRACT.md`](../CONTRACT.md).

## API Contract

### POST /convert

**Request**
```json
{ "amount": 100, "from": "USD", "to": "INR" }
```

**Success — 200**
```json
{ "converted_amount": 8300, "from": "USD", "to": "INR" }
```

**Errors**

| Case | Status | Body |
|---|---|---|
| Unsupported currency | `400` | `{"error": "Unsupported currency"}` |
| Non-positive amount | `422` | `{"error": "Amount must be positive"}` |
| Malformed request (missing/non-numeric field) | `422` | FastAPI validation `{"detail": [...]}` |

## Example Requests

```bash
# valid
curl -X POST localhost:8000/convert -H 'Content-Type: application/json' \
  -d '{"amount":100,"from":"USD","to":"INR"}'
# -> {"converted_amount":8300,"from":"USD","to":"INR"}

# unsupported currency -> 400
curl -X POST localhost:8000/convert -H 'Content-Type: application/json' \
  -d '{"amount":100,"from":"USD","to":"GBP"}'

# negative amount -> 422
curl -X POST localhost:8000/convert -H 'Content-Type: application/json' \
  -d '{"amount":-5,"from":"USD","to":"INR"}'
```

## Layering

| Layer | File | Responsibility |
|---|---|---|
| Route | `currency_core/routes.py` | HTTP only; maps service errors → status codes |
| Service | `currency_core/services.py` | conversion logic + hardcoded rates (no HTTP) |
| Validation | `currency_core/schemas.py` | Pydantic request schema (required/numeric/string) |
| Entry | `app/main.py` | FastAPI app + router mount (the only file local to this service) |

Conversion logic is **not** in the routes.

## Architecture — shared `currency-core` package

The conversion logic, schemas, and routes are **not** duplicated per service. They live
once in the [`currency-core`](../../shared/currency-core) package
(`Intermediate/shared/currency-core`), which both this service (I4) and the dockerized
service (I5) import. This service contributes only a thin `app/main.py` that mounts
`currency_core.routes.router`.

Installing `requirements.txt` performs an **editable** install of the shared package
(`-e ../../shared/currency-core`), so edits to the core are picked up without reinstalling.

**Why a shared package (Option A)** over the alternatives:

| Option | Idea | Why not chosen |
|---|---|---|
| **A — shared package** ✅ | One installable `currency_core`, imported by both | — (chosen: DRY, versioned, independently testable) |
| B — thin wrapper | I5 `COPY`s I4's `app/` in its Dockerfile | Couples build to a sibling path; no clean version boundary |
| C — git submodule | Canonical `app/` as a submodule | Heavyweight for a single-repo monorepo; awkward dev loop |
