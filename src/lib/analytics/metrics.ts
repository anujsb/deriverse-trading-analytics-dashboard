
// Aggregates trades from DB into metrics: PnL, win rate, volume, drawdown,
// time-of-day buckets, symbol stats, fee breakdown. Uses closed trades for
//PnL/win rate; all trades for volume.

import { db } from '@/lib/db';
import { trades } from '@/lib/db/schema';
import { eq, and, gte, lte, sql, desc } from 'drizzle-orm';

export interface TradeMetrics {

  totalPnl: number;
  totalPnlPercentage: number;
  totalVolume: number;
  totalFees: number;
  

  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  

  averageWin: number;
  averageLoss: number;
  averageTradeDuration: number; 
  profitFactor: number; 
  

  largestWin: number;
  largestLoss: number;
  maxDrawdown: number;
  maxDrawdownPercentage: number;
  

  longTrades: number;
  shortTrades: number;
  longWinRate: number;
  shortWinRate: number;
  longPnl: number;
  shortPnl: number;
  

  symbolStats: SymbolStats[];


  timeOfDayStats: TimeOfDayBucket[];
  sessionStats: SessionStats[];


  feeBreakdown: FeeBreakdownItem[];
  orderTypeStats: OrderTypeStat[];
}

export interface SymbolStats {
  symbol: string;
  trades: number;
  pnl: number;
  winRate: number;
  volume: number;
}

export interface TimeOfDayBucket {
  label: string; 
  hourStart: number;
  hourEnd: number;
  trades: number;
  pnl: number;
  winRate: number;
}

export interface SessionStats {
  session: string;
  trades: number;
  pnl: number;
  winRate: number;
}

export interface FeeBreakdownItem {
  label: string; 
  amount: number;
  percentage: number;
}

export interface OrderTypeStat {
  orderType: string; 
  trades: number;
  pnl: number;
  winRate: number;
}

export interface TimeSeriesData {
  date: string;
  cumulativePnl: number;
  dailyPnl: number;
  tradeCount: number;

  drawdown: number;

  cumulativeFees: number;
  dailyFees: number;
}

export class AnalyticsEngine {

  async calculateMetrics(
    userId: string,
    startDate?: Date,
    endDate?: Date,
    symbol?: string
  ): Promise<TradeMetrics> {

    const conditions = [eq(trades.userId, userId)];
    
    if (startDate) {
      conditions.push(gte(trades.timestamp, startDate));
    }
    if (endDate) {
      conditions.push(lte(trades.timestamp, endDate));
    }
    if (symbol) {
      conditions.push(eq(trades.symbol, symbol));
    }


    const userTrades = await db
      .select()
      .from(trades)
      .where(and(...conditions))
      .orderBy(trades.timestamp);


    const closedTrades = userTrades.filter(
      (t) => t.status === "CLOSED" && t.pnl !== null
    );

    const totalTradesCount = userTrades.length;
    const totalFeesAll = userTrades.reduce(
      (sum, t) => sum + parseFloat(t.fee || "0"),
      0
    );
    const totalVolumeAll = userTrades.reduce(
      (sum, t) =>
        sum +
        parseFloat(t.size || "0") * parseFloat(t.entryPrice || "0"),
      0
    );
    const longAll = userTrades.filter((t) => t.type === "LONG").length;
    const shortAll = userTrades.filter((t) => t.type === "SHORT").length;

    if (closedTrades.length === 0) {
      return {
        ...this.getEmptyMetrics(),
        totalTrades: totalTradesCount,
        totalFees: totalFeesAll,
        totalVolume: totalVolumeAll,
        longTrades: longAll,
        shortTrades: shortAll,
        symbolStats: await this.calculateSymbolStats(userTrades),
      };
    }

    const totalPnl = closedTrades.reduce(
      (sum, t) => sum + parseFloat(t.pnl || "0"),
      0
    );
    const totalVolume = totalVolumeAll;
    const totalFees = closedTrades.reduce(
      (sum, t) => sum + parseFloat(t.fee || "0"),
      0
    );

    const winningTrades = closedTrades.filter(
      (t) => parseFloat(t.pnl || "0") > 0
    );
    const losingTrades = closedTrades.filter(
      (t) => parseFloat(t.pnl || "0") < 0
    );
    
    const totalWins = winningTrades.reduce((sum, t) => sum + parseFloat(t.pnl || '0'), 0);
    const totalLosses = Math.abs(losingTrades.reduce((sum, t) => sum + parseFloat(t.pnl || '0'), 0));


    const longTrades = closedTrades.filter(t => t.type === 'LONG');
    const shortTrades = closedTrades.filter(t => t.type === 'SHORT');
    
    const longWins = longTrades.filter(t => parseFloat(t.pnl || '0') > 0).length;
    const shortWins = shortTrades.filter(t => parseFloat(t.pnl || '0') > 0).length;
    
    const longPnl = longTrades.reduce((sum, t) => sum + parseFloat(t.pnl || '0'), 0);
    const shortPnl = shortTrades.reduce((sum, t) => sum + parseFloat(t.pnl || '0'), 0);


    const pnlValues = closedTrades.map(t => parseFloat(t.pnl || '0'));
    const largestWin = Math.max(...pnlValues);
    const largestLoss = Math.min(...pnlValues);


    const { maxDrawdown, maxDrawdownPercentage } = this.calculateDrawdown(closedTrades);


    const averageTradeDuration = this.calculateAverageDuration(closedTrades);


    const symbolStats = await this.calculateSymbolStats(closedTrades);

    const timeOfDayStats = this.calculateTimeOfDayStats(closedTrades);
    const sessionStats = this.calculateSessionStats(closedTrades);
    const feeBreakdown = this.calculateFeeBreakdown(userTrades);
    const orderTypeStats = this.calculateOrderTypeStats(closedTrades);

    return {
      totalPnl,
      totalPnlPercentage: totalVolume > 0 ? (totalPnl / totalVolume) * 100 : 0,
      totalVolume,
      totalFees,
      totalTrades: closedTrades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: (winningTrades.length / closedTrades.length) * 100,
      averageWin: winningTrades.length > 0 ? totalWins / winningTrades.length : 0,
      averageLoss: losingTrades.length > 0 ? totalLosses / losingTrades.length : 0,
      averageTradeDuration,
      profitFactor: totalLosses > 0 ? totalWins / totalLosses : totalWins,
      largestWin,
      largestLoss,
      maxDrawdown,
      maxDrawdownPercentage,
      longTrades: longTrades.length,
      shortTrades: shortTrades.length,
      longWinRate: longTrades.length > 0 ? (longWins / longTrades.length) * 100 : 0,
      shortWinRate: shortTrades.length > 0 ? (shortWins / shortTrades.length) * 100 : 0,
      longPnl,
      shortPnl,
      symbolStats,
      timeOfDayStats,
      sessionStats,
      feeBreakdown,
      orderTypeStats,
    };
  }

