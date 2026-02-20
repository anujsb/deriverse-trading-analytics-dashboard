'use client';

import { TradeMetrics } from '@/lib/analytics/metrics';
import {
  TrendingUp, TrendingDown, DollarSign, Activity,
  Target, BarChart3, Zap, Clock,
} from 'lucide-react';

interface MetricsCardsProps {
  metrics: TradeMetrics | null;
  loading: boolean;
}

export function MetricsCards({ metrics, loading }: MetricsCardsProps) {
  if (loading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
        {[...Array(8)].map((_, i) => (
          <div key={i} style={{ background: '#111213', border: '1px solid #1e2022', borderRadius: 6, height: 90, animation: 'dv-pulse 1.4s ease-in-out infinite' }} />
        ))}
      </div>
    );
  }

  if (!metrics) return null;

  const cards = [
    {
      title: 'Total PnL',
      value: `${metrics.totalPnl >= 0 ? '+' : ''}${metrics.totalPnl.toFixed(5)}`,
      sub: `${metrics.totalPnlPercentage.toFixed(2)}% return`,
      icon: DollarSign,
      positive: metrics.totalPnl >= 0,
      highlight: true,
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
      sub: `${metrics.longTrades}L · ${metrics.shortTrades}S`,
      icon: Activity,
      neutral: true,
    },
    {
      title: 'Total Volume',
      value: metrics.totalVolume >= 1000
        ? `$${(metrics.totalVolume / 1000).toFixed(1)}K`
        : `$${metrics.totalVolume.toFixed(2)}`,
      sub: `Fees: $${metrics.totalFees.toFixed(4)}`,
      icon: BarChart3,
      neutral: true,
    },
    {
      title: 'Profit Factor',
      value: metrics.profitFactor.toFixed(2),
      sub: `Avg win: $${metrics.averageWin.toFixed(4)}`,
      icon: TrendingUp,
      positive: metrics.profitFactor >= 1,
    },
    {
      title: 'Max Drawdown',
      value: `$${metrics.maxDrawdown.toFixed(4)}`,
      sub: `${metrics.maxDrawdownPercentage.toFixed(2)}% of peak`,
      icon: TrendingDown,
      positive: false,
    },
    {
      title: 'Largest Win',
      value: `+$${metrics.largestWin.toFixed(4)}`,
      sub: `Loss: $${Math.abs(metrics.largestLoss).toFixed(4)}`,
      icon: Zap,
      positive: true,
    },
    {
      title: 'Avg Duration',
      value: metrics.averageTradeDuration > 0 ? `${metrics.averageTradeDuration.toFixed(1)}h` : '—',
      sub: `L:${metrics.longWinRate.toFixed(0)}% · S:${metrics.shortWinRate.toFixed(0)}% win`,
      icon: Clock,
      neutral: true,
    },
  ];

  return (
    <>
      <style>{`
        @keyframes dv-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .dv-metric-card { background:#111213; border:1px solid #1e2022; border-radius:6px; padding:14px 16px; transition:border-color 0.2s; }
        .dv-metric-card:hover { border-color:rgba(226,201,126,0.14); }
        .dv-metric-card.highlight { border-color:rgba(226,201,126,0.22); }
        .dv-metric-card.highlight:hover { border-color:rgba(226,201,126,0.38); }
        .dv-icon-wrap { width:26px; height:26px; border-radius:5px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
      `}</style>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
        {cards.map((card, i) => {
          const Icon = card.icon;
          const valColor = card.neutral ? '#a0a8b8' : card.positive ? '#4ade80' : '#f87171';
          const iconBg = card.neutral
            ? 'rgba(160,168,184,0.1)'
            : card.positive
            ? 'rgba(74,222,128,0.1)'
            : 'rgba(248,113,113,0.1)';

          return (
            <div key={i} className={`dv-metric-card${card.highlight ? ' highlight' : ''}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ fontSize: 9, color: '#3a3c40', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  {card.title}
                </div>
                <div className="dv-icon-wrap" style={{ background: iconBg }}>
                  <Icon size={12} color={valColor} />
                </div>
              </div>
              <div style={{ fontSize: 15, fontWeight: 500, color: valColor, marginBottom: 3, letterSpacing: '0.02em' }}>
                {card.value}
              </div>
              <div style={{ fontSize: 9, color: '#2e3033', letterSpacing: '0.06em' }}>{card.sub}</div>
            </div>
          );
        })}
      </div>
    </>
  );
}