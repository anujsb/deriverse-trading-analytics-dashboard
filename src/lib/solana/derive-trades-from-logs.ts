

import { TradeTransaction } from './fetch-transactions';
import { parseProgramDataLogs } from './program-data-logs';

interface Position {
  symbol: string;
  side: number; 
  size: number;
  totalCost: number; 
  openedAt: number; 
}

interface ProcessedTx {
  tx: unknown;
  signature: string;
  blockTime?: number | null;
  meta?: { fee?: number; logMessages?: string[] } | null;
}

function toSymbol(type: 'spot' | 'perp', instrId: number): string {
  return type === 'perp' ? `PERP-${instrId}` : `SPOT-${instrId}`;
}


export function deriveTradesFromTransactions(
  txs: ProcessedTx[]
): TradeTransaction[] {
  const trades: TradeTransaction[] = [];
  const orderIdToSymbol = new Map<string, { symbol: string; type: 'spot' | 'perp' }>();
  const positions = new Map<string, Position>();


  const sorted = [...txs].sort((a, b) => {
    const ta = a.blockTime ?? 0;
    const tb = b.blockTime ?? 0;
    return ta - tb;
  });

  for (const { tx, signature, blockTime, meta } of sorted) {
    const timestamp = (blockTime ?? 0) * 1000 || Date.now();
    const txFee = (meta?.fee ?? 0) / 1_000_000_000;
    const logs = meta?.logMessages ?? [];

    const { placeOrders, fills, fees } = parseProgramDataLogs(logs);


    for (const po of placeOrders) {
      const symbol = toSymbol(po.type, po.instrId);
      orderIdToSymbol.set(po.orderId.toString(), { symbol, type: po.type });
    }


    let txFeesTotal = fees.reduce((s, f) => s + f.fees, 0);
    if (txFeesTotal <= 0) txFeesTotal = txFee; 


    const feePerFill = fills.length > 0 ? txFeesTotal / fills.length : 0;

    for (let fillIdx = 0; fillIdx < fills.length; fillIdx++) {
      const fill = fills[fillIdx];
      const orderKey = fill.orderId.toString();
      const orderInfo = orderIdToSymbol.get(orderKey);
      const symbol = orderInfo?.symbol ?? (fill.type === 'perp' ? `PERP-UNK` : `SPOT-UNK`);

      const posKey = `${symbol}-${fill.side === 0 ? 1 : 0}`; 
      const pos = positions.get(posKey);
      const fillFee = feePerFill;

      if (pos && pos.size > 0) {

        const closeAmount = Math.min(fill.size, pos.size);
        const avgEntry = pos.totalCost / pos.size;
        let pnl: number;

        if (pos.side === 0) {

          pnl = (fill.price - avgEntry) * closeAmount - fillFee + fill.rebates;
        } else {

          pnl = (avgEntry - fill.price) * closeAmount - fillFee + fill.rebates;
        }

        trades.push({
          signature: fills.length > 1 ? `${signature}#${fillIdx}` : signature,
          timestamp,
          type: pos.side === 0 ? 'LONG' : 'SHORT',
          symbol,
          entryPrice: avgEntry,
          exitPrice: fill.price,
          size: closeAmount,
          fee: fillFee,
          pnl,
          status: 'CLOSED',
          entryTimestamp: pos.openedAt,
        });


        const ratio = closeAmount / pos.size;
        pos.size -= closeAmount;
        pos.totalCost -= pos.totalCost * ratio;
        if (pos.size <= 0) {
          positions.delete(posKey);
        } else {
          positions.set(posKey, pos);
        }


        const openAmount = fill.size - closeAmount;
        if (openAmount > 0) {
          const openKey = `${symbol}-${fill.side}`;
          const existing = positions.get(openKey);
          if (existing) {
            existing.size += openAmount;
            existing.totalCost += fill.price * openAmount;
            positions.set(openKey, existing);
          } else {
            positions.set(openKey, {
              symbol,
              side: fill.side,
              size: openAmount,
              totalCost: fill.price * openAmount,
              openedAt: timestamp,
            });
          }
        }
      } else {

        trades.push({
          signature: fills.length > 1 ? `${signature}#${fillIdx}` : signature,
          timestamp,
          type: fill.side === 0 ? 'LONG' : 'SHORT',
          symbol,
          entryPrice: fill.price,
          size: fill.size,
          fee: fillFee,
          status: 'OPEN',
        });

        const openKey = `${symbol}-${fill.side}`;
        const existing = positions.get(openKey);
        if (existing) {
          existing.size += fill.size;
          existing.totalCost += fill.price * fill.size;
          positions.set(openKey, existing);
        } else {
          positions.set(openKey, {
            symbol,
            side: fill.side,
            size: fill.size,
            totalCost: fill.price * fill.size,
            openedAt: timestamp,
          });
        }
      }
    }
  }

  return trades;
}
