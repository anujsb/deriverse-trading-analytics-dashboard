# Integration reference

For integrators and sponsors: env vars, program IDs, and API.

## Program ID and version

| Env var | Example | Purpose |
|--------|---------|---------|
| `PROGRAM_ID` | `CDESjex4EDBKLwx9ZPzVbjiHEHatasb5fhSJZMzNfvw2` | Single Deriverse program ID. Only txs that call this program are treated as Deriverse. |
| `PROGRAM_IDS` | Comma-separated list | Multiple IDs (e.g. mainnet + devnet). Merged with `PROGRAM_ID` and app defaults. |
| `VERSION` | `6` | Protocol version; used in config and for any version-specific decoding later. |

Config is read in `src/lib/deriverse-config.ts`. Default program IDs are set there; override with `.env` if you need different deployments.

## Environment variables (full list)

See `.env.example` in the repo root. Summary:

- **`DATABASE_URL`** (required) – Postgres connection string.
- **`PROGRAM_ID`** or **`PROGRAM_IDS`** – Deriverse program ID(s). Optional if you’re fine with the built-in defaults.
- **`VERSION`** – Optional; default `6`.
- **`NEXT_PUBLIC_SOLANA_RPC_URL`** – Solana RPC; default devnet.

## API

Base URL: your deployed app or `http://localhost:3000`.

| Endpoint | Method | Description |
|----------|--------|--------------|
| `/api/sync` | POST | Sync a wallet’s Deriverse trades. Body: `{ "walletAddress": "<pubkey>" }`. |
| `/api/trades` | GET | List trades. Params: `userId` (required), `startDate`, `endDate`, `symbol`, `status` (`OPEN` \| `CLOSED`), `limit`, `offset`. |
| `/api/analytics/metrics` | GET | Aggregated metrics. Params: `userId`, optional `startDate`, `endDate`, `symbol`. |
| `/api/analytics/timeseries` | GET | Time series for charts. Params: `userId`, optional `startDate`, `endDate`. |
| `/api/trades/[signature]/annotation` | GET | Get note for a trade. Query: `userId`. |
| `/api/trades/[signature]/annotation` | POST | Save note. Body: `{ userId, note, tags? }`. |

All trade/analytics endpoints are keyed by `userId` (wallet public key).

## RPC

Set `NEXT_PUBLIC_SOLANA_RPC_URL` in `.env` to your Solana RPC (e.g. mainnet or a paid devnet RPC). The app uses it to fetch transactions and needs `meta.logMessages` for trade derivation.
