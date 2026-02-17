
import bs58 from 'bs58';
import { TradeTransaction } from './fetch-transactions';
import { DERIVERSE_PROGRAM_IDS, DERIVERSE_PROGRAM_ID } from '@/lib/deriverse-config';

export { DERIVERSE_PROGRAM_ID };


export function isDeriverseTransaction(tx: TxLike): boolean {
  try {
    const msg = (tx as { transaction: { message: MessageLike } }).transaction?.message;
    if (!msg) return false;

    const accountKeys = getAccountKeys(tx);
    if (!accountKeys) return false;

    const programIdSet = new Set(DERIVERSE_PROGRAM_IDS);
    const instructions = getInstructions(msg);
    for (const ix of instructions) {
      const programIdIndex = 'programIdIndex' in ix ? ix.programIdIndex : (ix as { programIdIndex?: number }).programIdIndex;
      if (typeof programIdIndex !== 'number') continue;
      const key = accountKeys[programIdIndex];
      if (key && programIdSet.has(key)) return true;
    }
    return false;
  } catch {
    return false;
  }
}

type TxLike = {
  meta?: {
    fee?: number;
    logMessages?: string[];

    loadedAddresses?: { writable?: any[]; readonly?: any[] };

    loadedWritableAddresses?: string[];
    loadedReadonlyAddresses?: string[];
  } | null;
  blockTime?: number | null;
  transaction?: {
    message: MessageLike;
  };
};

type MessageLike = {
  accountKeys?: any[];
  staticAccountKeys?: any[];
  instructions?: { programIdIndex?: number; data?: string | Uint8Array }[];
  compiledInstructions?: { programIdIndex?: number; data?: string | Uint8Array }[];
};

function toBase58Maybe(k: any): string | undefined {
  if (!k) return undefined;
  if (typeof k === 'string') return k;
  if (typeof k?.toBase58 === 'function') return k.toBase58();
  if (typeof k?.toString === 'function') return k.toString();
  return undefined;
}

function getAccountKeys(tx: TxLike): (string | undefined)[] | null {
  const msg = (tx as { transaction: { message: MessageLike } }).transaction?.message;
  if (!msg) return null;
  const staticKeys = (msg.accountKeys || msg.staticAccountKeys || []) as any[];


  const loadedW = (tx.meta as any)?.loadedAddresses?.writable ?? (tx.meta as any)?.loadedWritableAddresses ?? [];
  const loadedR = (tx.meta as any)?.loadedAddresses?.readonly ?? (tx.meta as any)?.loadedReadonlyAddresses ?? [];

  const keys = staticKeys.map(toBase58Maybe);
  const loadedKeys = [...loadedW, ...loadedR].map(toBase58Maybe);
  return [...keys, ...loadedKeys];
}

function getInstructions(msg: MessageLike): { programIdIndex?: number }[] {
  const ix = msg.instructions || msg.compiledInstructions || [];
  return Array.isArray(ix) ? ix : [];
}


export function parseDeriverseTransaction(tx: TxLike, signature: string): TradeTransaction | null {
  try {
    if (!tx.meta || !(tx as { transaction?: unknown }).transaction) return null;
    const timestamp = tx.blockTime != null ? tx.blockTime * 1000 : Date.now();
    const fee = (tx.meta.fee ?? 0) / 1_000_000_000;


    const logParsed = parseFromLogMessages(tx.meta.logMessages || [], signature, timestamp, fee);
    if (logParsed) return logParsed;


    const msg = (tx as { transaction: { message: MessageLike } }).transaction.message;
    const accountKeys = getAccountKeys(tx);
    const instructions = getInstructions(msg);
    if (accountKeys) {
      const programIdSet = new Set(DERIVERSE_PROGRAM_IDS);
      for (const ix of instructions) {
        const programIdIndex = ix.programIdIndex;
        if (typeof programIdIndex !== 'number') continue;
        const key = accountKeys[programIdIndex];
        const keyStr = typeof key === 'string' ? key : (key != null && typeof key === 'object' && 'toBase58' in key ? (key as { toBase58(): string }).toBase58() : key);
        if (!keyStr || !programIdSet.has(keyStr)) continue;
        const data = (ix as { data?: string | Uint8Array }).data;
        if (data) {
          const decoded = decodeInstructionData(data);
          if (decoded) {
            const isPlaceOrder = decoded.instructionType === DERIVERSE_TAG.NEW_PERP_ORDER || decoded.instructionType === DERIVERSE_TAG.NEW_SPOT_ORDER;
            const trade: TradeTransaction = {
              signature,
              timestamp,
              type: decoded.isLong ? 'LONG' : 'SHORT',
              symbol: decoded.market,
              entryPrice: decoded.price,
              size: decoded.size,
              fee,
              status: isPlaceOrder ? 'OPEN' : (decoded.instructionType === 1 ? 'CLOSED' : 'OPEN'),
            };
            if (decoded.instructionType === 1 && decoded.exitPrice != null) {
              trade.exitPrice = decoded.exitPrice;
              trade.pnl = (trade.type === 'LONG' ? trade.exitPrice - trade.entryPrice : trade.entryPrice - trade.exitPrice) * trade.size - fee;
            }
            return trade;
          }
        }
      }
    }

    return null;
  } catch (err) {
    console.error('Error parsing Deriverse transaction:', err);
    return null;
  }
}


