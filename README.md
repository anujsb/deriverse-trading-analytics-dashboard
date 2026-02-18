# Deriverse Trading Analytics Dashboard

Analytics and trade journal for [Deriverse](https://deriverse.io) on Solana. Connect a wallet, sync your trades, and see PnL, win rate, volume, drawdown, fees, and time-of-day stats.

## Run it

```bash
pnpm install
cp .env.example .env
# Fill in DATABASE_URL (required). See .env.example for the rest.
pnpm dev
```

Open http://localhost:3000, connect your Solana wallet, then hit **Sync Trades** to pull in on-chain activity.

## What you need

- **Postgres** – Neon, Supabase, or any Postgres. The app stores synced trades and annotations here.
- **Deriverse program ID** – So we only treat your Deriverse txs as trades. Defaults are in `.env.example`; override with `PROGRAM_ID` or `PROGRAM_IDS` if you use a different deployment.
- **Solana RPC** – For fetching transactions. Default is devnet; set `NEXT_PUBLIC_SOLANA_RPC_URL` for mainnet or a custom RPC.

## What’s in the app

- **Overview** – PnL, win rate, volume, fees, largest win/loss, drawdown, long/short breakdown.
- **Charts** – Cumulative PnL (with drawdown), fees over time, time-of-day and session performance.
- **Trade history** – Filters by date, symbol, and status (open/closed). Notes per trade (annotations).
- **Open vs closed** – Open positions show until you close them on Deriverse; after the next sync, those rows update to closed with real PnL.

Trades are derived from Deriverse **Program data** logs (place order + fill events), with position tracking so closed trades get correct realized PnL and duration.

## Deploy

Set `DATABASE_URL` and, if needed, `PROGRAM_ID` / `PROGRAM_IDS` and `NEXT_PUBLIC_SOLANA_RPC_URL` in your host (e.g. Vercel). Run migrations:

```bash
pnpm drizzle-kit push
```

## Docs

- **[docs/INTEGRATION.md](docs/INTEGRATION.md)** – Program ID, env vars, API reference (for integrators/sponsors).
- **[docs/DEVELOPER.md](docs/DEVELOPER.md)** – Data flow, where things live in the codebase, adding metrics/filters.
- **[docs/DERIVERSE_INSTRUCTION_LAYOUT.md](docs/DERIVERSE_INSTRUCTION_LAYOUT.md)** – Where instruction/log layout comes from (SDK, logs_models).

## Stack

Next.js 16, React, Drizzle (Postgres), Solana web3.js, Recharts, Tailwind.
