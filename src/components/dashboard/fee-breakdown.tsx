'use client';

import { FeeBreakdownItem, OrderTypeStat } from '@/lib/analytics/metrics';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface FeeBreakdownProps {
  feeBreakdown: FeeBreakdownItem[];
  orderTypeStats: OrderTypeStat[];
  loading: boolean;
}

const COLORS = ['#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#6366f1'];

export function FeeBreakdown({ feeBreakdown, orderTypeStats, loading }: FeeBreakdownProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6 shadow">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4 animate-pulse" />
        <div className="h-48 bg-gray-100 rounded animate-pulse" />
      </div>
    );
  }

  const hasFees = feeBreakdown.length > 0;
  const hasOrderTypes = orderTypeStats.some((s) => s.trades > 0);

  if (!hasFees && !hasOrderTypes) {
    return (
      <div className="bg-white rounded-lg p-6 shadow">
        <h3 className="text-lg font-semibold mb-4">Fee & Order Type</h3>
        <p className="text-gray-500 text-sm">No fee breakdown or order type data yet.</p>
      </div>
    );
  }

  const pieData = feeBreakdown.map((f, i) => ({
    name: f.label,
    value: f.percentage,
    color: COLORS[i % COLORS.length],
  }));

  return (
    <div className="bg-white rounded-lg p-6 shadow">
      <h3 className="text-lg font-semibold mb-4">Fee Composition & Order Type</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {hasFees && (
          <div>
            <h4 className="text-sm font-medium text-gray-600 mb-2">Fee breakdown</h4>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, value }) => `${name} ${value.toFixed(0)}%`}
                >
                  {pieData.map((entry, i) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value?: number) =>
                    typeof value === 'number' ? `${value.toFixed(1)}%` : ''
                  }
                />
              </PieChart>
            </ResponsiveContainer>
            <ul className="mt-2 space-y-1 text-sm text-gray-600">
              {feeBreakdown.map((f) => (
                <li key={f.label}>
                  {f.label}: ${f.amount.toFixed(4)} ({f.percentage.toFixed(1)}%)
                </li>
              ))}
            </ul>
          </div>
        )}
        {hasOrderTypes && (
          <div>
            <h4 className="text-sm font-medium text-gray-600 mb-2">Order type performance</h4>
            <div className="space-y-2">
              {orderTypeStats.map((s) => (
                <div
                  key={s.orderType}
                  className="flex items-center justify-between p-2 rounded border border-gray-100"
                >
                  <span className="font-medium">{s.orderType}</span>
                  <span className="text-gray-500 text-sm">{s.trades} trades</span>
                  <span className={`text-sm ${s.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {s.pnl >= 0 ? '+' : ''}${s.pnl.toFixed(2)} · {s.winRate.toFixed(0)}% win
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
