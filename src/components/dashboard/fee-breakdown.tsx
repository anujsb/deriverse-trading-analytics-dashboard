'use client';

import { FeeBreakdownItem, OrderTypeStat } from '@/lib/analytics/metrics';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/card';

interface FeeBreakdownProps {
  feeBreakdown: FeeBreakdownItem[];
  orderTypeStats: OrderTypeStat[];
  loading: boolean;
}

const COLORS = ['#f0b429', '#22c55e', '#3b82f6', '#ef4444', '#a855f7'];

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0d1117] shadow-xl px-3 py-2 border border-[#1e2a3a] rounded-lg">
      <p className="font-mono text-[11px] text-gray-300">
        {payload[0].name}: {Number(payload[0].value).toFixed(1)}%
      </p>
    </div>
  );
};

export function FeeBreakdown({ feeBreakdown, orderTypeStats, loading }: FeeBreakdownProps) {
  if (loading) {
    return (
      <Card className="bg-[#0d1117] p-5 border-[#1e2a3a] rounded-xl">
        <div className="bg-[#1e2a3a] mb-4 rounded w-1/3 h-4 animate-pulse" />
        <div className="bg-[#080d13] rounded-lg h-52 animate-pulse" />
      </Card>
    );
  }

  const hasFees = feeBreakdown.length > 0;
  const hasOrderTypes = orderTypeStats.some((s) => s.trades > 0);

  if (!hasFees && !hasOrderTypes) {
    return (
      <Card className="bg-[#0d1117] p-5 border-[#1e2a3a] rounded-xl">
        <p className="mb-4 font-mono font-semibold text-[10px] text-gray-500 uppercase tracking-widest">
          Fee & Order Type
        </p>
        <p className="font-mono text-gray-600 text-sm">No fee breakdown or order type data yet.</p>
      </Card>
    );
  }

  const pieData = feeBreakdown.map((f, i) => ({
    name: f.label,
    value: f.percentage,
    color: COLORS[i % COLORS.length],
    amount: f.amount,
  }));

  return (
    <Card className="bg-[#0d1117] p-5 border-[#1e2a3a] rounded-xl">
      <p className="mb-5 font-mono font-semibold text-[10px] text-gray-500 uppercase tracking-widest">
        Fee Composition & Order Types
      </p>

      <div className="gap-6 grid grid-cols-1 md:grid-cols-2">
        {/* Pie + legend */}
        {hasFees && (
          <div>
            <p className="mb-3 font-mono text-[10px] text-gray-600 uppercase tracking-widest">
              Fee breakdown
            </p>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={120} height={120}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={36}
                    outerRadius={55}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                    strokeWidth={0}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              <div className="flex flex-col gap-2">
                {pieData.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <span
                      className="flex-shrink-0 rounded-full w-2 h-2"
                      style={{ background: entry.color }}
                    />
                    <div>
                      <p className="font-mono text-[11px] text-gray-300 leading-none">{entry.name}</p>
                      <p className="mt-0.5 font-mono text-[10px] text-gray-600">
                        ${entry.amount.toFixed(4)} · {entry.value.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Order type stats */}
        {hasOrderTypes && (
          <div>
            <p className="mb-3 font-mono text-[10px] text-gray-600 uppercase tracking-widest">
              Order type performance
            </p>
            <div className="flex flex-col gap-2">
              {orderTypeStats
                .filter((s) => s.trades > 0)
                .map((s) => (
                  <div
                    key={s.orderType}
                    className="group flex justify-between items-center bg-[#080d13] px-3 py-2.5 border border-[#1e2a3a] hover:border-[#2a3a4a] rounded-lg transition-colors"
                  >
                    <span className="font-mono font-semibold text-[11px] text-gray-200">
                      {s.orderType}
                    </span>
                    <span className="font-mono text-[10px] text-gray-600">
                      {s.trades} trades
                    </span>
                    <div className="text-right">
                      <p
                        className={`font-mono text-[11px] font-semibold leading-none ${
                          s.pnl >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'
                        }`}
                      >
                        {s.pnl >= 0 ? '+' : ''}${s.pnl.toFixed(2)}
                      </p>
                      <p className="mt-0.5 font-mono text-[10px] text-gray-600">
                        {s.winRate.toFixed(0)}% win
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}