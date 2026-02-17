'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink,
  StickyNote,
  X,
} from 'lucide-react';

interface Trade {
  signature: string;
  timestamp: Date | string;
  type: 'LONG' | 'SHORT';
  symbol: string;
  entryPrice: string;
  exitPrice: string | null;
  size: string;
  pnl: string | null;
  fee: string;
  status: 'OPEN' | 'CLOSED';
}

interface TradeHistoryProps {
  trades: Trade[];
  loading: boolean;
  userId?: string | null;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export function TradeHistory({
  trades,
  loading,
  userId,
  onLoadMore,
  hasMore,
}: TradeHistoryProps) {
  const [selectedTrade, setSelectedTrade] = useState<string | null>(null);
  const [annotationNote, setAnnotationNote] = useState('');
  const [annotationLoading, setAnnotationLoading] = useState(false);
  const [annotationSaving, setAnnotationSaving] = useState(false);

  useEffect(() => {
    if (!selectedTrade || !userId) return;
    setAnnotationLoading(true);
    fetch(`/api/trades/${encodeURIComponent(selectedTrade)}/annotation?userId=${encodeURIComponent(userId)}`)
      .then((r) => r.json())
      .then((data) => {
        setAnnotationNote(data?.note ?? '');
      })
      .catch(() => setAnnotationNote(''))
      .finally(() => setAnnotationLoading(false));
  }, [selectedTrade, userId]);

  const handleSaveAnnotation = async () => {
    if (!selectedTrade || !userId) return;
    setAnnotationSaving(true);
    try {
      const res = await fetch(`/api/trades/${encodeURIComponent(selectedTrade)}/annotation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, note: annotationNote }),
      });
      if (res.ok) setSelectedTrade(null);
    } finally {
      setAnnotationSaving(false);
    }
  };

  const safeParse = (value: string | null | undefined) =>
    value ? parseFloat(value) : 0;

  if (loading && trades.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6 shadow">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4 animate-pulse"></div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow">

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Trade History</h3>
        <p className="text-sm text-gray-500">{trades.length} trades</p>
      </div>


      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Symbol</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Entry</th>
              <th className="px-4 py-3">Exit</th>
              <th className="px-4 py-3">Size</th>
              <th className="px-4 py-3">PnL</th>
              <th className="px-4 py-3">Fee</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {trades.map((trade) => {
              const pnl = safeParse(trade.pnl);
              const isProfitable = pnl > 0;

              return (
                <tr
                  key={trade.signature}
                  className="hover:bg-gray-50 transition-colors"
                >
                  {/* Date */}
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {format(new Date(trade.timestamp), 'MMM dd, HH:mm')}
                  </td>


                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {trade.symbol}
                  </td>


                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {trade.type === 'LONG' ? (
                        <ArrowUpRight className="w-4 h-4 text-green-600" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-red-600" />
                      )}
                      <span
                        className={`text-sm font-medium ${
                          trade.type === 'LONG'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {trade.type}
                      </span>
                    </div>
                  </td>


                  <td className="px-4 py-3 text-sm text-gray-900">
                    ${safeParse(trade.entryPrice).toFixed(2)}
                  </td>


                  <td className="px-4 py-3 text-sm text-gray-900">
                    {trade.exitPrice
                      ? `$${safeParse(trade.exitPrice).toFixed(2)}`
                      : '-'}
                  </td>


                  <td className="px-4 py-3 text-sm text-gray-900">
                    {safeParse(trade.size).toFixed(4)}
                  </td>


                  <td className="px-4 py-3">
                    {trade.pnl ? (
                      <span
                        className={`text-sm font-semibold ${
                          isProfitable
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {isProfitable ? '+' : ''}
                        ${pnl.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>


                  <td className="px-4 py-3 text-sm text-gray-500">
                    ${safeParse(trade.fee).toFixed(4)}
                  </td>


                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        trade.status === 'CLOSED'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {trade.status}
                    </span>
                  </td>


                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => userId && setSelectedTrade(trade.signature)}
                        className={`${userId ? 'text-gray-400 hover:text-gray-600' : 'text-gray-300 cursor-not-allowed'}`}
                        title={userId ? 'Add note' : 'Connect wallet to add notes'}
                      >
                        <StickyNote className="w-4 h-4" />
                      </button>

                      <a
                        href={`https://solscan.io/tx/${trade.signature}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-gray-600"
                        title="View on Solscan"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>


      {hasMore && (
        <div className="mt-4 text-center">
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}


      {selectedTrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setSelectedTrade(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold">Trade note</h4>
              <button onClick={() => setSelectedTrade(null)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            {annotationLoading ? (
              <p className="text-gray-500">Loading...</p>
            ) : (
              <>
                <textarea
                  value={annotationNote}
                  onChange={(e) => setAnnotationNote(e.target.value)}
                  placeholder="Add a note for this trade..."
                  className="w-full border border-gray-300 rounded-lg p-3 min-h-[120px] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                />
                <div className="mt-4 flex gap-2 justify-end">
                  <button
                    onClick={() => setSelectedTrade(null)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveAnnotation}
                    disabled={annotationSaving}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {annotationSaving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
