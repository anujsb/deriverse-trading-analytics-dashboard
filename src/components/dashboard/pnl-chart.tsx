'use client';

import { TimeSeriesData } from '@/lib/analytics/metrics';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Area, ReferenceLine, ComposedChart, Line,
} from 'recharts';
import { format } from 'date-fns';

interface PnLChartProps {
  data: TimeSeriesData[];
  loading: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#0e0f10', border: '1px solid #1e2022', borderRadius: 5, padding: '10px 14px', fontFamily: "'DM Mono', monospace" }}>
      <div style={{ fontSize: 9, color: '#3a3c40', letterSpacing: '0.1em', marginBottom: 7 }}>
        {format(new Date(label), 'MMM dd, yyyy')}
      </div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ fontSize: 11, color: p.color, marginBottom: 3 }}>
          {p.name === 'cumulativePnl' ? 'PnL' : 'Drawdown'}: ${Number(p.value).toFixed(5)}
        </div>
      ))}
    </div>
  );
};

export function PnLChart({ data, loading }: PnLChartProps) {
  const cardStyle: React.CSSProperties = {
    background: '#111213',
    border: '1px solid #1e2022',
    borderRadius: 6,
    padding: 16,
    fontFamily: "'DM Mono', 'Courier New', monospace",
  };

  if (loading) {
    return (
      <div style={cardStyle}>
        <div style={{ background: '#1a1c1e', borderRadius: 4, width: '40%', height: 10, marginBottom: 16, animation: 'dv-pulse 1.4s ease-in-out infinite' }} />
        <div style={{ background: '#0c0d0e', borderRadius: 5, height: 280, animation: 'dv-pulse 1.4s ease-in-out infinite' }} />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div style={cardStyle}>
        <div style={{ fontSize: 9, color: '#3a3c40', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 14 }}>
          Cumulative PnL &amp; Drawdown
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 280, fontSize: 11, color: '#252729' }}>
          No trading data available
        </div>
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 9, color: '#3a3c40', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
          Cumulative PnL &amp; Drawdown
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 9, color: '#3a3c40', letterSpacing: '0.08em' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 14, height: 2, background: '#e2c97e', borderRadius: 2, display: 'inline-block' }} />
            PnL
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 14, height: 2, background: '#f87171', borderRadius: 2, display: 'inline-block' }} />
            Drawdown
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="dvPnlGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#e2c97e" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#e2c97e" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#181a1c" vertical={false} />

          <XAxis
            dataKey="date"
            tickFormatter={(d) => format(new Date(d), 'MMM dd')}
            stroke="transparent"
            tick={{ fill: '#2e3033', fontFamily: "'DM Mono', monospace", fontSize: 9 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            yAxisId="pnl"
            orientation="left"
            stroke="transparent"
            tick={{ fill: '#2e3033', fontFamily: "'DM Mono', monospace", fontSize: 9 }}
            tickFormatter={(v) => `$${v.toFixed(2)}`}
            axisLine={false}
            tickLine={false}
            width={56}
          />
          <YAxis
            yAxisId="drawdown"
            orientation="right"
            stroke="transparent"
            tick={{ fill: '#2e3033', fontFamily: "'DM Mono', monospace", fontSize: 9 }}
            tickFormatter={(v) => `$${v.toFixed(2)}`}
            axisLine={false}
            tickLine={false}
            width={56}
          />

          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine yAxisId="pnl" y={0} stroke="#1e2022" strokeDasharray="4 4" />

          <Area
            yAxisId="pnl"
            type="monotone"
            dataKey="cumulativePnl"
            stroke="#e2c97e"
            strokeWidth={1.5}
            fillOpacity={1}
            fill="url(#dvPnlGrad)"
            name="cumulativePnl"
          />
          <Line
            yAxisId="drawdown"
            type="monotone"
            dataKey="drawdown"
            stroke="#f87171"
            strokeWidth={1.5}
            dot={false}
            strokeOpacity={0.7}
            name="drawdown"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}