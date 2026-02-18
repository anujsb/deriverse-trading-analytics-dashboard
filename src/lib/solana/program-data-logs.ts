//  Parses Deriverse "Program data: <base64>" lines from tx meta.logMessages.
//  Layout matches @deriverse/kit logs_models (LogType + struct sizes/offsets).
//  Produces place orders, fills, and fees for derive-trades-from-logs.

const DEC = 1_000_000_000;
const USDC_DECIMALS = 1_000_000;

// LogType enum from @deriverse/kit
const LogType = {
  spotPlaceOrder: 10,
  spotFillOrder: 11,
  perpPlaceOrder: 18,
  perpFillOrder: 19,
  spotFees: 15,
  perpFees: 23,
} as const;


const PERP_PLACE_LEN = 48;
const SPOT_PLACE_LEN = 40;
const PERP_FILL_LEN = 48;
const SPOT_FILL_LEN = 48;
const FEES_LEN = 24;

export interface PlaceOrderEvent {
  type: 'spot' | 'perp';
  instrId: number;
  orderId: bigint;
  side: number; 
  size: number; 
  price: number;
  clientId: number;
  time?: number;
}

export interface FillOrderEvent {
  type: 'spot' | 'perp';
  orderId: bigint;
  side: number;
  size: number; 
  crncy: number; 
  price: number;
  rebates: number;
  clientId: number;
}

export interface FeesEvent {
  type: 'spot' | 'perp';
  fees: number; 
  refPayment: number;
  refClientId: number;
}

export interface ParsedProgramLogs {
  placeOrders: PlaceOrderEvent[];
  fills: FillOrderEvent[];
  fees: FeesEvent[];
}

function readU8(buf: Buffer, offset: number): number {
  return buf.readUInt8(offset);
}
function readU32(buf: Buffer, offset: number): number {
  return buf.readUInt32LE(offset);
}
function readI64(buf: Buffer, offset: number): bigint {
  return buf.readBigInt64LE(offset);
}

export function parseProgramDataLogs(logMessages: string[]): ParsedProgramLogs {
  const placeOrders: PlaceOrderEvent[] = [];
  const fills: FillOrderEvent[] = [];
  const fees: FeesEvent[] = [];

  for (const log of logMessages) {
    if (!log.startsWith('Program data: ')) continue;
    const b64 = log.substring(14);
    let buf: Buffer;
    try {
      buf = Buffer.from(b64, 'base64');
    } catch {
      continue;
    }
    if (buf.length < 1) continue;

    const tag = buf[0];

    switch (tag) {
      case LogType.perpPlaceOrder:
        if (buf.length >= PERP_PLACE_LEN) {
          const side = readU8(buf, 2);
          const clientId = readU32(buf, 4);
          const orderId = readI64(buf, 8);
          const perps = Number(readI64(buf, 16)) / DEC;
          const price = Number(readI64(buf, 24)) / DEC;
          const instrId = readU32(buf, 32);
          placeOrders.push({
            type: 'perp',
            instrId,
            orderId,
            side,
            size: perps,
            price,
            clientId,
          });
        }
        break;
      case LogType.spotPlaceOrder:
        if (buf.length >= SPOT_PLACE_LEN) {
          const side = readU8(buf, 2);
          const clientId = readU32(buf, 4);
          const orderId = readI64(buf, 8);
          const qty = Number(readI64(buf, 16)) / DEC;
          const price = Number(readI64(buf, 24)) / DEC;
          const instrId = readU32(buf, 32);
          placeOrders.push({
            type: 'spot',
            instrId,
            orderId,
            side,
            size: qty,
            price,
            clientId,
          });
        }
        break;
      case LogType.perpFillOrder:
        if (buf.length >= PERP_FILL_LEN) {
          const side = readU8(buf, 1);
          const clientId = readU32(buf, 4);
          const orderId = readI64(buf, 8);
          const perps = Number(readI64(buf, 16)) / DEC;
          const crncy = Number(readI64(buf, 24)) / USDC_DECIMALS;
          const price = Number(readI64(buf, 32)) / DEC;
          const rebates = Number(readI64(buf, 40)) / USDC_DECIMALS;
          fills.push({
            type: 'perp',
            orderId,
            side,
            size: perps,
            crncy,
            price,
            rebates,
            clientId,
          });
        }
        break;
      case LogType.spotFillOrder:
        if (buf.length >= SPOT_FILL_LEN) {
          const side = readU8(buf, 1);
          const clientId = readU32(buf, 4);
          const orderId = readI64(buf, 8);
          const qty = Number(readI64(buf, 16)) / DEC;
          const crncy = Number(readI64(buf, 24)) / USDC_DECIMALS;
          const price = Number(readI64(buf, 32)) / DEC;
          const rebates = Number(readI64(buf, 40)) / USDC_DECIMALS;
          fills.push({
            type: 'spot',
            orderId,
            side,
            size: qty,
            crncy,
            price,
            rebates,
            clientId,
          });
        }
        break;
      case LogType.perpFees:
        if (buf.length >= FEES_LEN) {
          const refClientId = readU32(buf, 4);
          const feesRaw = Number(readI64(buf, 8)) / USDC_DECIMALS;
          const refPayment = Number(readI64(buf, 16)) / USDC_DECIMALS;
          fees.push({ type: 'perp', fees: feesRaw, refPayment, refClientId });
        }
        break;
      case LogType.spotFees:
        if (buf.length >= FEES_LEN) {
          const refClientId = readU32(buf, 4);
          const feesRaw = Number(readI64(buf, 8)) / USDC_DECIMALS;
          const refPayment = Number(readI64(buf, 16)) / USDC_DECIMALS;
          fees.push({ type: 'spot', fees: feesRaw, refPayment, refClientId });
        }
        break;
      default:
        break;
    }
  }

  return { placeOrders, fills, fees };
}
