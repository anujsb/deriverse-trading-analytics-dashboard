'use client';

import { TimeSeriesData } from '@/lib/analytics/metrics';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

interface FeeChartProps {
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
        <div key={p.name} style={{ fontSize: 11, color: p.color, marginBottom: 2 }}>
          {p.name === 'cumulativeFees' ? 'Cumulative' : 'Daily'}: ${Number(p.value).toFixed(5)}
        </div>
      ))}
    </div>
  );
};

export function FeeChart({ data, loading }: FeeChartProps) {
  const card: React.CSSProperties = {
    background: '#111213', border: '1px solid #1e2022', borderRadius: 6,
    padding: 16, fontFamily: "'DM Mono', 'Courier New', monospace",
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 9, color: '#3a3c40', letterSpacing: '0.14em',
    textTransform: 'uppercase', marginBottom: 14,
  };

  if (loading) {
    return (
      <div style={card}>
        <div style={{ background: '#1a1c1e', borderRadius: 4, width: '40%', height: 10, marginBottom: 16, animation: 'dv-pulse 1.4s ease-in-out infinite' }} />
        <div style={{ background: '#0c0d0e', borderRadius: 5, height: 220, animation: 'dv-pulse 1.4s ease-in-out infinite' }} />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div style={card}>
        <div style={labelStyle}>Cumulative Fees</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 220, fontSize: 11, color: '#252729' }}>
          No fee data available
        </div>
      </div>
    );
  }

  return (
    <div style={card}>
      <div style={labelStyle}>Cumulative Fees Over Time</div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="dvFeesGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#f87171" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#181a1c" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={(d) => format(new Date(d), 'MMM dd')}
            stroke="transparent"
            tick={{ fill: '#2e3033', fontFamily: "'DM Mono', monospace", fontSize: 9 }}
            axisLine={false} tickLine={false}
          />
          <YAxis
            stroke="transparent"
            tick={{ fill: '#2e3033', fontFamily: "'DM Mono', monospace", fontSize: 9 }}
            tickFormatter={(v) => `$${v.toFixed(3)}`}
            axisLine={false} tickLine={false} width={54}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone" dataKey="cumulativeFees"
            stroke="#f87171" strokeWidth={1.5}
            fill="url(#dvFeesGrad)" fillOpacity={1}
            name="cumulativeFees"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}