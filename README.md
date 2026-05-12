# allo-inventory

Live: https://allo-inventory-coral.vercel.app

---

## What this is

An inventory reservation system built with Next.js. The core problem: when a customer hits checkout, payment can take a few minutes (UPI, 3DS, etc). During that time, the same stock shouldn't be sold to someone else. So instead of decrementing stock at payment time, we hold it with a reservation and release it if payment doesn't go through.

---

## Stack

- Next.js 16 (App Router) + TypeScript
- Prisma with Supabase (Postgres)
- Upstash Redis — for the distributed lock
- Zod — request validation
- Tailwind CSS
- Vercel — hosting + cron

---

## Running locally

Clone the repo and install:

```bash
git clone https://github.com/Mekalasivaram/allo-inventory.git
cd allo-inventory
npm install
```

Create `.env.local`:

```env
DATABASE_URL="your-supabase-pooler-url?pgbouncer=true"
DIRECT_URL="your-supabase-direct-url"
UPSTASH_REDIS_REST_URL="your-upstash-url"
UPSTASH_REDIS_REST_TOKEN="your-upstash-token"
```

Run migrations and seed:

```bash
npx prisma migrate deploy
npx prisma db seed
```

Start dev server:

```bash
npm run dev
```

---

## API

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/products` | returns products with available stock per warehouse |
| GET | `/api/warehouses` | list warehouses |
| POST | `/api/reservations` | create reservation, 409 if not enough stock |
| GET | `/api/reservations/:id` | get reservation by id |
| POST | `/api/reservations/:id/confirm` | confirm it, 410 if expired |
| POST | `/api/reservations/:id/release` | release early |
| GET | `/api/cron/expire-reservations` | called by Vercel cron to clean up expired ones |

---

## How the concurrency works

The reserve endpoint does two things to stay correct under concurrent requests:

First, it grabs a Redis lock (`SET NX EX`) on the product+warehouse key. If another request already has the lock, this one returns 409 immediately. The lock has a 10s TTL and is always released in a `finally` block.

Second, the stock check and reservation creation happen inside a single Prisma `$transaction`. So even if the lock somehow lets two requests through, the database write is atomic.

I used Redis instead of `SELECT FOR UPDATE` because serverless functions don't share database connections, so a DB-level lock wouldn't work reliably across invocations.

One note on the transaction style — I used the array form of `$transaction` rather than interactive transactions, because Supabase uses PgBouncer in transaction mode which doesn't support interactive transactions.

---

## Expiry

Reservations expire after 10 minutes.

There are two ways expiry gets handled:

**Cron job** — `vercel.json` registers `/api/cron/expire-reservations` as a scheduled job. It queries for pending reservations past their `expiresAt`, releases the stock, and marks them released. On Vercel Hobby the minimum frequency is daily, so in a real setup I'd either upgrade to Pro (runs every minute) or use a separate worker.

**Lazy check on confirm** — the confirm endpoint also checks `expiresAt` before doing anything. If it's expired, it releases the stock right there and returns 410. This means the system stays correct even between cron runs — a reservation won't get confirmed after expiry regardless of when the cron last ran.

---

## Trade-offs and things I'd do differently

**Idempotency** — didn't implement it. The approach would be: hash the `Idempotency-Key` header, store it in Redis with the response, and on retry return the cached response without re-running the transaction. Straightforward but ran out of time.

**Stock count in the UI** — the product list doesn't update in real time after someone else makes a reservation. You'd need polling or websockets for that. Right now it's a snapshot at page load.

**Quantity is hardcoded to 1** — the API supports any quantity, the frontend just doesn't expose a selector yet.

**Cron frequency** — daily isn't great for a 10-minute reservation window. In production this would need to run at least every minute. Quick fix with a Pro plan, or offload to a dedicated worker (BullMQ, etc).

**Error handling on the frontend** — it's basic. Works for the happy path and the main error cases (409, 410) but a real app would need proper error boundaries and retry logic.
