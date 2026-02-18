# Where the Deriverse layout comes from

We need a byte layout for two things:

1. **“Is this a Deriverse tx?”** – We look at the program ID on the transaction’s instructions. No layout needed.
2. **Decoding trade data** – We use **Program data** logs (`Program data: <base64>` in `meta.logMessages`), not the instruction bytes. The log layout (tag + structs) matches `@deriverse/kit`’s **logs_models.js**.

## Program data logs (what we use)

The SDK’s **logs-decoder** switches on the first byte (log type) and then parses fixed-size structs. We do the same in `src/lib/solana/program-data-logs.ts`:

- **Log types** – e.g. 10 = spot place order, 11 = spot fill, 18 = perp place order, 19 = perp fill, 15/23 = fees.
- **Struct sizes** – e.g. PerpFillOrderReportModel 48 bytes, SpotPlaceOrderReportModel 40 bytes. Offsets for orderId, side, size, price, crncy, etc. come from the SDK’s `logs_models.js`.

You can open the built file on unpkg and compare:

- `https://unpkg.com/@deriverse/kit@1.0.41/dist/logs_models.js`
- `https://unpkg.com/@deriverse/kit@1.0.41/dist/engine/logs-decoder.js`

Our parser doesn’t use the SDK at runtime; we reimplemented the layout so we don’t need instrument/token context. Prices/sizes use fixed decimals (e.g. 1e9 for price, 1e6 for USDC).

## Instruction layout (legacy / reference)

For **instruction** data (the bytes passed to the program when placing an order), the layout is in the SDK’s **instruction_models.js** (e.g. `newPerpOrderData`, `newSpotOrderData`). We only use this in `parse-deriverse-tx.ts` for the legacy path; the main trade pipeline is log-based.

- Perp order: tag 19, then ioc, side, instrId, price, amount, etc. (see `instruction_models.js` or the repo’s parse-deriverse-tx for the offsets we use).
- Spot order: tag 10, similar idea.

Program IDs you might see:

- SDK default: `DRVSpZ2YUYYKgZP8XtLhAGtT1zYSCKzeHfb4DgRnrgqD`
- Sponsor / main: `CDESjex4EDBKLwx9ZPzVbjiHEHatasb5fhSJZMzNfvw2`
- Devnet: `Drvrseg8AQLP8B96DBGmHRjFGviFNYTkHueY9g3k27Gu`
