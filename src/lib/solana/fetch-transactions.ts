import { Connection, PublicKey } from '@solana/web3.js';
import { isDeriverseTransaction } from './parse-deriverse-tx';
import { deriveTradesFromTransactions } from './derive-trades-from-logs';

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
  /** When position was opened (for closed trades) - used for avg duration */
  entryTimestamp?: number;
}

/**
 * Fetches Deriverse transactions and derives closed trades with true PnL
 * from Program data logs (fills + position tracking).
 */
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

    const deriverseTxs: { tx: unknown; signature: string; blockTime?: number | null; meta?: { fee?: number; logMessages?: string[] } | null }[] = [];

    for (let i = 0; i < transactionResponses.length; i++) {
      const tx = transactionResponses[i];
      const signature = signatures[i].signature;
      if (!tx) {
        console.warn('No transaction data for', signature);
        continue;
      }
      const txLike = tx as Parameters<typeof isDeriverseTransaction>[0];
      if (!isDeriverseTransaction(txLike)) continue;

      deriverseTxs.push({
        tx,
        signature,
        blockTime: tx.blockTime,
        meta: tx.meta ? { fee: tx.meta.fee, logMessages: tx.meta.logMessages ?? undefined } : null,
      });
    }

    console.log(`Deriving trades from ${deriverseTxs.length} Deriverse transactions`);

    const trades = deriveTradesFromTransactions(deriverseTxs);

    return trades.sort((a, b) => a.timestamp - b.timestamp);
  } catch (error) {
    console.error('Error fetching trades:', error);
    return [];
  }
}