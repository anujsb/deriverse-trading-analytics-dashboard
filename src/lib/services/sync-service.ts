//  Syncs a wallet's Deriverse trades: fetch → derive OPEN/CLOSED → reconcile with DB.
//  Matches derived CLOSED to existing OPEN (FIFO by symbol+type) so open rows
//  turn into closed when the user syncs again after closing on Deriverse.
import { Connection } from '@solana/web3.js';
import { db } from '@/lib/db';
import { trades, users } from '@/lib/db/schema';
import { fetchUserTrades } from '@/lib/solana/fetch-transactions';
import type { TradeTransaction } from '@/lib/solana/fetch-transactions';
import { eq, and, asc } from 'drizzle-orm';

export class TradeSyncService {
  private connection: Connection;

  constructor(rpcEndpoint: string) {
    this.connection = new Connection(rpcEndpoint, 'confirmed');
  }

  async syncUserTrades(walletAddress: string): Promise<{
    success: boolean;
    newTrades: number;
    error?: string;
  }> {
    try {
      await this.ensureUserExists(walletAddress);

      const blockchainTrades = await fetchUserTrades(walletAddress, this.connection);
      const derivedOpen = blockchainTrades.filter((t) => t.status === 'OPEN');
      const derivedClosed = [...blockchainTrades.filter((t) => t.status === 'CLOSED')].sort(
        (a, b) => a.timestamp - b.timestamp
      );

      const existingOpen = await db
        .select()
        .from(trades)
        .where(and(eq(trades.userId, walletAddress), eq(trades.status, 'OPEN')))
        .orderBy(asc(trades.timestamp));

      const openByKey = new Map<string, typeof existingOpen>();
      for (const row of existingOpen) {
        const key = `${row.symbol}:${row.type}`;
        if (!openByKey.has(key)) openByKey.set(key, []);
        openByKey.get(key)!.push(row);
      }

      let newOrUpdated = 0;

      for (const closed of derivedClosed) {
        const key = `${closed.symbol}:${closed.type}`;
        const queue = openByKey.get(key);
        if (!queue || queue.length === 0) {
          await this.upsertTrade(walletAddress, closed);
          newOrUpdated++;
          continue;
        }
        const openRow = queue[0];
        const openSize = parseFloat(openRow.size);
        const closedSize = closed.size;
        if (openSize >= closedSize) {
          if (Math.abs(openSize - closedSize) < 1e-9) {
            await db
              .update(trades)
              .set({
                status: 'CLOSED',
                exitPrice: closed.exitPrice?.toString() ?? null,
                pnl: closed.pnl?.toString() ?? null,
                entryTimestamp: closed.entryTimestamp ? new Date(closed.entryTimestamp) : openRow.entryTimestamp,
                timestamp: new Date(closed.timestamp),
              })
              .where(eq(trades.signature, openRow.signature));
            try {
              await db.delete(trades).where(and(eq(trades.userId, walletAddress), eq(trades.signature, closed.signature)));
            } catch {
              // ignore if row has annotations or missing
            }
            queue.shift();
            if (queue.length === 0) openByKey.delete(key);
            newOrUpdated++;
          } else {
            await db
              .update(trades)
              .set({ size: (openSize - closedSize).toFixed(8) })
              .where(eq(trades.signature, openRow.signature));
            await this.upsertTrade(walletAddress, {
              ...closed,
              entryTimestamp: openRow.entryTimestamp ? new Date(openRow.entryTimestamp).getTime() : undefined,
            });
            newOrUpdated++;
          }
        } else {
          const portionPnl = closed.pnl != null ? (closed.pnl * openSize) / closedSize : undefined;
          await db
            .update(trades)
            .set({
              status: 'CLOSED',
              exitPrice: closed.exitPrice?.toString() ?? null,
              pnl: portionPnl?.toString() ?? null,
              entryTimestamp: closed.entryTimestamp ? new Date(closed.entryTimestamp) : openRow.entryTimestamp,
              timestamp: new Date(closed.timestamp),
              size: openRow.size,
            })
            .where(eq(trades.signature, openRow.signature));
          queue.shift();
          if (queue.length === 0) openByKey.delete(key);
          const remainderSize = closedSize - openSize;
          if (remainderSize > 1e-9) {
            await this.upsertTrade(walletAddress, {
              ...closed,
              size: remainderSize,
              pnl: closed.pnl != null ? (closed.pnl * remainderSize) / closedSize : undefined,
            });
            newOrUpdated++;
          }
          newOrUpdated++;
        }
      }

      for (const trade of derivedOpen) {
        await this.upsertTrade(walletAddress, trade);
        newOrUpdated++;
      }

      await db
        .update(users)
        .set({ lastSyncedAt: new Date() })
        .where(eq(users.id, walletAddress));

      return { success: true, newTrades: newOrUpdated };
    } catch (error) {
      console.error('Sync error:', error);
      return {
        success: false,
        newTrades: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async upsertTrade(
    walletAddress: string,
    trade: TradeTransaction & { entryTimestamp?: number | Date }
  ): Promise<void> {
    const et = trade.entryTimestamp;
    const entryTs =
      typeof et === 'number'
        ? new Date(et)
        : et !== undefined && et !== null && typeof et === 'object'
          ? (et as Date)
          : null;
    const row = {
      signature: trade.signature,
      userId: walletAddress,
      timestamp: new Date(trade.timestamp),
      type: trade.type,
      symbol: trade.symbol,
      status: trade.status,
      entryPrice: trade.entryPrice.toString(),
      exitPrice: trade.exitPrice?.toString() ?? null,
      entryTimestamp: entryTs,
      size: trade.size.toString(),
      fee: trade.fee.toString(),
      pnl: trade.pnl?.toString() ?? null,
    };
    await db
      .insert(trades)
      .values(row)
      .onConflictDoUpdate({
        target: trades.signature,
        set: {
          status: row.status,
          exitPrice: row.exitPrice,
          pnl: row.pnl,
          entryTimestamp: row.entryTimestamp,
          timestamp: row.timestamp,
          size: row.size,
        },
      });
  }


  private async ensureUserExists(walletAddress: string) {
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, walletAddress))
      .limit(1);

    if (existingUser.length === 0) {
      await db.insert(users).values({
        id: walletAddress,
      });
    }
  }
}