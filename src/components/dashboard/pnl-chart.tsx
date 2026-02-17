'use client';

import { TimeSeriesData } from '@/lib/analytics/metrics';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, ReferenceLine, ComposedChart, Line } from 'recharts';
import { format } from 'date-fns';

interface PnLChartProps {
  data: TimeSeriesData[];
  loading: boolean;
}

export function PnLChart({ data, loading }: PnLChartProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6 shadow">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4 animate-pulse" />
        <div className="h-80 bg-gray-100 rounded animate-pulse" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6 shadow">
        <h3 className="text-lg font-semibold mb-4">Cumulative PnL & Drawdown</h3>
        <div className="h-80 flex items-center justify-center text-gray-500">
          No trading data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow">
      <h3 className="text-lg font-semibold mb-4">Cumulative PnL & Drawdown</h3>
      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorPnl" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            tickFormatter={(date) => format(new Date(date), 'MMM dd')}
            stroke="#6b7280"
            fontSize={12}
          />
          <YAxis
            yAxisId="pnl"
            orientation="left"
            stroke="#6b7280"
            fontSize={12}
            tickFormatter={(value) => `$${value.toFixed(0)}`}
          />
          <YAxis
            yAxisId="drawdown"
            orientation="right"
            stroke="#ef4444"
            fontSize={12}
            tickFormatter={(value) => `$${value.toFixed(0)}`}
          />
          
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '12px',
            }}
            labelFormatter={(date) => format(new Date(date), 'MMM dd, yyyy')}
            formatter={(value, name) => [
              typeof value === 'number' ? `$${value.toFixed(2)}` : String(value ?? ''),
              name === 'drawdown' ? 'Drawdown' : name === 'cumulativePnl' ? 'Cumulative PnL' : name,
            ]}
          />






          <ReferenceLine yAxisId="pnl" y={0} stroke="#6b7280" strokeDasharray="3 3" />
          <Area
            yAxisId="pnl"
            type="monotone"
            dataKey="cumulativePnl"
            stroke="#10b981"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorPnl)"
            name="cumulativePnl"
          />
          <Line
            yAxisId="drawdown"
            type="monotone"
            dataKey="drawdown"
            stroke="#ef4444"
            strokeWidth={2}
            dot={false}
            name="drawdown"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}