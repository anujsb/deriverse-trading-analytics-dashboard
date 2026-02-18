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
    if (connected && publicKey) {
      fetchData();
    }
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
      <div className="flex justify-center items-center bg-[#080d13] min-h-screen">
        <div className="px-6 text-center">
          {/* Decorative ring */}
          <div className="inline-flex relative justify-center items-center mb-8">
            <div className="absolute border border-[#f0b429]/20 rounded-full w-32 h-32 animate-ping" style={{ animationDuration: '3s' }} />
            <div className="absolute border border-[#f0b429]/30 rounded-full w-24 h-24" />
            <div className="relative flex justify-center items-center bg-[#f0b429]/10 rounded-full w-16 h-16">
              <TrendingUp className="w-7 h-7 text-[#f0b429]" />
            </div>
          </div>

          <h1 className="mb-3 font-bold text-white text-4xl tracking-tight">
            Deriverse Analytics
          </h1>
          <p className="mb-2 font-mono text-[#f0b429] text-sm uppercase tracking-widest">
            On-chain Trading Intelligence
          </p>
          <p className="mx-auto mb-10 max-w-xs text-gray-500 text-sm leading-relaxed">
            Connect your Solana wallet to unlock full PnL tracking, fee analysis, and performance insights.
          </p>
          <WalletConnectButton />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#080d13] min-h-screen">
      {/* Page Header */}
      <header className="top-0 z-10 sticky bg-[#0d1117]/90 backdrop-blur border-[#1e2a3a] border-b">
        <div className="px-5 sm:px-8 py-3.5">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-white text-lg tracking-tight">
                  Overview
                </h1>
                <span className="hidden sm:inline-block bg-[#f0b429]/10 px-2 py-0.5 border border-[#f0b429]/20 rounded font-mono font-semibold text-[#f0b429] text-[10px] uppercase tracking-widest">
                  Live
                </span>
              </div>
              <p className="mt-0.5 font-mono text-[11px] text-gray-600">
                {publicKey?.toBase58().slice(0, 6)}...{publicKey?.toBase58().slice(-6)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSync}
                disabled={syncing}
                className="flex items-center gap-1.5 bg-[#f0b429] hover:bg-[#d4a017] disabled:opacity-40 px-3 py-1.5 rounded-md font-semibold text-[#080d13] text-xs transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
                {syncing ? "Syncing" : "Sync"}
              </button>
              <WalletConnectButton />
            </div>
          </div>
        </div>
      </header>

      <main className="px-5 sm:px-8 py-6 max-w-[1400px]">
        {/* Filters */}
        <div className="mb-6">
          <Filters onFilterChange={setFilters} symbols={symbols} />
        </div>

        {/* Metrics */}
        <div className="mb-6">
          <MetricsCards metrics={metrics} loading={loading} />
        </div>

        {/* Charts Grid */}
        <div className="gap-4 grid grid-cols-1 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <PnLChart data={timeSeriesData} loading={loading} />
          </div>
          <div className="xl:col-span-1">
            <SymbolPerformance symbols={metrics?.symbolStats || []} loading={loading} />
          </div>
        </div>
      </main>
    </div>
  );
}