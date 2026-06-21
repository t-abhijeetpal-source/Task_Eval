# A3 — File Queue → Message Broker Migration (deferred)

The file queue (`QUEUE_DIR/<id>.json` + `processed/` + `failed/`) is deliberately
infra-free for the demo. This is the migration sketch for when the system needs
multi-consumer scale, at-least-once delivery, or HA. **Status: deferred** (not in
the current deliverable; tracked as AUDIT-A3-027/028).

## Why migrate
- **Single consumer.** One worker drains the directory; you can't horizontally scale workers without
  them racing on the same files (no atomic claim).
- **No delivery guarantee.** A crash between "read file" and "move to processed/" can re-process or, in
  the worst ordering, lose work. A broker gives ack/nack + redelivery.
- **No backpressure / fairness / priority.** A directory listing is FIFO-ish at best.

## Seam to target
All queue I/O is already isolated:
- **Producer:** `fastapi-service/app/queue.py` `enqueue(txn)` — one function writes one message.
- **Consumer:** `node-worker/src/worker.js` `processQueueOnce()` / `processFile()` — list, read, ack (move).

Swap these two seams; the contract (`CONTRACT.md`) and the Rust engine are unchanged.

## Option comparison
| Broker | Delivery | Ordering | Ops cost | Best when |
|---|---|---|---|---|
| **Redis Streams** | at-least-once (consumer groups + `XACK`) | per-stream | low | single region, moderate scale, already using Redis |
| **AWS SQS** | at-least-once (visibility timeout + DLQ) | none (standard) / FIFO queues | managed | AWS-native, want a managed DLQ |
| **Kafka** | at-least-once (offsets) | per-partition | high | high throughput, replay, multiple consumer groups |

Recommended first step: **Redis Streams** — lowest lift, gives consumer groups (scale workers) and a
native dead-letter pattern that maps cleanly onto today's `failed/`.

## Migration steps
1. **Producer:** replace `enqueue()`'s file write with `XADD a3:txns * payload <json>`.
2. **Consumer:** replace the directory scan with `XREADGROUP GROUP workers <id> COUNT n BLOCK 5000`;
   on success `XACK`; on terminal failure `XADD a3:txns:dead` (the `failed/` equivalent).
3. **Idempotency:** the API callback is already idempotent (A5-14) — at-least-once redelivery is safe.
4. **Readiness:** extend `GET /health/ready` to ping the broker alongside DB + queue.
5. **Ops:** update RUNBOOK §4 (dead letters) to the broker's DLQ commands.

## What does NOT change
The data contract, the scoring engine (Rust, single source of truth), the fail-closed internal auth,
and the score-integrity guards. Migration is purely the transport between API and worker.
