'use client';

import { FeeBreakdownItem, OrderTypeStat } from '@/lib/analytics/metrics';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface FeeBreakdownProps {
  feeBreakdown: FeeBreakdownItem[];
  orderTypeStats: OrderTypeStat[];
  loading: boolean;
}

// Gold-adjacent palette that stays within the Deriverse system
const SLICE_COLORS = ['#e2c97e', '#4ade80', '#a0a8b8', '#f87171', '#b0a898'];

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#0e0f10', border: '1px solid #1e2022', borderRadius: 5, padding: '8px 12px', fontFamily: "'DM Mono', monospace" }}>
      <div style={{ fontSize: 11, color: '#b0a898' }}>
        {payload[0].name}: {Number(payload[0].value).toFixed(1)}%
      </div>
    </div>
  );
};

export function FeeBreakdown({ feeBreakdown, orderTypeStats, loading }: FeeBreakdownProps) {
  const card: React.CSSProperties = {
    background: '#111213', border: '1px solid #1e2022', borderRadius: 6,
    padding: 16, fontFamily: "'DM Mono', 'Courier New', monospace",
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 9, color: '#3a3c40', letterSpacing: '0.14em',
    textTransform: 'uppercase', marginBottom: 14,
  };
  const subLabel: React.CSSProperties = {
    fontSize: 9, color: '#2e3033', letterSpacing: '0.1em',
    textTransform: 'uppercase', marginBottom: 10,
  };

  if (loading) {
    return (
      <div style={card}>
        <div style={{ background: '#1a1c1e', borderRadius: 4, width: '40%', height: 10, marginBottom: 16, animation: 'dv-pulse 1.4s ease-in-out infinite' }} />
        <div style={{ background: '#0c0d0e', borderRadius: 5, height: 220, animation: 'dv-pulse 1.4s ease-in-out infinite' }} />
      </div>
    );
  }

  const hasFees = feeBreakdown.length > 0;
  const hasOrderTypes = orderTypeStats.some((s) => s.trades > 0);

  if (!hasFees && !hasOrderTypes) {
    return (
      <div style={card}>
        <div style={labelStyle}>Fee &amp; Order Type</div>
        <div style={{ fontSize: 11, color: '#252729' }}>No fee breakdown or order type data yet.</div>
      </div>
    );
  }

  const pieData = feeBreakdown.map((f, i) => ({
    name: f.label,
    value: f.percentage,
    color: SLICE_COLORS[i % SLICE_COLORS.length],
    amount: f.amount,
  }));

  return (
    <>
      <style>{`
        .dv-order-row { background:#0c0d0e; border:1px solid #1e2022; border-radius:5px; padding:10px 14px; display:flex; justify-content:space-between; align-items:center; transition:border-color 0.15s; }
        .dv-order-row:hover { border-color:rgba(226,201,126,0.18); }
      `}</style>
      <div style={card}>
        <div style={labelStyle}>Fee Composition &amp; Order Types</div>

        <div style={{ display: 'grid', gridTemplateColumns: hasFees && hasOrderTypes ? '1fr 1fr' : '1fr', gap: 20 }}>

          {/* Pie + legend */}
          {hasFees && (
            <div>
              <div style={subLabel}>Fee breakdown</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <ResponsiveContainer width={110} height={110}>
                  <PieChart>
                    <Pie
                      data={pieData} cx="50%" cy="50%"
                      innerRadius={32} outerRadius={52}
                      paddingAngle={3} dataKey="value"
                      nameKey="name" strokeWidth={0}
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {pieData.map((entry) => (
                    <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: entry.color, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 11, color: '#b0a898', marginBottom: 2 }}>{entry.name}</div>
                        <div style={{ fontSize: 9, color: '#2e3033' }}>
                          ${entry.amount.toFixed(5)} · {entry.value.toFixed(1)}%
                        </div>
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
              <div style={subLabel}>Order type performance</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {orderTypeStats.filter((s) => s.trades > 0).map((s) => (
                  <div key={s.orderType} className="dv-order-row">
                    <span style={{ fontSize: 11, color: '#f0ebe0', fontWeight: 500 }}>{s.orderType}</span>
                    <span style={{ fontSize: 10, color: '#2e3033' }}>{s.trades} trades</span>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, fontWeight: 500, color: s.pnl >= 0 ? '#4ade80' : '#f87171', marginBottom: 2 }}>
                        {s.pnl >= 0 ? '+' : ''}${s.pnl.toFixed(4)}
                      </div>
                      <div style={{ fontSize: 9, color: '#2e3033' }}>{s.winRate.toFixed(0)}% win</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}