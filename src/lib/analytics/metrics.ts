import { db } from '@/lib/db';
import { trades } from '@/lib/db/schema';
import { eq, and, gte, lte, sql, desc } from 'drizzle-orm';

export interface TradeMetrics {
  // Overall Performance
  totalPnl: number;
  totalPnlPercentage: number;
  totalVolume: number;
  totalFees: number;
  
  // Trade Statistics
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  
  // Average Metrics
  averageWin: number;
  averageLoss: number;
  averageTradeDuration: number; // in hours
  profitFactor: number; // total wins / total losses
  
  // Risk Metrics
  largestWin: number;
  largestLoss: number;
  maxDrawdown: number;
  maxDrawdownPercentage: number;
  
  // Directional Analysis
  longTrades: number;
  shortTrades: number;
  longWinRate: number;
  shortWinRate: number;
  longPnl: number;
  shortPnl: number;
  
  // Symbol Performance
  symbolStats: SymbolStats[];
}

export interface SymbolStats {
  symbol: string;
  trades: number;
  pnl: number;
  winRate: number;
  volume: number;
}

export interface TimeSeriesData {
  date: string;
  cumulativePnl: number;
  dailyPnl: number;
  tradeCount: number;
}

export class AnalyticsEngine {
  /**
   * Calculate comprehensive trading metrics
   */
  async calculateMetrics(
    userId: string,
    startDate?: Date,
    endDate?: Date,
    symbol?: string
  ): Promise<TradeMetrics> {
    // Build query conditions
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

    // Fetch all trades matching conditions
    const userTrades = await db
      .select()
      .from(trades)
      .where(and(...conditions))
      .orderBy(trades.timestamp);

    // Filter only closed trades for PnL calculations
    const closedTrades = userTrades.filter(t => t.status === 'CLOSED' && t.pnl !== null);

    if (closedTrades.length === 0) {
      return this.getEmptyMetrics();
    }

    // Calculate basic metrics
    const totalPnl = closedTrades.reduce((sum, t) => sum + parseFloat(t.pnl || '0'), 0);
    const totalVolume = closedTrades.reduce((sum, t) => sum + parseFloat(t.size || '0') * parseFloat(t.entryPrice || '0'), 0);
    const totalFees = closedTrades.reduce((sum, t) => sum + parseFloat(t.fee || '0'), 0);

    // Win/Loss statistics
    const winningTrades = closedTrades.filter(t => parseFloat(t.pnl || '0') > 0);
    const losingTrades = closedTrades.filter(t => parseFloat(t.pnl || '0') < 0);
    
    const totalWins = winningTrades.reduce((sum, t) => sum + parseFloat(t.pnl || '0'), 0);
    const totalLosses = Math.abs(losingTrades.reduce((sum, t) => sum + parseFloat(t.pnl || '0'), 0));

    // Directional analysis
    const longTrades = closedTrades.filter(t => t.type === 'LONG');
    const shortTrades = closedTrades.filter(t => t.type === 'SHORT');
    
    const longWins = longTrades.filter(t => parseFloat(t.pnl || '0') > 0).length;
    const shortWins = shortTrades.filter(t => parseFloat(t.pnl || '0') > 0).length;
    
    const longPnl = longTrades.reduce((sum, t) => sum + parseFloat(t.pnl || '0'), 0);
    const shortPnl = shortTrades.reduce((sum, t) => sum + parseFloat(t.pnl || '0'), 0);

    // Find largest win/loss
    const pnlValues = closedTrades.map(t => parseFloat(t.pnl || '0'));
    const largestWin = Math.max(...pnlValues);
    const largestLoss = Math.min(...pnlValues);

    // Calculate drawdown
    const { maxDrawdown, maxDrawdownPercentage } = this.calculateDrawdown(closedTrades);

    // Calculate average trade duration
    const averageTradeDuration = this.calculateAverageDuration(closedTrades);

    // Symbol-specific stats
    const symbolStats = await this.calculateSymbolStats(closedTrades);

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
    };
  }

  /**
   * Calculate maximum drawdown
   */
  private calculateDrawdown(closedTrades: any[]): { maxDrawdown: number; maxDrawdownPercentage: number } {
    let peak = 0;
    let maxDrawdown = 0;
    let cumulativePnl = 0;

    for (const trade of closedTrades) {
      cumulativePnl += parseFloat(trade.pnl || '0');
      
      // Update peak if we've reached a new high
      if (cumulativePnl > peak) {
        peak = cumulativePnl;
      }
      
      // Calculate current drawdown
      const drawdown = peak - cumulativePnl;
      
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    const maxDrawdownPercentage = peak > 0 ? (maxDrawdown / peak) * 100 : 0;

    return { maxDrawdown, maxDrawdownPercentage };
  }

  /**
   * Calculate average trade duration
   */
  private calculateAverageDuration(closedTrades: any[]): number {
    // Group trades by signature to find entry/exit pairs
    const tradeMap = new Map<string, any[]>();
    
    for (const trade of closedTrades) {
      const sig = trade.signature;
      if (!tradeMap.has(sig)) {
        tradeMap.set(sig, []);
      }
      tradeMap.get(sig)?.push(trade);
    }

    let totalDuration = 0;
    let tradeCount = 0;

    // Calculate duration for each complete trade
    for (const [_, tradePair] of tradeMap) {
      if (tradePair.length >= 1) {
        const entryTime = new Date(tradePair[0].timestamp).getTime();
        const exitTime = tradePair[tradePair.length - 1].timestamp 
          ? new Date(tradePair[tradePair.length - 1].timestamp).getTime()
          : entryTime;
        
        const durationHours = (exitTime - entryTime) / (1000 * 60 * 60);
        totalDuration += durationHours;
        tradeCount++;
      }
    }

    return tradeCount > 0 ? totalDuration / tradeCount : 0;
  }

  /**
   * Calculate per-symbol statistics
   */
  private async calculateSymbolStats(closedTrades: any[]): Promise<SymbolStats[]> {
    const symbolMap = new Map<string, any[]>();
    
    // Group trades by symbol
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

    // Sort by PnL descending
    return stats.sort((a, b) => b.pnl - a.pnl);
  }

  /**
   * Get time series data for charts
   */
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

    // Group trades by date
    const dateMap = new Map<string, any[]>();
    
    for (const trade of userTrades) {
      const dateKey = new Date(trade.timestamp).toISOString().split('T')[0];
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, []);
      }
      dateMap.get(dateKey)?.push(trade);
    }

    // Calculate cumulative PnL over time
    let cumulativePnl = 0;
    const timeSeriesData: TimeSeriesData[] = [];

    for (const [date, dayTrades] of Array.from(dateMap.entries()).sort()) {
      const dailyPnl = dayTrades.reduce((sum, t) => sum + parseFloat(t.pnl || '0'), 0);
      cumulativePnl += dailyPnl;
      
      timeSeriesData.push({
        date,
        cumulativePnl,
        dailyPnl,
        tradeCount: dayTrades.length,
      });
    }

    return timeSeriesData;
  }

  /**
   * Return empty metrics structure
   */
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
    };
  }
}