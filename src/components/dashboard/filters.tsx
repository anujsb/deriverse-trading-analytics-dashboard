'use client';

import { useState } from 'react';
import { Calendar, SlidersHorizontal, RotateCcw } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FiltersProps {
  onFilterChange: (filters: FilterState) => void;
  symbols: string[];
}

export interface FilterState {
  startDate: string;
  endDate: string;
  symbol: string;
  status: string; // '' | 'CLOSED' | 'OPEN'
}

const PRESETS = [
  { label: 'All', days: 0 },
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
];

export function Filters({ onFilterChange, symbols }: FiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    startDate: '',
    endDate: '',
    symbol: '',
    status: '',
  });
  const [activePreset, setActivePreset] = useState<number>(0);

  const handleChange = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
    setActivePreset(-1);
  };

  const handleReset = () => {
    const resetFilters = { startDate: '', endDate: '', symbol: '', status: '' };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
    setActivePreset(0);
  };

  const setPreset = (days: number, index: number) => {
    setActivePreset(index);
    if (days === 0) {
      const reset = { ...filters, startDate: '', endDate: '' };
      setFilters(reset);
      onFilterChange(reset);
      return;
    }
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const newFilters = {
      ...filters,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="bg-[#0d1117] p-4 border border-[#1e2a3a] rounded-xl">
      <div className="flex flex-wrap items-center gap-3">
        {/* Icon + label */}
        <div className="flex items-center gap-2 mr-1">
          <SlidersHorizontal className="w-3.5 h-3.5 text-gray-500" />
          <span className="font-mono font-semibold text-[10px] text-gray-500 uppercase tracking-widest">
            Filters
          </span>
        </div>

        {/* Preset pills */}
        <div className="flex items-center gap-1 bg-[#080d13] p-1 border border-[#1e2a3a] rounded-lg">
          {PRESETS.map((preset, i) => (
            <button
              key={preset.label}
              onClick={() => setPreset(preset.days, i)}
              className={cn(
                'px-3 py-1 rounded-md font-mono font-semibold text-[11px] transition-all',
                activePreset === i
                  ? 'bg-[#f0b429] text-[#080d13]'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-[#1e2a3a]'
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="hidden sm:block bg-[#1e2a3a] w-px h-6" />

        {/* Date range */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Calendar className="top-1/2 left-2.5 absolute w-3.5 h-3.5 text-gray-600 -translate-y-1/2 pointer-events-none" />
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleChange('startDate', e.target.value)}
              className="bg-[#080d13] py-1.5 pr-3 pl-8 border border-[#1e2a3a] focus:border-[#f0b429]/50 rounded-lg focus:outline-none focus:ring-0 w-[130px] font-mono text-[11px] text-gray-300 transition-colors"
            />
          </div>
          <span className="font-mono text-gray-600 text-xs">→</span>
          <div className="relative">
            <Calendar className="top-1/2 left-2.5 absolute w-3.5 h-3.5 text-gray-600 -translate-y-1/2 pointer-events-none" />
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleChange('endDate', e.target.value)}
              className="bg-[#080d13] py-1.5 pr-3 pl-8 border border-[#1e2a3a] focus:border-[#f0b429]/50 rounded-lg focus:outline-none focus:ring-0 w-[130px] font-mono text-[11px] text-gray-300 transition-colors"
            />
          </div>
        </div>

        {/* Divider */}
        <div className="hidden sm:block bg-[#1e2a3a] w-px h-6" />

        {/* Status select - default CLOSED to hide stale OPEN trades */}
        <Select
          value={filters.status || '__all__'}
          onValueChange={(val) => handleChange('status', val === '__all__' ? '' : val)}
        >
          <SelectTrigger className="bg-[#080d13] border-[#1e2a3a] focus:border-[#f0b429]/50 rounded-lg focus:ring-0 w-[110px] h-8 font-mono text-[11px] text-gray-300">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-[#0d1117] border-[#1e2a3a] font-mono text-[11px] text-gray-300">
            <SelectItem value="__all__" className="hover:bg-[#1e2a3a] focus:bg-[#1e2a3a] text-gray-400">
              All
            </SelectItem>
            <SelectItem value="CLOSED" className="hover:bg-[#1e2a3a] focus:bg-[#1e2a3a]">
              Closed
            </SelectItem>
            <SelectItem value="OPEN" className="hover:bg-[#1e2a3a] focus:bg-[#1e2a3a]">
              Open
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Symbol select */}
        <Select
          value={filters.symbol || '__all__'}
          onValueChange={(val) => handleChange('symbol', val === '__all__' ? '' : val)}
        >
          <SelectTrigger className="bg-[#080d13] border-[#1e2a3a] focus:border-[#f0b429]/50 rounded-lg focus:ring-0 w-[140px] h-8 font-mono text-[11px] text-gray-300">
            <SelectValue placeholder="All symbols" />
          </SelectTrigger>
          <SelectContent className="bg-[#0d1117] border-[#1e2a3a] font-mono text-[11px] text-gray-300">
            <SelectItem value="__all__" className="hover:bg-[#1e2a3a] focus:bg-[#1e2a3a] text-gray-400">
              All Symbols
            </SelectItem>
            {symbols.map((symbol) => (
              <SelectItem key={symbol} value={symbol} className="hover:bg-[#1e2a3a] focus:bg-[#1e2a3a]">
                {symbol}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Reset */}
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 hover:bg-[#1e2a3a] px-3 py-1.5 border border-transparent hover:border-[#1e2a3a] rounded-lg font-mono font-semibold text-[11px] text-gray-500 hover:text-gray-300 transition-all"
        >
          <RotateCcw className="w-3 h-3" />
          Reset
        </button>
      </div>
    </div>
  );
}