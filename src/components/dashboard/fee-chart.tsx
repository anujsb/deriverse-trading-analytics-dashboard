'use client';

import { TimeSeriesData } from '@/lib/analytics/metrics';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { Card } from '@/components/ui/card';

interface FeeChartProps {
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
          {p.name === 'cumulativeFees' ? 'Cumulative' : 'Daily'}: ${Number(p.value).toFixed(4)}
        </p>
      ))}
    </div>
  );
};

export function FeeChart({ data, loading }: FeeChartProps) {
  if (loading) {
    return (
      <Card className="bg-[#0d1117] p-5 border-[#1e2a3a] rounded-xl">
        <div className="bg-[#1e2a3a] mb-4 rounded w-1/3 h-4 animate-pulse" />
        <div className="bg-[#080d13] rounded-lg h-52 animate-pulse" />
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="bg-[#0d1117] p-5 border-[#1e2a3a] rounded-xl">
        <p className="mb-4 font-mono font-semibold text-[10px] text-gray-500 uppercase tracking-widest">
          Cumulative Fees
        </p>
        <div className="flex justify-center items-center h-52 font-mono text-gray-600 text-sm">
          No fee data
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-[#0d1117] p-5 border-[#1e2a3a] rounded-xl">
      <p className="mb-5 font-mono font-semibold text-[10px] text-gray-500 uppercase tracking-widest">
        Cumulative Fees Over Time
      </p>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorFeesDark" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
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
            stroke="#2a3a4a"
            tick={{ fill: '#4b5563', fontFamily: 'monospace', fontSize: 10 }}
            tickFormatter={(v) => `$${v.toFixed(2)}`}
            axisLine={false}
            tickLine={false}
            width={56}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="cumulativeFees"
            stroke="#ef4444"
            strokeWidth={1.5}
            fill="url(#colorFeesDark)"
            fillOpacity={1}
            name="cumulativeFees"
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}