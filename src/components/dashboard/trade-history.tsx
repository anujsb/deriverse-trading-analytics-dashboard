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
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

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
    fetch(
      `/api/trades/${encodeURIComponent(selectedTrade)}/annotation?userId=${encodeURIComponent(userId)}`
    )
      .then((r) => r.json())
      .then((data) => setAnnotationNote(data?.note ?? ''))
      .catch(() => setAnnotationNote(''))
      .finally(() => setAnnotationLoading(false));
  }, [selectedTrade, userId]);

  const handleSaveAnnotation = async () => {
    if (!selectedTrade || !userId) return;
    setAnnotationSaving(true);
    try {
      const res = await fetch(
        `/api/trades/${encodeURIComponent(selectedTrade)}/annotation`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, note: annotationNote }),
        }
      );
      if (res.ok) setSelectedTrade(null);
    } finally {
      setAnnotationSaving(false);
    }
  };

  const safeParse = (value: string | null | undefined) =>
    value ? parseFloat(value) : 0;

  if (loading && trades.length === 0) {
    return (
      <Card className="bg-[#0d1117] p-5 border-[#1e2a3a] rounded-xl">
        <div className="bg-[#1e2a3a] mb-4 rounded w-1/4 h-4 animate-pulse" />
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-[#080d13] rounded-lg h-12 animate-pulse" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-[#0d1117] p-5 border-[#1e2a3a] rounded-xl">
        <div className="flex justify-between items-center mb-5">
          <p className="font-mono font-semibold text-[10px] text-gray-500 uppercase tracking-widest">
            Trade History
          </p>
          <span className="bg-[#080d13] px-2.5 py-1 border border-[#1e2a3a] rounded-full font-mono text-[10px] text-gray-600">
            {trades.length} trades
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                {['Date', 'Symbol', 'Type', 'Entry', 'Exit', 'Size', 'PnL', 'Fee', 'Status', ''].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-3 py-2 border-[#1e2a3a] border-b font-mono font-semibold text-[9px] text-gray-600 text-left uppercase tracking-widest"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>

            <tbody>
              {trades.map((trade) => {
                const pnl = safeParse(trade.pnl);
                const isProfitable = pnl > 0;

                return (
                  <tr
                    key={trade.signature}
                    className="group hover:bg-[#1e2a3a]/20 border-[#1e2a3a]/40 border-b transition-colors"
                  >
                    {/* Date */}
                    <td className="px-3 py-2.5 font-mono text-[11px] text-gray-500 whitespace-nowrap">
                      {format(new Date(trade.timestamp), 'MMM dd, HH:mm')}
                    </td>

                    {/* Symbol */}
                    <td className="px-3 py-2.5 font-mono font-semibold text-[11px] text-gray-200">
                      {trade.symbol}
                    </td>

                    {/* Type */}
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1">
                        {trade.type === 'LONG' ? (
                          <ArrowUpRight className="w-3.5 h-3.5 text-[#22c55e]" />
                        ) : (
                          <ArrowDownRight className="w-3.5 h-3.5 text-[#ef4444]" />
                        )}
                        <span
                          className={cn(
                            'font-mono font-bold text-[10px]',
                            trade.type === 'LONG' ? 'text-[#22c55e]' : 'text-[#ef4444]'
                          )}
                        >
                          {trade.type}
                        </span>
                      </div>
                    </td>

                    {/* Entry */}
                    <td className="px-3 py-2.5 font-mono text-[11px] text-gray-300">
                      ${safeParse(trade.entryPrice).toFixed(2)}
                    </td>

                    {/* Exit */}
                    <td className="px-3 py-2.5 font-mono text-[11px] text-gray-400">
                      {trade.exitPrice
                        ? `$${safeParse(trade.exitPrice).toFixed(2)}`
                        : '—'}
                    </td>

                    {/* Size */}
                    <td className="px-3 py-2.5 font-mono text-[11px] text-gray-400">
                      {safeParse(trade.size).toFixed(4)}
                    </td>

                    {/* PnL */}
                    <td className="px-3 py-2.5">
                      {trade.pnl ? (
                        <span
                          className={cn(
                            'font-mono font-bold text-[11px]',
                            isProfitable ? 'text-[#22c55e]' : 'text-[#ef4444]'
                          )}
                        >
                          {isProfitable ? '+' : ''}${pnl.toFixed(2)}
                        </span>
                      ) : (
                        <span className="font-mono text-[11px] text-gray-600">—</span>
                      )}
                    </td>

                    {/* Fee */}
                    <td className="px-3 py-2.5 font-mono text-[11px] text-gray-600">
                      ${safeParse(trade.fee).toFixed(4)}
                    </td>

                    {/* Status */}
                    <td className="px-3 py-2.5">
                      <span
                        className={cn(
                          'inline-flex items-center px-2 py-0.5 border rounded font-mono font-semibold text-[9px] uppercase tracking-wider',
                          trade.status === 'CLOSED'
                            ? 'bg-[#1e2a3a] text-gray-500 border-[#2a3a4a]'
                            : 'bg-[#f0b429]/10 text-[#f0b429] border-[#f0b429]/20'
                        )}
                      >
                        {trade.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => userId && setSelectedTrade(trade.signature)}
                          className={cn(
                            'transition-colors',
                            userId
                              ? 'text-gray-600 hover:text-[#f0b429]'
                              : 'text-gray-700 cursor-not-allowed'
                          )}
                          title={userId ? 'Add note' : 'Connect wallet to add notes'}
                        >
                          <StickyNote className="w-3.5 h-3.5" />
                        </button>
                        <a
                          href={`https://solscan.io/tx/${trade.signature.split('#')[0]}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-600 hover:text-[#3b82f6] transition-colors"
                          title="View on Solscan"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
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
          <div className="mt-5 text-center">
            <Button
              onClick={onLoadMore}
              disabled={loading}
              variant="outline"
              className="bg-[#080d13] hover:bg-[#1e2a3a] border-[#1e2a3a] font-mono text-gray-400 hover:text-gray-200 text-xs"
            >
              {loading ? 'Loading...' : 'Load more'}
            </Button>
          </div>
        )}
      </Card>

      {/* Annotation Dialog */}
      <Dialog open={!!selectedTrade} onOpenChange={(open) => !open && setSelectedTrade(null)}>
        <DialogContent className="bg-[#0d1117] border-[#1e2a3a] max-w-md text-gray-200">
          <DialogHeader>
            <DialogTitle className="font-mono font-semibold text-[11px] text-gray-500 uppercase tracking-widest">
              Trade Note
            </DialogTitle>
          </DialogHeader>
          {annotationLoading ? (
            <div className="bg-[#080d13] rounded-lg h-24 animate-pulse" />
          ) : (
            <div className="space-y-4">
              <Textarea
                value={annotationNote}
                onChange={(e) => setAnnotationNote(e.target.value)}
                placeholder="Add a note for this trade..."
                rows={4}
                className="bg-[#080d13] border-[#1e2a3a] focus-visible:border-[#f0b429]/50 focus-visible:ring-[#f0b429]/40 font-mono text-gray-300 placeholder:text-gray-700 text-sm resize-none"
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedTrade(null)}
                  className="bg-transparent hover:bg-[#1e2a3a] border-[#1e2a3a] font-mono text-gray-500 hover:text-gray-200 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveAnnotation}
                  disabled={annotationSaving}
                  className="bg-[#f0b429] hover:bg-[#d4a017] disabled:opacity-50 font-mono font-bold text-[#080d13] text-xs"
                >
                  {annotationSaving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}