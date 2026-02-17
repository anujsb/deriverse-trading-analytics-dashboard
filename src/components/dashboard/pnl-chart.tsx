'use client';

import { TimeSeriesData } from '@/lib/analytics/metrics';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ReferenceLine,
  ComposedChart,
  Line,
} from 'recharts';
import { format } from 'date-fns';
import { Card } from '@/components/ui/card';

interface PnLChartProps {
  data: TimeSeriesData[];
  loading: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0d1117] shadow-xl px-3 py-2.5 border border-[#1e2a3a] rounded-lg">
      <p className="mb-1.5 font-mono text-[10px] text-gray-500">
        {format(new Date(label), 'MMM dd, yyyy')}
      </p>
      {payload.map((p: any) => (
        <p key={p.name} className="font-mono text-[11px]" style={{ color: p.color }}>
          {p.name === 'cumulativePnl' ? 'PnL' : 'Drawdown'}: ${Number(p.value).toFixed(2)}
        </p>
      ))}
    </div>
  );
};

export function PnLChart({ data, loading }: PnLChartProps) {
  if (loading) {
    return (
      <Card className="bg-[#0d1117] p-5 border-[#1e2a3a] rounded-xl">
        <div className="bg-[#1e2a3a] mb-4 rounded w-1/3 h-4 animate-pulse" />
        <div className="bg-[#080d13] rounded-lg h-72 animate-pulse" />
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="bg-[#0d1117] p-5 border-[#1e2a3a] rounded-xl">
        <p className="mb-4 font-mono font-semibold text-[10px] text-gray-500 uppercase tracking-widest">
          Cumulative PnL & Drawdown
        </p>
        <div className="flex justify-center items-center h-72 font-mono text-gray-600 text-sm">
          No trading data available
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-[#0d1117] p-5 border-[#1e2a3a] rounded-xl">
      <div className="flex justify-between items-center mb-5">
        <p className="font-mono font-semibold text-[10px] text-gray-500 uppercase tracking-widest">
          Cumulative PnL & Drawdown
        </p>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="inline-block bg-[#f0b429] rounded w-3 h-0.5" />
            <span className="font-mono text-[10px] text-gray-500">PnL</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block bg-[#ef4444] rounded w-3 h-0.5" />
            <span className="font-mono text-[10px] text-gray-500">Drawdown</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorPnlDark" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f0b429" stopOpacity={0.18} />
              <stop offset="95%" stopColor="#f0b429" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={(date) => format(new Date(date), 'MMM dd')}
            stroke="#2a3a4a"
            tick={{ fill: '#4b5563', fontFamily: 'monospace', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            yAxisId="pnl"
            orientation="left"
            stroke="#2a3a4a"
            tick={{ fill: '#4b5563', fontFamily: 'monospace', fontSize: 10 }}
            tickFormatter={(value) => `$${value.toFixed(0)}`}
            axisLine={false}
            tickLine={false}
            width={60}
          />
          <YAxis
            yAxisId="drawdown"
            orientation="right"
            stroke="#2a3a4a"
            tick={{ fill: '#4b5563', fontFamily: 'monospace', fontSize: 10 }}
            tickFormatter={(value) => `$${value.toFixed(0)}`}
            axisLine={false}
            tickLine={false}
            width={60}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine yAxisId="pnl" y={0} stroke="#2a3a4a" strokeDasharray="4 4" />
          <Area
            yAxisId="pnl"
            type="monotone"
            dataKey="cumulativePnl"
            stroke="#f0b429"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorPnlDark)"
            name="cumulativePnl"
          />
          <Line
            yAxisId="drawdown"
            type="monotone"
            dataKey="drawdown"
            stroke="#ef4444"
            strokeWidth={1.5}
            dot={false}
            name="drawdown"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </Card>
  );
}