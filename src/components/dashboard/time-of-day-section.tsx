'use client';

import { TimeOfDayBucket, SessionStats } from '@/lib/analytics/metrics';
import { Clock } from 'lucide-react';

interface TimeOfDaySectionProps {
  timeOfDayStats: TimeOfDayBucket[];
  sessionStats: SessionStats[];
  loading: boolean;
}

export function TimeOfDaySection({ timeOfDayStats, sessionStats, loading }: TimeOfDaySectionProps) {
  const card: React.CSSProperties = {
    background: '#111213', border: '1px solid #1e2022', borderRadius: 6,
    padding: 16, fontFamily: "'DM Mono', 'Courier New', monospace",
  };
  const label: React.CSSProperties = {
    fontSize: 9, color: '#3a3c40', letterSpacing: '0.14em',
    textTransform: 'uppercase', marginBottom: 14,
  };

  if (loading) {
    return (
      <div style={card}>
        <div style={{ background: '#1a1c1e', borderRadius: 4, width: '35%', height: 10, marginBottom: 16, animation: 'dv-pulse 1.4s ease-in-out infinite' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8 }}>
          {[...Array(8)].map((_, i) => (
            <div key={i} style={{ background: '#0c0d0e', borderRadius: 5, height: 64, animation: 'dv-pulse 1.4s ease-in-out infinite' }} />
          ))}
        </div>
      </div>
    );
  }

  const hasTime = timeOfDayStats.some((s) => s.trades > 0);
  const hasSession = sessionStats.some((s) => s.trades > 0);

  if (!hasTime && !hasSession) {
    return (
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
          <Clock size={12} color="#3a3c40" />
          <span style={label}>Time-based Performance</span>
        </div>
        <div style={{ fontSize: 11, color: '#252729' }}>No time-of-day or session data yet.</div>
      </div>
    );
  }

  const maxPnl = Math.max(...timeOfDayStats.map((b) => Math.abs(b.pnl)), 1);

  return (
    <>
      <style>{`
        @keyframes dv-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .dv-hour-cell { background:#0c0d0e; border:1px solid #1e2022; border-radius:5px; padding:10px 12px; position:relative; overflow:hidden; transition:border-color 0.15s; }
        .dv-hour-cell:hover { border-color:rgba(226,201,126,0.18); }
        .dv-hour-cell.empty { opacity:0.35; }
        .dv-session-row { background:#0c0d0e; border:1px solid #1e2022; border-radius:5px; padding:12px 14px; transition:border-color 0.15s; }
        .dv-session-row:hover { border-color:rgba(226,201,126,0.18); }
        .dv-winbar-track { height:2px; background:#1a1c1e; border-radius:2px; overflow:hidden; margin-top:10px; }
        .dv-winbar-fill { height:100%; border-radius:2px; transition:width 0.3s; }
      `}</style>
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 16 }}>
          <Clock size={12} color="#3a3c40" />
          <span style={{ ...label, marginBottom: 0 }}>Time-based Performance</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: hasTime && hasSession ? '1fr 1fr' : '1fr', gap: 20 }}>

          {/* Hour grid */}
          {hasTime && (
            <div>
              <div style={{ fontSize: 9, color: '#2e3033', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>By hour (UTC)</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: 6 }}>
                {timeOfDayStats.map((b) => {
                  const intensity = Math.abs(b.pnl) / maxPnl;
                  const pos = b.pnl >= 0;
                  const barColor = pos ? '#4ade80' : '#f87171';
                  return (
                    <div key={b.label} className={`dv-hour-cell${b.trades === 0 ? ' empty' : ''}`}>
                      {b.trades > 0 && (
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: barColor, opacity: 0.3 + intensity * 0.7 }} />
                      )}
                      <div style={{ fontSize: 10, color: '#3a3c40', marginBottom: 6 }}>{b.label}</div>
                      {b.trades > 0 ? (
                        <>
                          <div style={{ fontSize: 12, fontWeight: 500, color: barColor, marginBottom: 3 }}>
                            {pos ? '+' : ''}${b.pnl.toFixed(4)}
                          </div>
                          <div style={{ fontSize: 9, color: '#2e3033' }}>{b.trades}t · {b.winRate.toFixed(0)}%W</div>
                        </>
                      ) : (
                        <div style={{ fontSize: 10, color: '#252729' }}>No trades</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Session stats */}
          {hasSession && (
            <div>
              <div style={{ fontSize: 9, color: '#2e3033', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>By session</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {sessionStats.filter((s) => s.trades > 0).map((s) => {
                  const pos = s.pnl >= 0;
                  return (
                    <div key={s.session} className="dv-session-row">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontSize: 12, color: '#f0ebe0', fontWeight: 500, marginBottom: 3 }}>{s.session}</div>
                          <div style={{ fontSize: 9, color: '#2e3033' }}>{s.trades} trades</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: pos ? '#4ade80' : '#f87171', marginBottom: 3 }}>
                            {pos ? '+' : ''}${s.pnl.toFixed(4)}
                          </div>
                          <div style={{ fontSize: 9, color: '#2e3033' }}>{s.winRate.toFixed(0)}% win</div>
                        </div>
                      </div>
                      <div className="dv-winbar-track">
                        <div className="dv-winbar-fill" style={{ width: `${Math.min(s.winRate, 100)}%`, background: s.winRate >= 50 ? '#4ade80' : '#f87171' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}