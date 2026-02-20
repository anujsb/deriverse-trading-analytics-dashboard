'use client';

import { SymbolStats } from '@/lib/analytics/metrics';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

interface SymbolPerformanceProps {
  symbols: SymbolStats[];
  loading: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const val = Number(payload[0].value);
  return (
    <div style={{ background: '#0e0f10', border: '1px solid #1e2022', borderRadius: 5, padding: '10px 14px', fontFamily: "'DM Mono', monospace" }}>
      <div style={{ fontSize: 9, color: '#3a3c40', letterSpacing: '0.1em', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 12, fontWeight: 500, color: val >= 0 ? '#4ade80' : '#f87171' }}>
        {val >= 0 ? '+' : ''}${val.toFixed(4)} PnL
      </div>
    </div>
  );
};

export function SymbolPerformance({ symbols, loading }: SymbolPerformanceProps) {
  const cardStyle: React.CSSProperties = {
    background: '#111213',
    border: '1px solid #1e2022',
    borderRadius: 6,
    padding: 16,
    fontFamily: "'DM Mono', 'Courier New', monospace",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 9,
    color: '#3a3c40',
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    marginBottom: 14,
  };

  if (loading) {
    return (
      <div style={cardStyle}>
        <div style={{ background: '#1a1c1e', borderRadius: 4, width: '40%', height: 10, marginBottom: 14, animation: 'dv-pulse 1.4s ease-in-out infinite' }} />
        <div style={{ background: '#0c0d0e', borderRadius: 5, height: 220, animation: 'dv-pulse 1.4s ease-in-out infinite' }} />
      </div>
    );
  }

  if (!symbols || symbols.length === 0) {
    return (
      <div style={cardStyle}>
        <div style={labelStyle}>Performance by Symbol</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 220, fontSize: 11, color: '#252729' }}>
          No data available
        </div>
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      <div style={labelStyle}>Performance by Symbol</div>

      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={symbols} margin={{ top: 4, right: 6, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#181a1c" vertical={false} />
          <XAxis
            dataKey="symbol"
            stroke="transparent"
            tick={{ fill: '#2e3033', fontFamily: "'DM Mono', monospace", fontSize: 9 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            stroke="transparent"
            tick={{ fill: '#2e3033', fontFamily: "'DM Mono', monospace", fontSize: 9 }}
            tickFormatter={(v) => `$${v}`}
            axisLine={false}
            tickLine={false}
            width={50}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(226,201,126,0.04)' }} />
          <Bar dataKey="pnl" radius={[3, 3, 0, 0]}>
            {symbols.map((entry, i) => (
              <Cell
                key={`cell-${i}`}
                fill={entry.pnl >= 0 ? '#4ade80' : '#f87171'}
                fillOpacity={0.75}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Table */}
      <div style={{ marginTop: 12, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr>
              {['Symbol', 'Trades', 'Win%', 'Volume', 'PnL'].map((h) => (
                <th key={h} style={{ padding: '0 10px 8px', textAlign: 'left', fontSize: 9, color: '#2e3033', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, borderBottom: '1px solid #181a1c' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {symbols.map((s) => (
              <tr key={s.symbol} style={{ borderBottom: '1px solid #15171a' }}>
                <td style={{ padding: '9px 10px', color: '#f0ebe0', fontWeight: 500 }}>{s.symbol}</td>
                <td style={{ padding: '9px 10px', color: '#3a3c40' }}>{s.trades}</td>
                <td style={{ padding: '9px 10px', color: s.winRate >= 50 ? '#4ade80' : '#f87171' }}>
                  {s.winRate.toFixed(1)}%
                </td>
                <td style={{ padding: '9px 10px', color: '#3a3c40' }}>
                  ${(s.volume / 1000).toFixed(1)}K
                </td>
                <td style={{ padding: '9px 10px', color: s.pnl >= 0 ? '#4ade80' : '#f87171', fontWeight: 500 }}>
                  {s.pnl >= 0 ? '+' : ''}${s.pnl.toFixed(4)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}