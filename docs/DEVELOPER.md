# Developer guide

How this app is built and how data moves from chain to the UI.

## Data flow (high level)

1. **Sync** – User clicks Sync; we call the Solana RPC for their wallet’s recent transactions, keep only the ones that invoke the Deriverse program.
2. **Parse** – For each Deriverse tx we read `meta.logMessages`, look for lines like `Program data: <base64>`, and decode them into place-order / fill / fee events (see `program-data-logs.ts`).
3. **Derive trades** – We replay those events in time order: place orders give us `orderId → symbol`; fills either open a position or close one. When a fill closes a position we emit a **CLOSED** trade with PnL; when it opens we emit **OPEN**.
4. **Sync service** – Persists derived trades. For each derived **CLOSED** we try to match an existing **OPEN** row (same user, symbol, side, FIFO) and either update that row to CLOSED or split (partial close). The rest we upsert. So “open” trades in the DB get updated to closed when you sync again after closing on Deriverse.
5. **API + UI** – Trades and metrics are read from Postgres; filters (date, symbol, status) are applied in the API.

## Where things live

- **`src/lib/deriverse-config.ts`** – Program IDs and version from env. Used to decide if a tx is Deriverse and for any future versioned decoding.
- **`src/lib/solana/`**
  - **`fetch-transactions.ts`** – Fetches signatures for the wallet, loads full tx with `getTransaction`, keeps only Deriverse txs, passes them to `deriveTradesFromTransactions`. Batches `getTransaction` to avoid rate limits.
  - **`program-data-logs.ts`** – Parses `Program data: <base64>` lines into place orders, fills, and fees. Layout matches `@deriverse/kit` logs_models (LogType + model lengths/offsets).
  - **`derive-trades-from-logs.ts`** – Takes parsed txs (with logs), sorts by block time, runs place orders + fills through a small state machine: `orderId → symbol`, positions per symbol/side. Emits OPEN when a fill opens, CLOSED when it closes (with PnL and entry timestamp).
  - **`parse-deriverse-tx.ts`** – Legacy instruction decoder (tag 10/19) and “is this a Deriverse tx?” check. Still used for `isDeriverseTransaction`; the main trade source is log derivation now.
- **`src/lib/services/sync-service.ts`** – Orchestrates fetch → derive → reconcile OPEN/CLOSED with DB (FIFO match, partials, upserts).
- **`src/lib/analytics/metrics.ts`** – Reads trades from DB, computes PnL, win rate, volume, drawdown, time-of-day buckets, symbol stats, etc. Uses all trades for volume; closed trades with PnL for win rate and drawdown.
- **`src/lib/db/schema.ts`** – Drizzle schema: `users`, `trades`, `trade_annotations`, `performance_snapshots`. Trades have `signature` (PK), `entryTimestamp` for avg duration.

## Adding a new metric

1. Extend the query in `AnalyticsEngine.calculateMetrics()` (and any helpers it uses).
2. Add the field to the `TradeMetrics` interface and to the returned object.
3. Expose it in the metrics API route and in the dashboard component that shows the cards/charts.

## Adding a new filter

1. Add the param to the trades (or metrics) API route and to the DB query.
2. Add it to `FilterState` in `components/dashboard/filters.tsx` and to the filter UI.
3. Pass it through from the dashboard pages when calling the API.

## Instruction / log layout

We don’t decode raw instruction bytes for trade derivation anymore; we use **Program data** logs. The layout for those logs (tag byte + struct sizes/offsets) comes from `@deriverse/kit`’s `logs_models.js`. See `docs/DERIVERSE_INSTRUCTION_LAYOUT.md` for where to look (unpkg, instruction_models for legacy, logs_models for Program data).

## DB migrations

We use Drizzle. After changing `src/lib/db/schema.ts`:

```bash
pnpm drizzle-kit generate
pnpm drizzle-kit push   # or your migration runner
```

`.env` (or `.env.local`) must have `DATABASE_URL` set for generate/push.
