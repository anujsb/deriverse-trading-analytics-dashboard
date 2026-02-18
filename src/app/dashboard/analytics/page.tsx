'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletConnectButton } from '@/components/wallet-connect-button';
import { TimeOfDaySection } from '@/components/dashboard/time-of-day-section';
import { SymbolPerformance } from '@/components/dashboard/symbol-performance';
import { Filters, FilterState } from '@/components/dashboard/filters';
import { TradeMetrics, TimeSeriesData } from '@/lib/analytics/metrics';
import { RefreshCw } from 'lucide-react';

export default function AnalyticsPage() {
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

      const [metricsRes, tradesRes] = await Promise.all([
        fetch(`/api/analytics/metrics?${queryParams}`),
        fetch(`/api/trades?${queryParams}&limit=50`),
      ]);

      const [metricsData, tradesData] = await Promise.all([
        metricsRes.json(),
        tradesRes.json(),
      ]);

      setMetrics(metricsData);
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
        <div className="text-center">
          <p className="mb-4 text-gray-400">Connect your wallet to view analytics</p>
          <WalletConnectButton />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#080d13] min-h-screen">
      <header className="top-0 z-10 sticky bg-[#0d1117]/90 backdrop-blur border-[#1e2a3a] border-b">
        <div className="px-5 sm:px-8 py-3.5">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="font-bold text-white text-lg tracking-tight">
                Analytics
              </h1>
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
        <div className="mb-6">
          <Filters onFilterChange={setFilters} symbols={symbols} />
        </div>
        <div className="mb-6">
          <TimeOfDaySection
            timeOfDayStats={metrics?.timeOfDayStats ?? []}
            sessionStats={metrics?.sessionStats ?? []}
            loading={loading}
          />
        </div>
        <SymbolPerformance
          symbols={metrics?.symbolStats || []}
          loading={loading}
        />
      </main>
    </div>
  );
}