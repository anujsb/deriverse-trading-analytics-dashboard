import { Connection, PublicKey } from '@solana/web3.js';
import { db } from '@/lib/db';
import { trades, users } from '@/lib/db/schema';
import { fetchUserTrades } from '@/lib/solana/fetch-transactions';
import { eq, desc } from 'drizzle-orm';

export class TradeSyncService {
  private connection: Connection;

  constructor(rpcEndpoint: string) {
    this.connection = new Connection(rpcEndpoint, 'confirmed');
  }


  //  Sync trades for a specific user
  async syncUserTrades(walletAddress: string): Promise<{
    success: boolean;
    newTrades: number;
    error?: string;
  }> {
    try {
      console.log(`Starting sync for wallet: ${walletAddress}`);


      await this.ensureUserExists(walletAddress);


      const lastTrade = await db
        .select()
        .from(trades)
        .where(eq(trades.userId, walletAddress))
        .orderBy(desc(trades.timestamp))
        .limit(1);

      const lastSyncTimestamp = lastTrade[0]?.timestamp || new Date(0);


      const blockchainTrades = await fetchUserTrades(walletAddress, this.connection);


      const newTrades = blockchainTrades.filter(
        trade => new Date(trade.timestamp) > lastSyncTimestamp
      );

      console.log(`Found ${newTrades.length} new trades`);


      if (newTrades.length > 0) {
        await db.insert(trades).values(
          newTrades.map(trade => ({
            signature: trade.signature,
            userId: walletAddress,
            timestamp: new Date(trade.timestamp),
            type: trade.type,
            symbol: trade.symbol,
            status: trade.status,
            entryPrice: trade.entryPrice.toString(),
            exitPrice: trade.exitPrice?.toString() || null,
            size: trade.size.toString(),
            fee: trade.fee.toString(),
            pnl: trade.pnl?.toString() || null,
          }))
        ).onConflictDoNothing({ target: trades.signature });
      }

      // 6. Update last synced timestamp
      await db
        .update(users)
        .set({ lastSyncedAt: new Date() })
        .where(eq(users.id, walletAddress));

      return {
        success: true,
        newTrades: newTrades.length,
      };
    } catch (error) {
      console.error('Sync error:', error);
      return {
        success: false,
        newTrades: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
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