'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletConnectButton } from '@/components/wallet-connect-button';
import { MetricsCards } from '@/components/dashboard/metrics-cards';
import { PnLChart } from '@/components/dashboard/pnl-chart';
import { TradeHistory } from '@/components/dashboard/trade-history';
import { Filters, FilterState } from '@/components/dashboard/filters';
import { SymbolPerformance } from '@/components/dashboard/symbol-performance';
import { FeeChart } from '@/components/dashboard/fee-chart';
import { TimeOfDaySection } from '@/components/dashboard/time-of-day-section';
import { FeeBreakdown } from '@/components/dashboard/fee-breakdown';
import { TradeMetrics, TimeSeriesData } from '@/lib/analytics/metrics';
import { RefreshCw } from 'lucide-react';

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
    // const userId = 'TEST_WALLET_ADDRESS_123'; for testing (added sample data in src/scripts/seed-test-data.ts)

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
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Deriverse Trading Analytics
          </h1>
          <p className="text-gray-600 mb-8">
            Connect your wallet to view your trading performance
          </p>
          <WalletConnectButton />
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Top bar (inside main content area) */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Trading Dashboard
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Wallet: {publicKey?.toBase58().slice(0, 4)}...
                {publicKey?.toBase58().slice(-4)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSync}
                disabled={syncing}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
                {syncing ? "Syncing..." : "Sync"}
              </button>
              <WalletConnectButton />
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
        <section id="filters" className="scroll-mt-24">
          <Filters onFilterChange={setFilters} symbols={symbols} />
        </section>

        <section id="overview" className="scroll-mt-24 mb-8">
          <MetricsCards metrics={metrics} loading={loading} />
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
          <div className="xl:col-span-2">
            <PnLChart data={timeSeriesData} loading={loading} />
          </div>
          <FeeChart data={timeSeriesData} loading={loading} />
          <SymbolPerformance symbols={metrics?.symbolStats || []} loading={loading} />
        </section>

        <section id="time" className="scroll-mt-24 mb-8">
          <TimeOfDaySection
            timeOfDayStats={metrics?.timeOfDayStats ?? []}
            sessionStats={metrics?.sessionStats ?? []}
            loading={loading}
          />
        </section>

        <section id="fees" className="scroll-mt-24 mb-8">
          <FeeBreakdown
            feeBreakdown={metrics?.feeBreakdown ?? []}
            orderTypeStats={metrics?.orderTypeStats ?? []}
            loading={loading}
          />
        </section>

        <section id="trades" className="scroll-mt-24">
          <TradeHistory trades={trades} loading={loading} userId={publicKey?.toBase58()} />
        </section>
      </main>
    </div>
  );
}