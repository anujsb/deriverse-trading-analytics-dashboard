'use client';

import { useState } from 'react';
import { SlidersHorizontal, RotateCcw, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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

function toISO(date: Date) {
  return format(date, 'yyyy-MM-dd');
}

function toDate(iso: string) {
  return new Date(iso + 'T00:00:00');
}

export function Filters({ onFilterChange, symbols }: FiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    startDate: '',
    endDate: '',
    symbol: '',
    status: '',
  });
  const [activePreset, setActivePreset] = useState(0);

  const applyFilters = (next: FilterState) => {
    setFilters(next);
    onFilterChange(next);
  };

  const handleDateRange = (range: DateRange | undefined) => {
    setActivePreset(-1);
    applyFilters({
      ...filters,
      startDate: range?.from ? toISO(range.from) : '',
      endDate: range?.to ? toISO(range.to) : '',
    });
  };

  const handleReset = () => {
    const reset = { startDate: '', endDate: '', symbol: '', status: '' };
    setFilters(reset);
    onFilterChange(reset);
    setActivePreset(0);
  };

  const setPreset = (days: number, index: number) => {
    setActivePreset(index);
    if (days === 0) {
      applyFilters({ ...filters, startDate: '', endDate: '' });
      return;
    }
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    applyFilters({ ...filters, startDate: toISO(start), endDate: toISO(end) });
  };

  const dateRange: DateRange | undefined = filters.startDate
    ? { from: toDate(filters.startDate), to: filters.endDate ? toDate(filters.endDate) : undefined }
    : undefined;

  const dateLabel = filters.startDate
    ? filters.endDate
      ? `${format(toDate(filters.startDate), 'MMM d')} – ${format(toDate(filters.endDate), 'MMM d, yyyy')}`
      : format(toDate(filters.startDate), 'MMM d, yyyy')
    : 'Date range';

  return (
    <div className="bg-[#0d1117] p-4 border border-[#1e2a3a] rounded-xl">
      <div className="flex flex-wrap items-center gap-3">
        {/* Label */}
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

        <div className="hidden sm:block bg-[#1e2a3a] w-px h-6" />

        {/* Date range picker — single popover, two-month calendar */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              className={cn(
                'flex items-center gap-2 bg-[#080d13] px-3 border hover:border-[#2e3d52] rounded-lg h-8 font-mono text-[11px] transition-all',
                filters.startDate
                  ? 'text-gray-200 border-[#f0b429]/30'
                  : 'text-gray-500 border-[#1e2a3a]'
              )}
            >
              <CalendarIcon
                className={cn('w-3.5 h-3.5', filters.startDate ? 'text-[#f0b429]' : 'text-gray-600')}
              />
              {dateLabel}
            </button>
          </PopoverTrigger>
          <PopoverContent className="bg-[#0d1117] p-0 border-[#1e2a3a] w-auto" align="start">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={handleDateRange}
              numberOfMonths={2}
              className="text-gray-300"
            />
          </PopoverContent>
        </Popover>

        <div className="hidden sm:block bg-[#1e2a3a] w-px h-6" />

        {/* Status */}
        <Select
          value={filters.status || '__all__'}
          onValueChange={(val) => applyFilters({ ...filters, status: val === '__all__' ? '' : val })}
        >
          <SelectTrigger className="bg-[#080d13] border-[#1e2a3a] focus:border-[#f0b429]/50 rounded-lg focus:ring-0 w-[110px] h-8 font-mono text-[11px] text-gray-300">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-[#0d1117] border-[#1e2a3a] font-mono text-[11px] text-gray-300">
            <SelectItem value="__all__" className="hover:bg-[#1e2a3a] focus:bg-[#1e2a3a] text-gray-400">All</SelectItem>
            <SelectItem value="CLOSED" className="hover:bg-[#1e2a3a] focus:bg-[#1e2a3a]">Closed</SelectItem>
            <SelectItem value="OPEN" className="hover:bg-[#1e2a3a] focus:bg-[#1e2a3a]">Open</SelectItem>
          </SelectContent>
        </Select>

        {/* Symbol */}
        <Select
          value={filters.symbol || '__all__'}
          onValueChange={(val) => applyFilters({ ...filters, symbol: val === '__all__' ? '' : val })}
        >
          <SelectTrigger className="bg-[#080d13] border-[#1e2a3a] focus:border-[#f0b429]/50 rounded-lg focus:ring-0 w-[140px] h-8 font-mono text-[11px] text-gray-300">
            <SelectValue placeholder="All symbols" />
          </SelectTrigger>
          <SelectContent className="bg-[#0d1117] border-[#1e2a3a] font-mono text-[11px] text-gray-300">
            <SelectItem value="__all__" className="hover:bg-[#1e2a3a] focus:bg-[#1e2a3a] text-gray-400">All Symbols</SelectItem>
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