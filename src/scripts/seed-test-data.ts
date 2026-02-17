import 'dotenv/config';
import { db } from '@/lib/db';
import { users, trades } from '@/lib/db/schema';

async function seedTestData() {
  const testWallet = 'TEST_WALLET_ADDRESS_123';
  
  // Create test user
  await db.insert(users).values({
    id: testWallet,
  });

  // Create test trades
  await db.insert(trades).values([
    {
      signature: 'test_sig_1',
      userId: testWallet,
      timestamp: new Date(),
      type: 'LONG',
      symbol: 'SOL-PERP',
      status: 'CLOSED',
      entryPrice: '100.50',
      exitPrice: '105.75',
      size: '1.5',
      fee: '0.05',
      pnl: '7.875',
    },
    {
      signature: 'test_sig_2',
      userId: testWallet,
      timestamp: new Date(Date.now() - 86400000), // Yesterday
      type: 'SHORT',
      symbol: 'BTC-PERP',
      status: 'CLOSED',
      entryPrice: '45000',
      exitPrice: '44500',
      size: '0.1',
      fee: '0.10',
      pnl: '49.90',
    },
  ]);

  console.log('✅ Test data seeded!');
}

seedTestData().catch(console.error);