'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ArrowUpRight, ArrowDownRight, ExternalLink, StickyNote } from 'lucide-react';

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

export function TradeHistory({ trades, loading, userId, onLoadMore, hasMore }: TradeHistoryProps) {
  const [selectedTrade, setSelectedTrade] = useState<string | null>(null);
  const [annotationNote, setAnnotationNote] = useState('');
  const [annotationLoading, setAnnotationLoading] = useState(false);
  const [annotationSaving, setAnnotationSaving] = useState(false);

  useEffect(() => {
    if (!selectedTrade || !userId) return;
    setAnnotationLoading(true);
    fetch(`/api/trades/${encodeURIComponent(selectedTrade)}/annotation?userId=${encodeURIComponent(userId)}`)
      .then((r) => r.json())
      .then((data) => setAnnotationNote(data?.note ?? ''))
      .catch(() => setAnnotationNote(''))
      .finally(() => setAnnotationLoading(false));
  }, [selectedTrade, userId]);

  const handleSave = async () => {
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

  const safeParse = (v: string | null | undefined) => (v ? parseFloat(v) : 0);

  const card: React.CSSProperties = {
    background: '#111213', border: '1px solid #1e2022', borderRadius: 6,
    padding: 16, fontFamily: "'DM Mono', 'Courier New', monospace",
  };

  if (loading && trades.length === 0) {
    return (
      <div style={card}>
        <div style={{ background: '#1a1c1e', borderRadius: 4, width: '25%', height: 10, marginBottom: 16, animation: 'dv-pulse 1.4s ease-in-out infinite' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ background: '#0c0d0e', borderRadius: 5, height: 40, animation: 'dv-pulse 1.4s ease-in-out infinite' }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes dv-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes dv-fade-up { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        .dv-tr:hover td { background: rgba(226,201,126,0.02); }
        .dv-action-btn { background:none; border:none; cursor:pointer; padding:2px; color:#2e3033; transition:color 0.15s; display:flex; align-items:center; }
        .dv-action-btn:hover { color:#e2c97e; }
        .dv-action-btn.ext:hover { color:#a0a8b8; }
        .dv-action-btn:disabled { opacity:0.3; cursor:not-allowed; }
        .dv-load-more { display:inline-flex; align-items:center; background:none; border:1px solid #1e2022; border-radius:4px; padding:8px 20px; color:#3a3c40; font-family:'DM Mono',monospace; font-size:10px; cursor:pointer; letter-spacing:0.08em; text-transform:uppercase; transition:all 0.15s; }
        .dv-load-more:hover { border-color:rgba(226,201,126,0.3); color:#b0a898; }
        .dv-load-more:disabled { opacity:0.35; cursor:not-allowed; }
        /* Note modal */
        .dv-modal-overlay { position:fixed; inset:0; background:rgba(12,13,14,0.8); backdrop-filter:blur(4px); z-index:50; display:flex; align-items:center; justify-content:center; animation:dv-fade-up 0.2s ease; }
        .dv-modal { background:#111213; border:1px solid #1e2022; border-radius:7px; padding:24px; width:400px; max-width:90vw; font-family:'DM Mono',monospace; }
        .dv-modal-label { font-size:9px; color:#3a3c40; letter-spacing:0.14em; text-transform:uppercase; margin-bottom:14px; }
        .dv-textarea { background:#0c0d0e; border:1px solid #1e2022; border-radius:4px; padding:10px 13px; color:#f0ebe0; font-family:'DM Mono',monospace; font-size:11px; width:100%; outline:none; resize:none; line-height:1.6; transition:border-color 0.15s; }
        .dv-textarea:focus { border-color:rgba(226,201,126,0.4); }
        .dv-textarea::placeholder { color:#252729; }
        .dv-modal-actions { display:flex; justify-content:flex-end; gap:8px; margin-top:14px; }
        .dv-modal-cancel { background:none; border:1px solid #1e2022; border-radius:4px; padding:7px 16px; color:#3a3c40; font-family:'DM Mono',monospace; font-size:10px; cursor:pointer; letter-spacing:0.08em; transition:all 0.15s; }
        .dv-modal-cancel:hover { border-color:#2e3033; color:#888; }
        .dv-modal-save { background:#e2c97e; border:none; border-radius:4px; padding:7px 16px; color:#0c0d0e; font-family:'DM Mono',monospace; font-size:10px; font-weight:500; cursor:pointer; letter-spacing:0.08em; text-transform:uppercase; transition:opacity 0.15s; }
        .dv-modal-save:hover { opacity:0.85; }
        .dv-modal-save:disabled { opacity:0.35; cursor:not-allowed; }
      `}</style>

      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 9, color: '#3a3c40', letterSpacing: '0.14em', textTransform: 'uppercase' }}>Trade History</div>
          <div style={{ background: '#0c0d0e', border: '1px solid #1e2022', borderRadius: 3, padding: '3px 10px', fontSize: 9, color: '#2e3033', letterSpacing: '0.08em' }}>
            {trades.length} trades
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr>
                {['Date', 'Symbol', 'Type', 'Entry', 'Exit', 'Size', 'PnL', 'Fee', 'Status', ''].map((h) => (
                  <th key={h} style={{ padding: '0 10px 9px', textAlign: 'left', fontSize: 9, color: '#2e3033', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, borderBottom: '1px solid #181a1c', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trades.map((trade) => {
                const pnl = safeParse(trade.pnl);
                const pos = pnl > 0;
                return (
                  <tr key={trade.signature} className="dv-tr">
                    <td style={{ padding: '9px 10px', color: '#2e3033', whiteSpace: 'nowrap', borderBottom: '1px solid #15171a' }}>
                      {format(new Date(trade.timestamp), 'MMM dd, HH:mm')}
                    </td>
                    <td style={{ padding: '9px 10px', color: '#f0ebe0', fontWeight: 500, borderBottom: '1px solid #15171a' }}>
                      {trade.symbol}
                    </td>
                    <td style={{ padding: '9px 10px', borderBottom: '1px solid #15171a' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {trade.type === 'LONG'
                          ? <ArrowUpRight size={12} color="#4ade80" />
                          : <ArrowDownRight size={12} color="#f87171" />}
                        <span style={{ fontSize: 10, fontWeight: 500, color: trade.type === 'LONG' ? '#4ade80' : '#f87171', letterSpacing: '0.06em' }}>
                          {trade.type}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '9px 10px', color: '#b0a898', borderBottom: '1px solid #15171a' }}>
                      ${safeParse(trade.entryPrice).toFixed(2)}
                    </td>
                    <td style={{ padding: '9px 10px', color: '#3a3c40', borderBottom: '1px solid #15171a' }}>
                      {trade.exitPrice ? `$${safeParse(trade.exitPrice).toFixed(2)}` : '—'}
                    </td>
                    <td style={{ padding: '9px 10px', color: '#3a3c40', borderBottom: '1px solid #15171a' }}>
                      {safeParse(trade.size).toFixed(4)}
                    </td>
                    <td style={{ padding: '9px 10px', borderBottom: '1px solid #15171a' }}>
                      {trade.pnl
                        ? <span style={{ fontSize: 11, fontWeight: 500, color: pos ? '#4ade80' : '#f87171' }}>{pos ? '+' : ''}${pnl.toFixed(4)}</span>
                        : <span style={{ color: '#252729' }}>—</span>}
                    </td>
                    <td style={{ padding: '9px 10px', color: 'rgba(226,201,126,0.45)', borderBottom: '1px solid #15171a' }}>
                      ${safeParse(trade.fee).toFixed(5)}
                    </td>
                    <td style={{ padding: '9px 10px', borderBottom: '1px solid #15171a' }}>
                      {trade.status === 'OPEN'
                        ? <span style={{ display:'inline-block', padding:'2px 7px', borderRadius:3, fontSize:9, letterSpacing:'0.08em', textTransform:'uppercase', background:'rgba(226,201,126,0.1)', color:'#e2c97e', border:'1px solid rgba(226,201,126,0.2)' }}>Open</span>
                        : <span style={{ display:'inline-block', padding:'2px 7px', borderRadius:3, fontSize:9, letterSpacing:'0.08em', textTransform:'uppercase', background:'#1a1c1e', color:'#3a3c40', border:'1px solid #252729' }}>Closed</span>}
                    </td>
                    <td style={{ padding: '9px 10px', borderBottom: '1px solid #15171a' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button className="dv-action-btn" disabled={!userId} onClick={() => userId && setSelectedTrade(trade.signature)} title={userId ? 'Add note' : 'Connect wallet to add notes'}>
                          <StickyNote size={13} />
                        </button>
                        <a className="dv-action-btn ext" href={`https://solscan.io/tx/${trade.signature.split('#')[0]}`} target="_blank" rel="noopener noreferrer" title="View on Solscan">
                          <ExternalLink size={13} />
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
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <button className="dv-load-more" onClick={onLoadMore} disabled={loading}>
              {loading ? 'Loading…' : 'Load more'}
            </button>
          </div>
        )}
      </div>

      {/* Annotation modal */}
      {selectedTrade && (
        <div className="dv-modal-overlay" onClick={(e) => e.target === e.currentTarget && setSelectedTrade(null)}>
          <div className="dv-modal">
            <div className="dv-modal-label">Trade Note</div>
            {annotationLoading
              ? <div style={{ background: '#0c0d0e', borderRadius: 5, height: 80, animation: 'dv-pulse 1.4s ease-in-out infinite' }} />
              : (
                <>
                  <textarea className="dv-textarea" rows={5} value={annotationNote}
                    onChange={(e) => setAnnotationNote(e.target.value)}
                    placeholder="Add a note for this trade…"
                  />
                  <div className="dv-modal-actions">
                    <button className="dv-modal-cancel" onClick={() => setSelectedTrade(null)}>Cancel</button>
                    <button className="dv-modal-save" onClick={handleSave} disabled={annotationSaving}>
                      {annotationSaving ? 'Saving…' : 'Save note'}
                    </button>
                  </div>
                </>
              )}
          </div>
        </div>
      )}
    </>
  );
}