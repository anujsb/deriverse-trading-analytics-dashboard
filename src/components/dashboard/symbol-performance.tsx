'use client';

import { SymbolStats } from '@/lib/analytics/metrics';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card } from '@/components/ui/card';

interface SymbolPerformanceProps {
  symbols: SymbolStats[];
  loading: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const val = Number(payload[0].value);
  return (
    <div className="bg-[#0d1117] shadow-xl px-3 py-2.5 border border-[#1e2a3a] rounded-lg">
      <p className="mb-1 font-mono text-[10px] text-gray-500">{label}</p>
      <p
        className={`font-mono text-[12px] font-semibold ${val >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}
      >
        {val >= 0 ? '+' : ''}${val.toFixed(2)} PnL
      </p>
    </div>
  );
};

export function SymbolPerformance({ symbols, loading }: SymbolPerformanceProps) {
  if (loading) {
    return (
      <Card className="bg-[#0d1117] p-5 border-[#1e2a3a] rounded-xl">
        <div className="bg-[#1e2a3a] mb-4 rounded w-1/3 h-4 animate-pulse" />
        <div className="bg-[#080d13] rounded-lg h-64 animate-pulse" />
      </Card>
    );
  }

  if (!symbols || symbols.length === 0) {
    return (
      <Card className="bg-[#0d1117] p-5 border-[#1e2a3a] rounded-xl">
        <p className="mb-4 font-mono font-semibold text-[10px] text-gray-500 uppercase tracking-widest">
          Performance by Symbol
        </p>
        <div className="flex justify-center items-center h-64 font-mono text-gray-600 text-sm">
          No data available
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-[#0d1117] p-5 border-[#1e2a3a] rounded-xl">
      <p className="mb-5 font-mono font-semibold text-[10px] text-gray-500 uppercase tracking-widest">
        Performance by Symbol
      </p>

      {/* Bar chart */}
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={symbols} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" vertical={false} />
          <XAxis
            dataKey="symbol"
            stroke="#2a3a4a"
            tick={{ fill: '#4b5563', fontFamily: 'monospace', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            stroke="#2a3a4a"
            tick={{ fill: '#4b5563', fontFamily: 'monospace', fontSize: 10 }}
            tickFormatter={(value) => `$${value}`}
            axisLine={false}
            tickLine={false}
            width={52}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
            {symbols.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.pnl >= 0 ? '#22c55e' : '#ef4444'}
                fillOpacity={0.85}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Table */}
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr>
              {['Symbol', 'Trades', 'Win%', 'Volume', 'PnL'].map((h) => (
                <th
                  key={h}
                  className="px-3 py-2 border-[#1e2a3a] border-b font-mono font-semibold text-[9px] text-gray-600 text-left uppercase tracking-widest"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {symbols.map((symbol) => (
              <tr
                key={symbol.symbol}
                className="hover:bg-[#1e2a3a]/30 border-[#1e2a3a]/50 border-b transition-colors"
              >
                <td className="px-3 py-2.5 font-mono font-semibold text-[11px] text-gray-200">
                  {symbol.symbol}
                </td>
                <td className="px-3 py-2.5 font-mono text-[11px] text-gray-500">
                  {symbol.trades}
                </td>
                <td className="px-3 py-2.5 font-mono text-[11px]">
                  <span
                    className={symbol.winRate >= 50 ? 'text-[#22c55e]' : 'text-[#ef4444]'}
                  >
                    {symbol.winRate.toFixed(1)}%
                  </span>
                </td>
                <td className="px-3 py-2.5 font-mono text-[11px] text-gray-500">
                  ${(symbol.volume / 1000).toFixed(1)}K
                </td>
                <td className="px-3 py-2.5 font-mono font-semibold text-[11px]">
                  <span className={symbol.pnl >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}>
                    {symbol.pnl >= 0 ? '+' : ''}${symbol.pnl.toFixed(2)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}