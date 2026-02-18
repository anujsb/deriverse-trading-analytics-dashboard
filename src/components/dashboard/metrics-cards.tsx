'use client';

import { TradeMetrics } from '@/lib/analytics/metrics';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  Target,
  BarChart3,
  Zap,
  Clock,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface MetricsCardsProps {
  metrics: TradeMetrics | null;
  loading: boolean;
}

export function MetricsCards({ metrics, loading }: MetricsCardsProps) {
  if (loading) {
    return (
      <div className="gap-3 grid grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="bg-[#0d1117] p-4 border border-[#1e2a3a] rounded-xl h-[100px] animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!metrics) return null;

  const cards = [
    {
      title: 'Total PnL',
      value: `${metrics.totalPnl >= 0 ? '+' : ''}$${metrics.totalPnl.toFixed(2)}`,
      sub: `${metrics.totalPnlPercentage.toFixed(2)}% return`,
      icon: DollarSign,
      positive: metrics.totalPnl >= 0,
      accent: true,
    },
    {
      title: 'Win Rate',
      value: `${metrics.winRate.toFixed(1)}%`,
      sub: `${metrics.winningTrades}W / ${metrics.losingTrades}L`,
      icon: Target,
      positive: metrics.winRate >= 50,
    },
    {
      title: 'Total Trades',
      value: metrics.totalTrades.toString(),
      sub: `${metrics.longTrades} long · ${metrics.shortTrades} short`,
      icon: Activity,
      neutral: true,
    },
    {
      title: 'Total Volume',
      value: metrics.totalVolume >= 1000
        ? `$${(metrics.totalVolume / 1000).toFixed(1)}K`
        : `$${metrics.totalVolume.toFixed(2)}`,
      sub: `Fees: $${metrics.totalFees.toFixed(2)}`,
      icon: BarChart3,
      neutral: true,
    },
    {
      title: 'Profit Factor',
      value: metrics.profitFactor.toFixed(2),
      sub: `Avg win: $${metrics.averageWin.toFixed(2)}`,
      icon: TrendingUp,
      positive: metrics.profitFactor >= 1,
    },
    {
      title: 'Max Drawdown',
      value: `$${metrics.maxDrawdown.toFixed(2)}`,
      sub: `${metrics.maxDrawdownPercentage.toFixed(2)}% of peak`,
      icon: TrendingDown,
      positive: false,
    },
    {
      title: 'Largest Win',
      value: `$${metrics.largestWin.toFixed(2)}`,
      sub: `Largest loss: $${Math.abs(metrics.largestLoss).toFixed(2)}`,
      icon: Zap,
      positive: true,
    },
    {
      title: 'Avg Duration',
      value: metrics.averageTradeDuration > 0
        ? `${metrics.averageTradeDuration.toFixed(1)}h`
        : '—',
      sub: `L: ${metrics.longWinRate.toFixed(0)}% · S: ${metrics.shortWinRate.toFixed(0)}% win`,
      icon: Clock,
      neutral: true,
    },
  ];

  return (
    <div className="gap-3 grid grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        const valueColor = card.neutral
          ? 'text-gray-100'
          : card.positive
          ? 'text-[#22c55e]'
          : 'text-[#ef4444]';
        const iconBg = card.neutral
          ? 'bg-[#1e2a3a] text-gray-400'
          : card.positive
          ? 'bg-[#22c55e]/10 text-[#22c55e]'
          : 'bg-[#ef4444]/10 text-[#ef4444]';

        return (
          <Card
            key={index}
            className={cn(
              'group bg-[#0d1117] p-4 border-[#1e2a3a] hover:border-[#2a3a4a] rounded-xl transition-colors',
              card.accent && 'border-[#f0b429]/30 hover:border-[#f0b429]/50'
            )}
          >
            <div className="flex justify-between items-start mb-3">
              <p className="font-mono font-semibold text-[10px] text-gray-500 uppercase leading-none tracking-widest">
                {card.title}
              </p>
              <div className={cn('p-1.5 rounded-md', iconBg)}>
                <Icon className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className={cn('mb-1 font-bold text-xl leading-none tracking-tight', valueColor)}>
              {card.value}
            </p>
            <p className="mt-1.5 font-mono text-[10px] text-gray-600 leading-none">{card.sub}</p>
          </Card>
        );
      })}
    </div>
  );
}