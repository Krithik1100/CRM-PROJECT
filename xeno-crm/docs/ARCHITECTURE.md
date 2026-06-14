# CoffeeReach — Architecture & Design Decisions

## System Overview

CoffeeReach is a two-service, callback-driven CRM with an AI-native frontend.

```
Frontend (React)
     │
     │ REST
     ▼
CRM Backend ──── Gemini API
     │
     │ POST /send (fire-and-forget)
     ▼
Channel Service
     │
     │ POST /callbacks/communication-event (async, per event)
     ▼
CRM Backend (callback ingestion)
     │
     ▼
PostgreSQL (Neon)
```

## Key Design Decisions

### 1. Two separate services (mandatory, per spec)

The CRM and Channel Service are completely independent Node/Express processes. They share no code, no database, no in-process state. They communicate only over HTTP.

This mirrors how real channel providers work: Twilio, SendGrid, Kaleyra — all operate as external services that your system pushes messages to and receives async callbacks from. The spec requirement wasn't arbitrary; it teaches real-world patterns.

**What this means for the callback handler:**
- Events arrive out-of-order (the network is async)
- Events may arrive more than once (retries)
- The CRM must handle both gracefully

### 2. Idempotent callback processing

Every callback carries a unique `idempotency_key = communicationId:eventType:uuid`.

The CRM's `communication_events` table has a `UNIQUE` constraint on `idempotency_key`. The insert uses `ON CONFLICT (idempotency_key) DO NOTHING`. If the channel service retries a callback (e.g. after a timeout), the second insert is silently discarded.

The handler checks the insert result: if no row was inserted, it returns `{ processed: false, reason: 'duplicate' }` and still responds 200 — because the channel service needs to know the callback was received.

### 3. Safe AI→SQL boundary (filter.translator.ts)

The AI never generates SQL. It generates a structured filter JSON with a whitelisted set of fields and operators.

```json
{
  "operator": "AND",
  "conditions": [
    { "field": "total_spent", "op": "gte", "value": 5000 },
    { "field": "last_order_at", "op": "days_ago_lte", "value": 90 }
  ]
}
```

`filter.translator.ts` validates each field against `ALLOWED_CUSTOMER_FIELDS` and each operator against `ALLOWED_OPS`, then converts to parameterized SQL (`$1`, `$2`, ...). If the AI outputs an unsupported field, a `ValidationError` is thrown before any query executes.

This is a hard security boundary. Even a compromised AI response cannot cause SQL injection.

### 4. Stats materialization

`campaign_stats` is a separate table with integer counters, updated atomically per callback using `UPDATE ... SET total_sent = total_sent + $2`.

Alternative: compute stats on read with `COUNT(*) GROUP BY status`. This is simpler but slow at scale — every analytics query becomes an O(n) scan over communications.

Chosen approach: cheap reads, slightly expensive writes. The analytics dashboard can handle 1000+ concurrent reads. The write cost per callback is one `UPDATE` — negligible.

### 5. Campaign dispatch (fire-and-forget async loop)

When a campaign is launched, the CRM:
1. Fetches all customer IDs in the segment
2. Creates all `communications` rows in DB (batched, 50 at a time)
3. Starts a non-blocking async loop that POSTs each communication to the channel service
4. Returns 200 immediately — the frontend doesn't wait

The async loop adds a 20ms delay between dispatches to avoid overwhelming the channel service in demo mode.

**Scale note:** At production scale (100K+ communications), this loop would be replaced with:
- A job queue (BullMQ backed by Redis, or AWS SQS)
- A separate worker process consuming the queue
- Batch sends to the channel service (if supported)
- Dead-letter queue for failed dispatches

### 6. AI prompt design

The Gemini integration uses the configured `GEMINI_MODEL` (currently `gemini-2.5-flash`) for low-latency campaign and segment assistance. Two prompts:

**Segmentation prompt:** Returns structured JSON with `filterJson`, `segmentName`, `description`, `sqlPreview`. The `sqlPreview` is human-readable (uses natural language for dates) — it's never executed.

**Copilot prompt:** Returns `campaignName`, `segmentName`, `filterJson`, `channel`, `channelReasoning`, `messageTemplate`, `reasoning`. The `reasoning` is displayed to the marketer verbatim — transparency builds trust.

Both prompts explicitly ask for JSON-only output with no markdown fences. The response is cleaned with `.replace(/```json\n?/g, '')` before `JSON.parse()` — Gemini sometimes wraps output in code fences despite instructions.

## ER Diagram

```
customers ──< orders
    │
    └──< communications >── campaigns >── campaign_stats
              │                │
              └──< comm_events └──> segments
```

## Scalability Notes

Current capacity estimate:
- 10,000 customers: works fine
- 50,000 customers: segment queries may need index tuning
- 100,000+ customers: need query optimization + read replica
- 1M+ communications: stats table needs partitioning

Bottlenecks in order:
1. Campaign dispatch loop (fix: job queue)
2. Segment SQL on large tables (fix: materialized segment membership)
3. Callback write throughput (fix: batch updates)
4. Gemini API rate limits (fix: request queuing + caching)
