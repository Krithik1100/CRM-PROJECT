# CoffeeReach — 5-Minute Walkthrough Script

---

## Section 1: Product Intro (0:00–0:30)

**What I built:**
CoffeeReach is an AI-native CRM for cafe and retail shopper engagement. The core bet I made is this: marketers don't think in filters — they think in goals. So the primary interface is a Campaign Copilot where you describe what you want to achieve, and the AI handles audience selection, channel recommendation, and message writing.

**Why this shape:**
I chose a copilot-first design over a pure chat agent because marketers still want to review and approve before sending. The AI does the heavy lifting — but a human is always in the loop before messages go out.

---

## Section 2: Functional Demo (0:30–2:00)

### 2a. Seed Data
- Open dashboard → click "Seed Cafe Data"
- "This resets old data and generates cafe customers with realistic orders across beans, pastries, subscriptions, cold coffee, and gift cards"
- Show customer list: spend, cities, order history

### 2b. AI Segmentation
- Go to Segments → type: "Find customers who spent more than INR 5000 in the last 90 days"
- "The AI parses natural language into a structured filter object — not SQL directly, for security reasons I'll explain in architecture"
- Show: segment name, description, SQL preview, customer count, sample customers
- Save the segment

### 2c. AI Campaign Copilot — end to end
- Click "New Campaign" → type: "Win back customers who haven't ordered in 60 days"
- Watch AI analyze → show reasoning text appearing (typewriter effect)
- Walk through recommendation: audience (lapsed customers), channel (WhatsApp, because high open rate for re-engagement), message template with {{name}} personalization
- Edit the message slightly to show it's editable
- Hit "Preview Campaign" → review → "Launch Campaign"
- "Messages are now being dispatched to the channel service"

### 2d. Live analytics
- Navigate to the campaign detail page
- "Watch the funnel update in real time — the channel service is calling back with delivery events"
- Point out: delivered rate, open rate, click rate, revenue attributed
- "This is the two-service callback loop working — the channel service fires events asynchronously and the CRM ingests them idempotently"

---

## Section 3: Technical Architecture (2:00–3:00)

Draw attention to the architecture diagram:

1. **Two separate services** — CRM on port 3001, Channel Service on port 3002. They communicate via HTTP. The CRM fires messages, the channel service acknowledges immediately (202), then calls back asynchronously.

2. **Callback-driven loop** — Every event (sent, delivered, opened, clicked, purchased) arrives as an individual callback. The CRM uses idempotency keys to deduplicate — `ON CONFLICT DO NOTHING` in Postgres.

3. **Safe AI→SQL boundary** — The AI never writes SQL. It outputs a structured filter JSON, which `filter.translator.ts` converts to parameterized queries. This is a deliberate security boundary.

4. **Stats materialization** — `campaign_stats` is a counter table, incremented atomically per callback. Cheap reads for the dashboard, slightly expensive writes. Right tradeoff for a read-heavy analytics UI.

5. **Scale note** — In production, the campaign dispatch loop would be replaced with a BullMQ or SQS queue. Currently it's fire-and-forget async — good enough for thousands, not for millions.

---

## Section 4: Code Walkthrough (3:00–4:00)

### `filter.translator.ts` — the AI security boundary
Show: AI output → filter JSON → parameterized SQL. "The allowed fields and operators are whitelisted here. If the AI tries to output an unsupported field, it throws a validation error."

### `callback.controller.ts` — idempotent event handler
Show: idempotency key check → status progression guard → stat increment → revenue attribution → completion check. "The status progression check prevents out-of-order events from corrupting state — you can't go from 'purchased' back to 'sent'."

### `delivery.simulator.ts` — channel service
Show: the setTimeout chain, per-channel probability tables, exponential retry backoff. "Each communication runs independently. WhatsApp has a higher open rate than email — these numbers are based on real industry benchmarks."

### `CampaignCopilot.tsx` — the AI-native frontend
Show: the step flow, the typewriter hook, structured AI response parsing. "The AI response is JSON, not markdown — I prompt Gemini to return only structured output and parse it server-side."

---

## Section 5: AI-Native Workflow (4:00–5:00)

How I actually built this:

1. **Architecture first with Claude** — I used Claude to pressure-test the two-service design before writing a line of code. It caught the idempotency gap in callback handling early.

2. **Iterative code generation** — I generated module scaffolding (routes, controllers, repositories) in one pass, then refined the filter translator and AI prompts manually. The prompts were the most iterative part — I went through 4 versions before the Gemini output was reliably structured JSON.

3. **Review everything** — Every generated function I read line by line. The biggest AI mistake was hallucinating a Postgres function syntax for the idempotency key — caught it in review.

4. **The AI is also in the product** — The copilot isn't a demo feature. It's the primary way to create campaigns. I ate my own cooking.

**Key lesson:** AI development is fastest when you give the AI very clear boundaries — schema, types, interface contracts — and let it implement within them. The filter translator is a perfect example: I defined the input/output contract, the AI filled in the implementation.

---

*Total time: ~5 minutes*
