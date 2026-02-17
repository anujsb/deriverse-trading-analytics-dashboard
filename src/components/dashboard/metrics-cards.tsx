'use client';

import { TradeMetrics } from '@/lib/analytics/metrics';
import { TrendingUp, TrendingDown, DollarSign, Activity, Target, BarChart3 } from 'lucide-react';

interface MetricsCardsProps {
  metrics: TradeMetrics | null;
  loading: boolean;
}

export function MetricsCards({ metrics, loading }: MetricsCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg p-6 shadow animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!metrics) return null;

  const cards = [
    {
      title: 'Total PnL',
      value: `$${metrics.totalPnl.toFixed(2)}`,
      change: `${metrics.totalPnlPercentage.toFixed(2)}%`,
      icon: DollarSign,
      color: metrics.totalPnl >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor: metrics.totalPnl >= 0 ? 'bg-green-50' : 'bg-red-50',
    },
    {
      title: 'Win Rate',
      value: `${metrics.winRate.toFixed(1)}%`,
      change: `${metrics.winningTrades}W / ${metrics.losingTrades}L`,
      icon: Target,
      color: metrics.winRate >= 50 ? 'text-green-600' : 'text-red-600',
      bgColor: metrics.winRate >= 50 ? 'bg-green-50' : 'bg-red-50',
    },
    {
      title: 'Total Trades',
      value: metrics.totalTrades.toString(),
      change: `${metrics.longTrades}L / ${metrics.shortTrades}S`,
      icon: Activity,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Total Volume',
      value: `$${(metrics.totalVolume / 1000).toFixed(1)}K`,
      change: `Fees: $${metrics.totalFees.toFixed(2)}`,
      icon: BarChart3,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Profit Factor',
      value: metrics.profitFactor.toFixed(2),
      change: `Avg Win: $${metrics.averageWin.toFixed(2)}`,
      icon: TrendingUp,
      color: metrics.profitFactor >= 1 ? 'text-green-600' : 'text-red-600',
      bgColor: metrics.profitFactor >= 1 ? 'bg-green-50' : 'bg-red-50',
    },
    {
      title: 'Max Drawdown',
      value: `$${metrics.maxDrawdown.toFixed(2)}`,
      change: `${metrics.maxDrawdownPercentage.toFixed(2)}%`,
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      title: 'Largest Win',
      value: `$${metrics.largestWin.toFixed(2)}`,
      change: `Loss: $${metrics.largestLoss.toFixed(2)}`,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Avg Duration',
      value: `${metrics.averageTradeDuration.toFixed(1)}h`,
      change: `Long: ${metrics.longWinRate.toFixed(1)}% / Short: ${metrics.shortWinRate.toFixed(1)}%`,
      icon: Activity,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div key={index} className="bg-white rounded-lg p-6 shadow hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-gray-600">{card.title}</p>
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <Icon className={`w-5 h-5 ${card.color}`} />
              </div>
            </div>
            <div className="space-y-1">
              <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
              <p className="text-xs text-gray-500">{card.change}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}