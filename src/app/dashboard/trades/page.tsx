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
        <div className="text-center">
          <p className="mb-4 text-gray-400">Connect your wallet to view trade history</p>
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
              <h1 className="font-bold text-white text-lg tracking-tight">
                Trades & Fees
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
        {/* Filters */}
        <div className="mb-6">
          <Filters onFilterChange={setFilters} symbols={symbols} />
        </div>

        {/* Fee Chart + Breakdown side by side */}
        <div className="gap-4 grid grid-cols-1 xl:grid-cols-2 mb-6">
          <FeeChart data={timeSeriesData} loading={loading} />
          <FeeBreakdown
            feeBreakdown={metrics?.feeBreakdown ?? []}
            orderTypeStats={metrics?.orderTypeStats ?? []}
            loading={loading}
          />
        </div>

        {/* Trade History full width */}
        <TradeHistory
          trades={trades}
          loading={loading}
          userId={publicKey?.toBase58()}
        />
      </main>
    </div>
  );
}