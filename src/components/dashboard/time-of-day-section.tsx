'use client';

import { TimeOfDayBucket, SessionStats } from '@/lib/analytics/metrics';
import { Clock } from 'lucide-react';

interface TimeOfDaySectionProps {
  timeOfDayStats: TimeOfDayBucket[];
  sessionStats: SessionStats[];
  loading: boolean;
}

export function TimeOfDaySection({ timeOfDayStats, sessionStats, loading }: TimeOfDaySectionProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6 shadow">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4 animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const hasTime = timeOfDayStats.some((s) => s.trades > 0);
  const hasSession = sessionStats.some((s) => s.trades > 0);
  if (!hasTime && !hasSession) {
    return (
      <div className="bg-white rounded-lg p-6 shadow">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" /> Time-based Performance
        </h3>
        <p className="text-gray-500 text-sm">No time-of-day or session data yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Clock className="w-5 h-5" /> Time-based Performance
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-sm font-medium text-gray-600 mb-2">By hour (UTC)</h4>
          <div className="grid grid-cols-2 gap-2">
            {timeOfDayStats.map((b) => (
              <div
                key={b.label}
                className="p-3 rounded-lg border border-gray-100 bg-gray-50/50"
              >
                <span className="font-medium text-gray-900">{b.label}</span>
                <span className="text-gray-500 text-sm ml-1">({b.trades} trades)</span>
                <p className={`text-sm mt-1 ${b.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {b.pnl >= 0 ? '+' : ''}${b.pnl.toFixed(2)} · Win {b.winRate.toFixed(0)}%
                </p>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-600 mb-2">By session</h4>
          <div className="space-y-2">
            {sessionStats.map((s) => (
              <div
                key={s.session}
                className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gray-50/50"
              >
                <span className="font-medium text-gray-900">{s.session}</span>
                <span className="text-gray-500 text-sm">{s.trades} trades</span>
                <span className={`text-sm font-medium ${s.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {s.pnl >= 0 ? '+' : ''}${s.pnl.toFixed(2)} · {s.winRate.toFixed(0)}% win
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