  private calculateTimeOfDayStats(closedTrades: any[]): TimeOfDayBucket[] {
    const buckets = [
      { label: '00-06', hourStart: 0, hourEnd: 6 },
      { label: '06-12', hourStart: 6, hourEnd: 12 },
      { label: '12-18', hourStart: 12, hourEnd: 18 },
      { label: '18-24', hourStart: 18, hourEnd: 24 },
    ];
    return buckets.map(({ label, hourStart, hourEnd }) => {
      const subset = closedTrades.filter((t) => {
        const h = new Date(t.timestamp).getUTCHours();
        return h >= hourStart && h < hourEnd;
      });
      const pnl = subset.reduce((s, t) => s + parseFloat(t.pnl || '0'), 0);
      const wins = subset.filter((t) => parseFloat(t.pnl || '0') > 0).length;
      return {
        label,
        hourStart,
        hourEnd,
        trades: subset.length,
        pnl,
        winRate: subset.length ? (wins / subset.length) * 100 : 0,
      };
    });
  }

  private calculateSessionStats(closedTrades: any[]): SessionStats[] {
    const sessions = [
      { session: 'Morning' as const, start: 6, end: 12 },
      { session: 'Afternoon' as const, start: 12, end: 18 },
      { session: 'Evening' as const, start: 18, end: 24 },
      { session: 'Night' as const, start: 0, end: 6 },
    ];
    return sessions.map(({ session, start, end }) => {
      const subset = closedTrades.filter((t) => {
        const h = new Date(t.timestamp).getUTCHours();
        if (start > end) return h >= start || h < end;
        return h >= start && h < end;
      });
      const pnl = subset.reduce((s, t) => s + parseFloat(t.pnl || '0'), 0);
      const wins = subset.filter((t) => parseFloat(t.pnl || '0') > 0).length;
      return {
        session,
        trades: subset.length,
        pnl,
        winRate: subset.length ? (wins / subset.length) * 100 : 0,
      };
    });
  }

  private calculateFeeBreakdown(allTrades: any[]): FeeBreakdownItem[] {
    const total = allTrades.reduce((s, t) => s + parseFloat(t.fee || '0'), 0);
    if (total <= 0) return [];
    const byKey = new Map<string, number>();
    for (const t of allTrades) {
      const key = (t.feeType as string) || (t.symbol as string) || 'Other';
      byKey.set(key, (byKey.get(key) ?? 0) + parseFloat(t.fee || '0'));
    }
    return Array.from(byKey.entries()).map(([label, amount]) => ({
      label,
      amount,
      percentage: (amount / total) * 100,
    }));
  }

  private calculateOrderTypeStats(closedTrades: any[]): OrderTypeStat[] {
    const byType = new Map<string, { pnl: number; wins: number; count: number }>();
    for (const t of closedTrades) {
      const type = (t.orderType as string) || 'UNKNOWN';
      const pnl = parseFloat(t.pnl || '0');
      let row = byType.get(type);
      if (!row) row = { pnl: 0, wins: 0, count: 0 };
      row.count += 1;
      row.pnl += pnl;
      if (pnl > 0) row.wins += 1;
      byType.set(type, row);
    }
    return Array.from(byType.entries()).map(([orderType, row]) => ({
      orderType,
      trades: row.count,
      pnl: row.pnl,
      winRate: row.count ? (row.wins / row.count) * 100 : 0,
    }));
  }


