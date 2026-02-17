import { Connection, PublicKey } from '@solana/web3.js';
import { isDeriverseTransaction, parseDeriverseTransaction } from './parse-deriverse-tx';

export interface TradeTransaction {
  signature: string;
  timestamp: number;
  type: 'LONG' | 'SHORT';
  symbol: string;
  entryPrice: number;
  exitPrice?: number;
  size: number;
  fee: number;
  pnl?: number;
  status: 'OPEN' | 'CLOSED';
}


function fallbackTradeFromTx(
  signature: string,
  tx: { blockTime?: number | null; meta?: { fee?: number } | null },
  symbolOverride?: string
): TradeTransaction {
  const timestamp = tx.blockTime != null ? tx.blockTime * 1000 : Date.now();
  const feeLamports = tx.meta?.fee ?? 0;
  const feeInSol = feeLamports / 1_000_000_000;

  return {
    signature,
    timestamp,
    type: 'LONG',
    symbol: symbolOverride ?? 'Unknown',
    entryPrice: 0,
    size: 0,
    fee: feeInSol,
    status: 'CLOSED',
  };
}

export async function fetchUserTrades(
  walletAddress: string,
  connection: Connection
): Promise<TradeTransaction[]> {
  try {
    const publicKey = new PublicKey(walletAddress);

    const signatures = await connection.getSignaturesForAddress(publicKey, {
      limit: 1000,
    });

    console.log(`Found ${signatures.length} transactions`);

    const transactionResponses = await Promise.all(
      signatures.map((sig) =>
        connection.getTransaction(sig.signature, {
          maxSupportedTransactionVersion: 0,
        })
      )
    );

    const trades: TradeTransaction[] = [];

    for (let i = 0; i < transactionResponses.length; i++) {
      const tx = transactionResponses[i];
      const signature = signatures[i].signature;
      if (!tx) continue;

      const txLike = tx as Parameters<typeof parseDeriverseTransaction>[0];

      if (!isDeriverseTransaction(txLike)) continue;

      const parsed = parseDeriverseTransaction(txLike, signature);
      if (parsed) {
        trades.push(parsed);
      } else {

        trades.push(fallbackTradeFromTx(signature, tx, 'DERIVERSE-UNPARSED'));
      }
    }

    return trades;
  } catch (error) {
    console.error('Error fetching trades:', error);
    return [];
  }
}