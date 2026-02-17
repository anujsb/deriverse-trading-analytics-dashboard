import { pgTable, text, timestamp, numeric, varchar, boolean, index } from 'drizzle-orm/pg-core';


export const users = pgTable('users', {
  id: text('id').primaryKey(), 
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastSyncedAt: timestamp('last_synced_at'),
});


export const trades = pgTable('trades', {
  signature: text('signature').primaryKey(), 
  userId: text('user_id').notNull().references(() => users.id),
  timestamp: timestamp('timestamp').notNull(),
  

  type: varchar('type', { length: 10 }).notNull(), 
  symbol: varchar('symbol', { length: 50 }).notNull(),
  status: varchar('status', { length: 10 }).notNull(), 
  

  entryPrice: numeric('entry_price', { precision: 20, scale: 8 }).notNull(),
  exitPrice: numeric('exit_price', { precision: 20, scale: 8 }),
  size: numeric('size', { precision: 20, scale: 8 }).notNull(),
  

  fee: numeric('fee', { precision: 20, scale: 8 }).notNull(),
  pnl: numeric('pnl', { precision: 20, scale: 8 }),
  

  leverage: numeric('leverage', { precision: 5, scale: 2 }),
  orderType: varchar('order_type', { length: 20 }), 
  feeType: varchar('fee_type', { length: 20 }), 
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('user_id_idx').on(table.userId),
  timestampIdx: index('timestamp_idx').on(table.timestamp),
  symbolIdx: index('symbol_idx').on(table.symbol),
  statusIdx: index('status_idx').on(table.status),
}));

export const tradeAnnotations = pgTable('trade_annotations', {
  id: text('id').primaryKey(),
  tradeSignature: text('trade_signature').notNull().references(() => trades.signature),
  userId: text('user_id').notNull().references(() => users.id),
  note: text('note').notNull(),
  tags: text('tags').array(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
export const performanceSnapshots = pgTable('performance_snapshots', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  date: timestamp('date').notNull(),
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