  private calculateDrawdown(closedTrades: any[]): { maxDrawdown: number; maxDrawdownPercentage: number } {
    let peak = 0;
    let maxDrawdown = 0;
    let cumulativePnl = 0;

    for (const trade of closedTrades) {
      cumulativePnl += parseFloat(trade.pnl || '0');
      

      if (cumulativePnl > peak) {
        peak = cumulativePnl;
      }
      

      const drawdown = peak - cumulativePnl;
      
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    const maxDrawdownPercentage = peak > 0 ? (maxDrawdown / peak) * 100 : 0;

    return { maxDrawdown, maxDrawdownPercentage };
  }


  private calculateAverageDuration(closedTrades: any[]): number {
    let totalDuration = 0;
    let tradeCount = 0;

    for (const trade of closedTrades) {
      const exitTime = new Date(trade.timestamp).getTime();
      const entryTime = trade.entryTimestamp
        ? new Date(trade.entryTimestamp).getTime()
        : exitTime;
      const durationHours = (exitTime - entryTime) / (1000 * 60 * 60);
      if (durationHours >= 0) {
        totalDuration += durationHours;
        tradeCount++;
      }
    }

    return tradeCount > 0 ? totalDuration / tradeCount : 0;
  }


  private async calculateSymbolStats(closedTrades: any[]): Promise<SymbolStats[]> {
    const symbolMap = new Map<string, any[]>();
    

    for (const trade of closedTrades) {
      const symbol = trade.symbol;
      if (!symbolMap.has(symbol)) {
        symbolMap.set(symbol, []);
      }
      symbolMap.get(symbol)?.push(trade);
    }

    const stats: SymbolStats[] = [];

    for (const [symbol, symbolTrades] of symbolMap) {
      const pnl = symbolTrades.reduce((sum, t) => sum + parseFloat(t.pnl || '0'), 0);
      const volume = symbolTrades.reduce((sum, t) => sum + parseFloat(t.size || '0') * parseFloat(t.entryPrice || '0'), 0);
      const wins = symbolTrades.filter(t => parseFloat(t.pnl || '0') > 0).length;
      
      stats.push({
        symbol,
        trades: symbolTrades.length,
        pnl,
        winRate: (wins / symbolTrades.length) * 100,
        volume,
      });
    }


    return stats.sort((a, b) => b.pnl - a.pnl);
  }


  async getTimeSeriesData(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<TimeSeriesData[]> {
    const conditions = [eq(trades.userId, userId), eq(trades.status, 'CLOSED')];
    
    if (startDate) {
      conditions.push(gte(trades.timestamp, startDate));
    }
    if (endDate) {
      conditions.push(lte(trades.timestamp, endDate));
    }

    const userTrades = await db
      .select()
      .from(trades)
      .where(and(...conditions))
      .orderBy(trades.timestamp);


    const dateMap = new Map<string, any[]>();
    
    for (const trade of userTrades) {
      const dateKey = new Date(trade.timestamp).toISOString().split('T')[0];
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, []);
      }
      dateMap.get(dateKey)?.push(trade);
    }

    let cumulativePnl = 0;
    let cumulativeFees = 0;
    let peak = 0;
    const timeSeriesData: TimeSeriesData[] = [];

    for (const [date, dayTrades] of Array.from(dateMap.entries()).sort()) {
      const dailyPnl = dayTrades.reduce((sum, t) => sum + parseFloat(t.pnl || '0'), 0);
      const dailyFees = dayTrades.reduce((sum, t) => sum + parseFloat(t.fee || '0'), 0);
      cumulativePnl += dailyPnl;
      cumulativeFees += dailyFees;
      if (cumulativePnl > peak) peak = cumulativePnl;
      const drawdown = peak - cumulativePnl;

      timeSeriesData.push({
        date,
        cumulativePnl,
        dailyPnl,
        tradeCount: dayTrades.length,
        drawdown,
        cumulativeFees,
        dailyFees,
      });
    }

    return timeSeriesData;
  }


  private getEmptyMetrics(): TradeMetrics {
    return {
      totalPnl: 0,
      totalPnlPercentage: 0,
      totalVolume: 0,
      totalFees: 0,
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      winRate: 0,
      averageWin: 0,
      averageLoss: 0,
      averageTradeDuration: 0,
      profitFactor: 0,
      largestWin: 0,
      largestLoss: 0,
      maxDrawdown: 0,
      maxDrawdownPercentage: 0,
      longTrades: 0,
      shortTrades: 0,
      longWinRate: 0,
      shortWinRate: 0,
      longPnl: 0,
      shortPnl: 0,
      symbolStats: [],
      timeOfDayStats: [],
      sessionStats: [],
      feeBreakdown: [],
      orderTypeStats: [],
    };
  }
}