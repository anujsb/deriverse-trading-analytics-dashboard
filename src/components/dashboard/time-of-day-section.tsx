'use client';

import { TimeOfDayBucket, SessionStats } from '@/lib/analytics/metrics';
import { Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface TimeOfDaySectionProps {
  timeOfDayStats: TimeOfDayBucket[];
  sessionStats: SessionStats[];
  loading: boolean;
}

export function TimeOfDaySection({ timeOfDayStats, sessionStats, loading }: TimeOfDaySectionProps) {
  if (loading) {
    return (
      <Card className="bg-[#0d1117] p-5 border-[#1e2a3a] rounded-xl">
        <div className="bg-[#1e2a3a] mb-4 rounded w-1/3 h-4 animate-pulse" />
        <div className="gap-2 grid grid-cols-2 md:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-[#080d13] rounded-lg h-16 animate-pulse" />
          ))}
        </div>
      </Card>
    );
  }

  const hasTime = timeOfDayStats.some((s) => s.trades > 0);
  const hasSession = sessionStats.some((s) => s.trades > 0);

  if (!hasTime && !hasSession) {
    return (
      <Card className="bg-[#0d1117] p-5 border-[#1e2a3a] rounded-xl">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-3.5 h-3.5 text-gray-500" />
          <p className="font-mono font-semibold text-[10px] text-gray-500 uppercase tracking-widest">
            Time-based Performance
          </p>
        </div>
        <p className="font-mono text-gray-600 text-sm">No time-of-day or session data yet.</p>
      </Card>
    );
  }

  // Find max absolute PnL for intensity scaling
  const maxPnl = Math.max(...timeOfDayStats.map((b) => Math.abs(b.pnl)), 1);

  return (
    <Card className="bg-[#0d1117] p-5 border-[#1e2a3a] rounded-xl">
      <div className="flex items-center gap-2 mb-5">
        <Clock className="w-3.5 h-3.5 text-gray-500" />
        <p className="font-mono font-semibold text-[10px] text-gray-500 uppercase tracking-widest">
          Time-based Performance
        </p>
      </div>

      <div className="gap-6 grid grid-cols-1 lg:grid-cols-2">
        {/* Hour grid */}
        {hasTime && (
          <div>
            <p className="mb-3 font-mono text-[10px] text-gray-600 uppercase tracking-widest">
              By hour (UTC)
            </p>
            <div className="gap-2 grid grid-cols-2 sm:grid-cols-3">
              {timeOfDayStats.map((b) => {
                const intensity = Math.abs(b.pnl) / maxPnl;
                const isPositive = b.pnl >= 0;
                return (
                  <div
                    key={b.label}
                    className={cn(
                      'relative p-3 border hover:border-[#2a3a4a] rounded-lg overflow-hidden transition-colors',
                      b.trades === 0
                        ? 'border-[#1e2a3a] bg-[#080d13] opacity-40'
                        : 'border-[#1e2a3a] bg-[#080d13]'
                    )}
                  >
                    {/* intensity bar */}
                    {b.trades > 0 && (
                      <div
                        className={cn(
                          'right-0 bottom-0 left-0 absolute h-0.5',
                          isPositive ? 'bg-[#22c55e]' : 'bg-[#ef4444]'
                        )}
                        style={{ opacity: 0.4 + intensity * 0.6 }}
                      />
                    )}
                    <p className="font-mono font-semibold text-[10px] text-gray-400 leading-none">
                      {b.label}
                    </p>
                    {b.trades > 0 ? (
                      <>
                        <p
                          className={cn(
                            'mt-1.5 font-mono font-bold text-[12px] leading-none',
                            isPositive ? 'text-[#22c55e]' : 'text-[#ef4444]'
                          )}
                        >
                          {isPositive ? '+' : ''}${b.pnl.toFixed(2)}
                        </p>
                        <p className="mt-1 font-mono text-[9px] text-gray-600">
                          {b.trades}t · {b.winRate.toFixed(0)}%W
                        </p>
                      </>
                    ) : (
                      <p className="mt-1.5 font-mono text-[10px] text-gray-700">No trades</p>
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
            <p className="mb-3 font-mono text-[10px] text-gray-600 uppercase tracking-widest">
              By session
            </p>
            <div className="flex flex-col gap-2">
              {sessionStats
                .filter((s) => s.trades > 0)
                .map((s) => {
                  const isPositive = s.pnl >= 0;
                  return (
                    <div
                      key={s.session}
                      className="bg-[#080d13] px-4 py-3 border border-[#1e2a3a] hover:border-[#2a3a4a] rounded-lg transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-mono font-semibold text-[12px] text-gray-200 leading-none">
                            {s.session}
                          </p>
                          <p className="mt-1 font-mono text-[10px] text-gray-600">
                            {s.trades} trades
                          </p>
                        </div>
                        <div className="text-right">
                          <p
                            className={cn(
                              'font-mono font-bold text-[13px] leading-none',
                              isPositive ? 'text-[#22c55e]' : 'text-[#ef4444]'
                            )}
                          >
                            {isPositive ? '+' : ''}${s.pnl.toFixed(2)}
                          </p>
                          <p className="mt-1 font-mono text-[10px] text-gray-600">
                            {s.winRate.toFixed(0)}% win rate
                          </p>
                        </div>
                      </div>
                      {/* Win rate bar */}
                      <div className="bg-[#1e2a3a] mt-2.5 rounded-full h-1 overflow-hidden">
                        <div
                          className={cn(
                            'rounded-full h-full transition-all',
                            s.winRate >= 50 ? 'bg-[#22c55e]' : 'bg-[#ef4444]'
                          )}
                          style={{ width: `${Math.min(s.winRate, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}