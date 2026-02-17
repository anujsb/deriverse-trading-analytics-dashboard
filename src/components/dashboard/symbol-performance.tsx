'use client';

import { SymbolStats } from '@/lib/analytics/metrics';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface SymbolPerformanceProps {
  symbols: SymbolStats[];
  loading: boolean;
}

export function SymbolPerformance({ symbols, loading }: SymbolPerformanceProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6 shadow">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4 animate-pulse"></div>
        <div className="h-80 bg-gray-100 rounded animate-pulse"></div>
      </div>
    );
  }

  if (!symbols || symbols.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6 shadow">
        <h3 className="text-lg font-semibold mb-4">Performance by Symbol</h3>
        <div className="h-80 flex items-center justify-center text-gray-500">
          No data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow">
      <h3 className="text-lg font-semibold mb-4">Performance by Symbol</h3>
      
      {/* Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={symbols} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="symbol" stroke="#6b7280" fontSize={12} />
          <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(value) => `$${value}`} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '12px',
            }}
            // formatter={(value: number) => [`$${value.toFixed(2)}`, 'PnL']}
            formatter={(value) => {
              if (typeof value !== 'number') return ['$0.00', 'PnL'];
              return [`$${value.toFixed(2)}`, 'PnL'];
            }}
            
          />
          <Bar dataKey="pnl" radius={[8, 8, 0, 0]}>
            {symbols.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Table */}
      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr className="text-left text-xs font-medium text-gray-500 uppercase">
              <th className="px-4 py-3">Symbol</th>
              <th className="px-4 py-3">Trades</th>
              <th className="px-4 py-3">Win Rate</th>
              <th className="px-4 py-3">Volume</th>
              <th className="px-4 py-3">PnL</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {symbols.map((symbol) => (
              <tr key={symbol.symbol} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{symbol.symbol}</td>
                <td className="px-4 py-3 text-gray-600">{symbol.trades}</td>
                <td className="px-4 py-3">
                  <span className={`font-medium ${
                    symbol.winRate >= 50 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {symbol.winRate.toFixed(1)}%
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  ${(symbol.volume / 1000).toFixed(1)}K
                </td>
                <td className="px-4 py-3">
                  <span className={`font-semibold ${
                    symbol.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {symbol.pnl >= 0 ? '+' : ''}${symbol.pnl.toFixed(2)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}