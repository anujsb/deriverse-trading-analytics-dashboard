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
      <div className="flex justify-center items-center bg-[#0c0d0e] min-h-screen font-mono">
        <div className="px-8 text-center">
          <div className="mb-4 text-[#252729] text-[28px]">◈</div>
          <h2 className="mb-2 text-[#555] text-[22px]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Wallet not connected
          </h2>
          <p className="mb-6 font-mono text-[#333] text-[11px] tracking-[0.08em]">
            Connect your Solana wallet to view trade history &amp; fee data
          </p>
          <WalletConnectButton />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0c0d0e] min-h-screen font-mono text-[#f0ebe0]">

      {/* Header */}
      <header className="top-0 z-10 sticky flex justify-between items-center bg-[rgba(12,13,14,0.92)] backdrop-blur-md px-6 py-[14px] border-[#1a1c1e] border-b">
        <div>
          <p className="mb-1 font-mono text-[#2e3033] text-[9px] uppercase tracking-[0.18em]">
            Deriverse · Trades
          </p>
          <h1 className="font-[600] text-[#f0ebe0] text-[20px]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Trades &amp; Fees
          </h1>
        </div>

        <div className="flex items-center gap-[10px]">
          <div className="flex items-center gap-[6px] bg-[#111213] px-3 py-[7px] border border-[#1e2022] rounded font-mono text-[#444] text-[10px] tracking-[0.06em]">
            <span className="text-[#4ade80] text-[8px]">●</span>
            <span>{publicKey?.toBase58().slice(0, 5)}…{publicKey?.toBase58().slice(-5)}</span>
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="inline-flex items-center gap-[6px] bg-[#e2c97e] hover:opacity-85 disabled:opacity-35 px-4 py-2 rounded font-[500] font-mono text-[#0c0d0e] text-[10px] uppercase tracking-[0.1em] transition-opacity cursor-pointer disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing…' : 'Sync'}
          </button>
          <WalletConnectButton />
        </div>
      </header>

      {/* Main */}
      <main className="px-6 py-6 max-w-[1400px]">
        <div className="mb-5">
          <Filters onFilterChange={setFilters} symbols={symbols} />
        </div>

        <div className="gap-4 grid grid-cols-1 xl:grid-cols-2 mb-5">
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
  );
}