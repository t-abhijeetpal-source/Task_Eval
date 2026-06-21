# A3 Polyglot Fraud System — Operations Runbook

Operational procedures for running, monitoring, and recovering the A3 stack.
Audience: on-call / operator. For architecture see `docs/agent-analysis/A3_polyglot_system.md`.

---

## 1. Service map

| Service | What it does | Key env | Health |
|---|---|---|---|
| `api` (FastAPI :8000) | ingest, persist (SQLite), serve, accept score callback | `A3_INTERNAL_TOKEN` (req), `A3_API_KEY` (opt), `QUEUE_DIR`, `DATABASE_URL` | `GET /health` (live), `GET /health/ready` (DB + queue) |
| `worker` (Node) | consume queue → spawn Rust engine → POST score back | `A3_INTERNAL_TOKEN` (req), `API_URL`, `QUEUE_DIR`, `ENGINE_BIN`, `ENGINE_TIMEOUT_MS`, `MAX_OUTPUT_BYTES` | log line `queue pass complete` |
| `rust-engine` | stateless scoring CLI (spawned per txn) | — | exit 0 + JSON on stdout |

Flow: `POST /transactions` → `QUEUE_DIR/<id>.json` (status=pending) → worker scores → `POST /internal/.../score` (status=scored) → `GET /transactions/<id>`.

---

## 2. Start / stop

**Docker (recommended):**
```bash
export A3_INTERNAL_TOKEN=$(openssl rand -hex 32)
docker compose up --build -d
docker compose ps                 # both services; api should be (healthy)
docker compose logs -f worker
docker compose down               # add -v to wipe the queue + data volumes
```

**Bare metal:** see README "Run it locally". The API and worker **must** share `A3_INTERNAL_TOKEN`.

---

## 3. Health & readiness

- **Liveness** `GET /health` → `{"status":"ok"}` — process is up. Use for restart decisions.
- **Readiness** `GET /health/ready` → `200` with `{"checks":{"database":"ok","queue":"ok"}}`, or
  **503** with the failing component. Use for load-balancer routing. A 503 here means the DB is
  unreachable or `QUEUE_DIR` is not writable — **do not route ingest traffic** (it would black-hole).

---

## 4. The `failed/` queue (dead letters)

A queue file moves to `QUEUE_DIR/failed/` when, after 3 engine attempts, scoring still fails, OR the
file/engine output was unparseable, OR the score callback POST failed. **Files in `failed/` are NOT
retried automatically.**

**Triage:**
```bash
ls -la "$QUEUE_DIR/failed/"
# Find why in the worker log (search by transaction_id):
docker compose logs worker | grep <txn_id>
```
Common causes & fixes:
| Symptom in log | Cause | Action |
|---|---|---|
| `engine exited with code 1` | malformed txn JSON | inspect file; fix upstream producer |
| `engine timed out after Nms` | engine hung / host overloaded | check host load; raise `ENGINE_TIMEOUT_MS` |
| `failed to post score` + 401 | worker token ≠ API token | re-sync `A3_INTERNAL_TOKEN` (§5) |
| `failed to post score` + 503 | API `/internal` has no token configured | set `A3_INTERNAL_TOKEN` on API |
| `failed to post score` + 409 | txn already scored with a different score | expected guard; investigate double-processing |

**Replay after fixing the root cause:**
```bash
# move dead letters back to the live queue (worker will re-pick them up)
mv "$QUEUE_DIR/failed/"*.json "$QUEUE_DIR/"
```

---

## 5. Internal token rotation

The `/internal/*` callback is **fail-closed** — wrong/missing token = 401, unconfigured server = 503.
To rotate without dropping work:
```bash
NEW=$(openssl rand -hex 32)
# 1. Roll the API with the new token.
A3_INTERNAL_TOKEN=$NEW docker compose up -d --no-deps api
# 2. Roll the worker with the SAME token.
A3_INTERNAL_TOKEN=$NEW docker compose up -d --no-deps worker
```
During the brief window where they differ, callbacks 401 and files stay/queue or land in `failed/` —
replay them (§4) once both sides match. Never set an empty token (that 503s every callback).

---

## 6. Common incidents

- **Scores never appear (status stuck `pending`):** worker not running, `ENGINE_BIN` missing/not built,
  or token mismatch. Check worker logs; rebuild engine (`cargo build --release`); verify §5.
- **`POST /transactions` returns 401:** `A3_API_KEY` is set — clients must send `X-API-Key`. Unset it for demo.
- **Integration test "false pass" / port in use:** the test frees the port and refuses a stale server;
  if it aborts with `address already in use`, kill the leftover uvicorn (`lsof -tiTCP:8078 | xargs kill`).
- **DB locked errors under load:** WAL + 5s busy-timeout are enabled; sustained contention means it's
  time for Postgres (see `docs/BROKER_MIGRATION.md`).

---

## 7. Verify a deployment

```bash
make a3-verify                                  # full suite + e2e + deliverable gate
# or, smoke a live stack:
curl -s localhost:8000/health/ready
curl -s -X POST localhost:8000/transactions -H 'Content-Type: application/json' \
  -d '{"transaction_id":"smoke1","user_id":"u","amount":15000,"country":"US","merchant_category":"gambling","timestamp":"2026-06-21T00:00:00Z"}'
sleep 3 && curl -s localhost:8000/transactions/smoke1   # expect score 90 / high / scored
```
