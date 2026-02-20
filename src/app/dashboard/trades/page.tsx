'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletConnectButton } from '@/components/wallet-connect-button';
import { TradeHistory } from '@/components/dashboard/trade-history';
import { FeeBreakdown } from '@/components/dashboard/fee-breakdown';
import { FeeChart } from '@/components/dashboard/fee-chart';
import { Filters, FilterState } from '@/components/dashboard/filters';
import { TradeMetrics, TimeSeriesData } from '@/lib/analytics/metrics';
import { RefreshCw } from 'lucide-react';

export default function TradesPage() {
  const { publicKey, connected } = useWallet();
  const [metrics, setMetrics] = useState<TradeMetrics | null>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    startDate: '',
    endDate: '',
    symbol: '',
    status: '',
  });
  const [symbols, setSymbols] = useState<string[]>([]);

  useEffect(() => {
    if (connected && publicKey) fetchData();
  }, [connected, publicKey, filters]);

  const fetchData = async () => {
    if (!publicKey) return;
    setLoading(true);
    try {
      const userId = publicKey.toBase58();
      const queryParams = new URLSearchParams({
        userId,
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(filters.symbol && { symbol: filters.symbol }),
        ...(filters.status && { status: filters.status }),
      });

      const [metricsRes, timeSeriesRes, tradesRes] = await Promise.all([
        fetch(`/api/analytics/metrics?${queryParams}`),
        fetch(`/api/analytics/timeseries?${queryParams}`),
        fetch(`/api/trades?${queryParams}&limit=50`),
      ]);

      const [metricsData, timeSeriesData, tradesData] = await Promise.all([
        metricsRes.json(),
        timeSeriesRes.json(),
        tradesRes.json(),
      ]);

      setMetrics(metricsData);
      setTimeSeriesData(timeSeriesData);
      setTrades(tradesData.trades || []);

      if (tradesData.trades) {
        const uniqueSymbols = [...new Set(tradesData.trades.map((t: any) => t.symbol))] as string[];
        setSymbols(uniqueSymbols);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (!publicKey) return;
    setSyncing(true);
    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: publicKey.toBase58() }),
      });
      const data = await response.json();
      if (response.ok) {
        alert(`Successfully synced ${data.newTrades} new trades!`);
        fetchData();
      } else {
        alert(`Sync failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Sync error:', error);
      alert('Failed to sync trades');
    } finally {
      setSyncing(false);
    }
  };

  if (!connected) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Cormorant+Garamond:wght@500;600&display=swap');
          @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
          .dv-page { font-family: 'DM Mono', monospace; }
          .fade-up { animation: fadeUp 0.5s ease forwards; }
        `}</style>
        <div className="flex justify-center items-center min-h-screen dv-page" style={{ background: '#0c0d0e' }}>
          <div className="px-8 text-center fade-up">
            <div style={{ fontSize: 28, color: '#252729', marginBottom: 16 }}>◈</div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: '#555', margin: '0 0 8px' }}>
              Wallet not connected
            </h2>
            <p style={{ fontSize: 11, color: '#333', letterSpacing: '0.08em', marginBottom: 24 }}>
              Connect your Solana wallet to view trade history &amp; fee data
            </p>
            <WalletConnectButton />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Cormorant+Garamond:wght@500;600&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        .dv-page { font-family: 'DM Mono', 'Courier New', monospace; background: #0c0d0e; min-height: 100vh; color: #f0ebe0; }
        .dv-header { position: sticky; top: 0; z-index: 10; background: rgba(12,13,14,0.92); backdrop-filter: blur(12px); border-bottom: 1px solid #1a1c1e; padding: 14px 24px; display: flex; justify-content: space-between; align-items: center; }
        .dv-header-left .eyebrow { font-size: 9px; color: #2e3033; letter-spacing: 0.18em; text-transform: uppercase; margin-bottom: 4px; }
        .dv-header-left h1 { font-family: 'Cormorant Garamond', serif; font-size: 20px; font-weight: 600; margin: 0; color: #f0ebe0; }
        .dv-header-right { display: flex; align-items: center; gap: 10px; }
        .dv-wallet-badge { display: flex; align-items: center; gap: 6px; background: #111213; border: 1px solid #1e2022; border-radius: 4px; padding: 7px 12px; font-size: 10px; color: #444; letter-spacing: 0.06em; }
        .dv-wallet-badge .dot { color: #4ade80; font-size: 8px; }
        .dv-sync-btn { display: inline-flex; align-items: center; gap: 6px; background: #e2c97e; color: #0c0d0e; border: none; padding: 8px 16px; border-radius: 4px; font-family: 'DM Mono', monospace; font-size: 10px; font-weight: 500; cursor: pointer; letter-spacing: 0.1em; text-transform: uppercase; transition: opacity 0.15s; }
        .dv-sync-btn:hover { opacity: 0.85; }
        .dv-sync-btn:disabled { opacity: 0.35; cursor: not-allowed; }
        .dv-sync-icon { width: 12px; height: 12px; }
        .dv-sync-icon.spinning { animation: spin 0.7s linear infinite; }
        .dv-main { padding: 24px; max-width: 1400px; }
        .dv-section-label { font-size: 9px; color: #2e3033; letter-spacing: 0.18em; text-transform: uppercase; margin-bottom: 12px; }
        .dv-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
        @media (max-width: 1024px) { .dv-grid-2 { grid-template-columns: 1fr; } }
      `}</style>

      <div className="dv-page">
        <header className="dv-header">
          <div className="dv-header-left">
            <div className="eyebrow">Deriverse · Trades</div>
            <h1>Trades &amp; Fees</h1>
          </div>
          <div className="dv-header-right">
            <div className="dv-wallet-badge">
              <span className="dot">●</span>
              <span>{publicKey?.toBase58().slice(0, 5)}…{publicKey?.toBase58().slice(-5)}</span>
            </div>
            <button className="dv-sync-btn" onClick={handleSync} disabled={syncing}>
              <RefreshCw className={`dv-sync-icon ${syncing ? 'spinning' : ''}`} />
              {syncing ? 'Syncing…' : 'Sync'}
            </button>
            <WalletConnectButton />
          </div>
        </header>

        <main className="dv-main">
          <div style={{ marginBottom: 20 }}>
            <Filters onFilterChange={setFilters} symbols={symbols} />
          </div>

          <div className="dv-grid-2">
            <FeeChart data={timeSeriesData} loading={loading} />
            <FeeBreakdown
              feeBreakdown={metrics?.feeBreakdown ?? []}
              orderTypeStats={metrics?.orderTypeStats ?? []}
              loading={loading}
            />
          </div>

          <TradeHistory
            trades={trades}
            loading={loading}
            userId={publicKey?.toBase58()}
          />
        </main>
      </div>
    </>
  );
}