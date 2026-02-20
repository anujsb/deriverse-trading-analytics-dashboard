'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletConnectButton } from '@/components/wallet-connect-button';
import { MetricsCards } from '@/components/dashboard/metrics-cards';
import { PnLChart } from '@/components/dashboard/pnl-chart';
import { SymbolPerformance } from '@/components/dashboard/symbol-performance';
import { Filters, FilterState } from '@/components/dashboard/filters';
import { TradeMetrics, TimeSeriesData } from '@/lib/analytics/metrics';
import { RefreshCw, TrendingUp } from 'lucide-react';

export default function DashboardPage() {
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
          @keyframes pulse-ring { 0%, 100% { opacity: 0.2; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.08); } }
          .connect-page { font-family: 'DM Mono', monospace; }
          .pulse-ring { animation: pulse-ring 3s ease-in-out infinite; }
          .fade-up { animation: fadeUp 0.5s ease forwards; }
        `}</style>
        <div className="flex justify-center items-center min-h-screen connect-page" style={{ background: '#0c0d0e' }}>
          <div className="px-8 text-center fade-up">
            <div className="inline-flex relative justify-center items-center mb-10">
              <div className="absolute border border-[#e2c97e]/20 rounded-full pulse-ring w-36 h-36" />
              <div className="absolute border border-[#e2c97e]/10 rounded-full w-24 h-24" />
              <div className="relative flex justify-center items-center rounded-full w-16 h-16" style={{ background: '#111213', border: '1px solid #e2c97e22' }}>
                <TrendingUp className="w-6 h-6" style={{ color: '#e2c97e' }} />
              </div>
            </div>

            <div style={{ fontSize: 9, color: '#333', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 10 }}>
              Deriverse · On-chain Intelligence
            </div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, fontWeight: 600, color: '#f0ebe0', margin: '0 0 8px' }}>
              Deriverse Analytics
            </h1>
            <p style={{ fontSize: 11, color: '#3a3c40', letterSpacing: '0.08em', marginBottom: 32, lineHeight: 1.8 }}>
              Connect your Solana wallet to unlock PnL tracking,<br />fee analysis, and performance insights.
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
        @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
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
        .dv-live-badge { display: inline-flex; align-items: center; gap: 5px; background: #e2c97e11; border: 1px solid #e2c97e22; border-radius: 3px; padding: 3px 8px; font-size: 9px; color: #e2c97e; letter-spacing: 0.12em; text-transform: uppercase; margin-left: 8px; }
        .dv-live-dot { width: 5px; height: 5px; border-radius: 50%; background: #4ade80; animation: pulse-green 2s ease-in-out infinite; }
        @keyframes pulse-green { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        .fade-up { animation: fadeUp 0.3s ease; }
      `}</style>

      <div className="dv-page">
        <header className="dv-header">
          <div className="dv-header-left">
            <div className="eyebrow">Deriverse · Overview</div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <h1>Portfolio Overview</h1>
              <span className="dv-live-badge">
                <span className="dv-live-dot" />
                Live
              </span>
            </div>
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

          <div style={{ marginBottom: 20 }}>
            <MetricsCards metrics={metrics} loading={loading} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
            <PnLChart data={timeSeriesData} loading={loading} />
            <SymbolPerformance symbols={metrics?.symbolStats || []} loading={loading} />
          </div>
        </main>
      </div>
    </>
  );
}