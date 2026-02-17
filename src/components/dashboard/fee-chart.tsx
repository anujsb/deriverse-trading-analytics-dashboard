'use client';

import { TimeSeriesData } from '@/lib/analytics/metrics';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

interface FeeChartProps {
  data: TimeSeriesData[];
  loading: boolean;
}

export function FeeChart({ data, loading }: FeeChartProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6 shadow">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4 animate-pulse" />
        <div className="h-48 bg-gray-100 rounded animate-pulse" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6 shadow">
        <h3 className="text-lg font-semibold mb-4">Cumulative Fees</h3>
        <div className="h-48 flex items-center justify-center text-gray-500">No fee data</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow">
      <h3 className="text-lg font-semibold mb-4">Cumulative Fees Over Time</h3>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorFees" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            tickFormatter={(date) => format(new Date(date), 'MMM dd')}
            stroke="#6b7280"
            fontSize={12}
          />
          <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(v) => `$${v.toFixed(4)}`} />
          <Tooltip
            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px' }}
            labelFormatter={(date) => format(new Date(date as string), 'MMM dd, yyyy')}
            formatter={(value, name) => [
              typeof value === 'number' ? `$${value.toFixed(4)}` : String(value),
              name === 'cumulativeFees' ? 'Cumulative' : name === 'dailyFees' ? 'Daily' : name,
            ]}
          />
          <Area
            type="monotone"
            dataKey="cumulativeFees"
            stroke="#8b5cf6"
            strokeWidth={2}
            fill="url(#colorFees)"
            fillOpacity={1}
            name="cumulativeFees"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