function parseFromLogMessages(
  logs: string[],
  signature: string,
  timestamp: number,
  fee: number
): TradeTransaction | null {
  const joined = logs.join('\n');
  // "size:", "price:", "side: long/short", "market", "pnl", "close", "open"
  const sizeMatch = joined.match(/(?:size|quantity|amount)[:\s]+([0-9.]+)/i);
  const priceMatch = joined.match(/(?:price|entry|execution)[:\s]+([0-9.]+)/i);
  const exitPriceMatch = joined.match(/(?:exit|close)\s*price[:\s]+([0-9.]+)/i) || joined.match(/price[:\s]+([0-9.]+).*close/i);
  const sideMatch = joined.match(/(?:side|direction)[:\s]+(long|short)/i) || joined.match(/(long|short)/i);
  const marketMatch = joined.match(/(?:market|symbol|instrument)[:\s]+([A-Z0-9\-/]+)/i) || joined.match(/([A-Z]{2,10}-(?:PERP|USDC?))/i);
  const pnlMatch = joined.match(/(?:pnl|profit|realized)[:\s]+(-?[0-9.]+)/i);
  const isClose = /close|closed|realized|settle/i.test(joined);

  const size = sizeMatch ? parseFloat(sizeMatch[1]) : 0;
  const entryPrice = priceMatch ? parseFloat(priceMatch[1]) : 0;
  const exitPrice = exitPriceMatch ? parseFloat(exitPriceMatch[1]) : undefined;
  const pnl = pnlMatch ? parseFloat(pnlMatch[1]) : undefined;
  const isLong = sideMatch ? sideMatch[1].toLowerCase() === 'long' : true;
  const symbol = marketMatch ? marketMatch[1].trim() : 'UNKNOWN';

  if (size <= 0 && entryPrice <= 0 && !pnl) return null;

  const trade: TradeTransaction = {
    signature,
    timestamp,
    type: isLong ? 'LONG' : 'SHORT',
    symbol,
    entryPrice,
    size: size || 0,
    fee,
    status: isClose ? 'CLOSED' : 'OPEN',
  };
  if (exitPrice != null) trade.exitPrice = exitPrice;
  if (pnl != null) trade.pnl = pnl;
  else if (trade.exitPrice != null && trade.entryPrice != null && trade.size > 0)
    trade.pnl = (isLong ? trade.exitPrice - trade.entryPrice : trade.entryPrice - trade.exitPrice) * trade.size - fee;

  return trade;
}

interface DecodedInstruction {
  instructionType: number;
  market: string;
  isLong: boolean;
  size: number;
  price: number;
  exitPrice?: number;
  orderType?: number;
}


const DERIVERSE_TAG = {
  NEW_PERP_ORDER: 19,
  NEW_SPOT_ORDER: 10,
} as const;

const PRICE_DECIMALS = 1_000_000_000; 


//  * Decode from @deriverse/kit.


function decodeInstructionData(data: string | Uint8Array): DecodedInstruction | null {
  try {
    let buf: Buffer;
    if (typeof data === 'string') {
      if (/^[A-Za-z0-9+/=]+$/.test(data) && data.length % 4 !== 1) buf = Buffer.from(data, 'base64');
      else buf = Buffer.from(bs58.decode(data));
    } else {
      buf = Buffer.from(data);
    }
    if (buf.length < 1) return null;

    const tag = buf[0];


    if (tag === DERIVERSE_TAG.NEW_PERP_ORDER && buf.length >= 40) {
      const orderType = buf[3];
      const side = buf[4]; 
      const instrId = buf.readUInt32LE(12);
      const priceRaw = Number(buf.readBigInt64LE(16));
      const amountRaw = Number(buf.readBigInt64LE(24));
      const price = priceRaw / PRICE_DECIMALS;
      const size = amountRaw / PRICE_DECIMALS; 
      return {
        instructionType: tag,
        market: `PERP-${instrId}`,
        isLong: side === 0,
        size,
        price,
        orderType,
      };
    }


    if (tag === DERIVERSE_TAG.NEW_SPOT_ORDER && buf.length >= 32) {
      const orderType = buf[2];
      const side = buf[3];
      const instrId = buf.readUInt32LE(4);
      const priceRaw = Number(buf.readBigInt64LE(8));
      const amountRaw = Number(buf.readBigInt64LE(16));
      const price = priceRaw / PRICE_DECIMALS;
      const size = amountRaw / PRICE_DECIMALS;
      return {
        instructionType: tag,
        market: `SPOT-${instrId}`,
        isLong: side === 0,
        size,
        price,
        orderType,
      };
    }

    // Fallback
    if (buf.length < 2) return null;
    let offset = 1;
    const readU64 = () => {
      if (offset + 8 > buf.length) return 0;
      const v = buf.readBigUInt64LE(offset);
      offset += 8;
      return Number(v);
    };
    let market = 'UNKNOWN';
    if (offset + 4 <= buf.length) {
      const instrId = buf.readUInt32LE(offset);
      offset += 4;
      market = `INSTR-${instrId}`;
    }
    const isLong = offset < buf.length ? buf[offset++] === 0 : true;
    const price = offset + 8 <= buf.length ? Number(buf.readBigInt64LE(offset)) / PRICE_DECIMALS : 0;
    offset += 8;
    const size = offset + 8 <= buf.length ? Number(buf.readBigInt64LE(offset)) / PRICE_DECIMALS : 0;
    return { instructionType: tag, market, isLong, size, price };
  } catch {
    return null;
  }
}

