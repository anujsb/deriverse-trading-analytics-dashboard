import { NextRequest, NextResponse } from 'next/server';
import { TradeSyncService } from '@/lib/services/sync-service';

export async function POST(request: NextRequest) {
  try {
    const { walletAddress } = await request.json();

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address required' },
        { status: 400 }
      );
    }

    // RPC endpoint
    // const rpcEndpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
    const rpcEndpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com';
    
    const syncService = new TradeSyncService(rpcEndpoint);
    const result = await syncService.syncUserTrades(walletAddress);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: `Successfully synced ${result.newTrades} new trades`,
      newTrades: result.newTrades,
    });
  } catch (error) {
    console.error('Sync API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}