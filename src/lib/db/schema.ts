import { pgTable, text, timestamp, numeric, varchar, boolean, index } from 'drizzle-orm/pg-core';

// Users table - store connected wallet addresses
export const users = pgTable('users', {
  id: text('id').primaryKey(), // Wallet address
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastSyncedAt: timestamp('last_synced_at'),
});

// Trades table - cached trade data
export const trades = pgTable('trades', {
  signature: text('signature').primaryKey(), // Transaction signature (unique ID)
  userId: text('user_id').notNull().references(() => users.id),
  timestamp: timestamp('timestamp').notNull(),
  
  // Trade details
  type: varchar('type', { length: 10 }).notNull(), // 'LONG' or 'SHORT'
  symbol: varchar('symbol', { length: 50 }).notNull(), // 'SOL-PERP', 'BTC-PERP'
  status: varchar('status', { length: 10 }).notNull(), // 'OPEN' or 'CLOSED'
  
  // Prices and size
  entryPrice: numeric('entry_price', { precision: 20, scale: 8 }).notNull(),
  exitPrice: numeric('exit_price', { precision: 20, scale: 8 }),
  size: numeric('size', { precision: 20, scale: 8 }).notNull(),
  
  // Financial metrics
  fee: numeric('fee', { precision: 20, scale: 8 }).notNull(),
  pnl: numeric('pnl', { precision: 20, scale: 8 }),
  
  // Metadata
  leverage: numeric('leverage', { precision: 5, scale: 2 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  // Indexes for faster queries
  userIdIdx: index('user_id_idx').on(table.userId),
  timestampIdx: index('timestamp_idx').on(table.timestamp),
  symbolIdx: index('symbol_idx').on(table.symbol),
  statusIdx: index('status_idx').on(table.status),
}));

// Trade annotations - let users add notes to trades
export const tradeAnnotations = pgTable('trade_annotations', {
  id: text('id').primaryKey(),
  tradeSignature: text('trade_signature').notNull().references(() => trades.signature),
  userId: text('user_id').notNull().references(() => users.id),
  note: text('note').notNull(),
  tags: text('tags').array(), // e.g., ['mistake', 'good-setup']
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Performance snapshots - daily aggregated metrics
export const performanceSnapshots = pgTable('performance_snapshots', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  date: timestamp('date').notNull(),
  
  // Daily metrics
  totalPnl: numeric('total_pnl', { precision: 20, scale: 8 }).notNull(),
  totalVolume: numeric('total_volume', { precision: 20, scale: 8 }).notNull(),
  totalFees: numeric('total_fees', { precision: 20, scale: 8 }).notNull(),
  tradeCount: numeric('trade_count').notNull(),
  winCount: numeric('win_count').notNull(),
  lossCount: numeric('loss_count').notNull(),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userDateIdx: index('user_date_idx').on(table.userId, table.date),
}));