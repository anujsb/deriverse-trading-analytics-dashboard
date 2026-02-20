'use client';

import { useState } from 'react';
import { SlidersHorizontal, RotateCcw, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';

interface FiltersProps {
  onFilterChange: (filters: FilterState) => void;
  symbols: string[];
}

export interface FilterState {
  startDate: string;
  endDate: string;
  symbol: string;
  status: string;
}

const PRESETS = [
  { label: 'All', days: 0 },
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
];

function toISO(date: Date) { return format(date, 'yyyy-MM-dd'); }
function toDate(iso: string) { return new Date(iso + 'T00:00:00'); }

export function Filters({ onFilterChange, symbols }: FiltersProps) {
  const [filters, setFilters] = useState<FilterState>({ startDate: '', endDate: '', symbol: '', status: '' });
  const [activePreset, setActivePreset] = useState(0);

  const applyFilters = (next: FilterState) => { setFilters(next); onFilterChange(next); };

  const handleDateRange = (range: DateRange | undefined) => {
    setActivePreset(-1);
    applyFilters({ ...filters, startDate: range?.from ? toISO(range.from) : '', endDate: range?.to ? toISO(range.to) : '' });
  };

  const handleReset = () => {
    const reset = { startDate: '', endDate: '', symbol: '', status: '' };
    setFilters(reset);
    onFilterChange(reset);
    setActivePreset(0);
  };

  const setPreset = (days: number, index: number) => {
    setActivePreset(index);
    if (days === 0) { applyFilters({ ...filters, startDate: '', endDate: '' }); return; }
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
      ? `${format(toDate(filters.startDate), 'MMM d')} – ${format(toDate(filters.endDate), 'MMM d, yy')}`
      : format(toDate(filters.startDate), 'MMM d, yyyy')
    : 'Date range';

  const baseCardStyle: React.CSSProperties = {
    background: '#111213',
    border: '1px solid #1e2022',
    borderRadius: 6,
    padding: '12px 16px',
    fontFamily: "'DM Mono', 'Courier New', monospace",
  };

  const inputBase: React.CSSProperties = {
    background: '#0c0d0e',
    border: '1px solid #1e2022',
    borderRadius: 4,
    padding: '6px 12px',
    color: '#f0ebe0',
    fontFamily: "'DM Mono', monospace",
    fontSize: 10,
    outline: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    letterSpacing: '0.04em',
    height: 30,
    transition: 'border-color 0.15s',
  };

  return (
    <>
      <style>{`
        .dv-filter-select .st { background:#0c0d0e !important; border:1px solid #1e2022 !important; border-radius:4px !important; height:30px !important; font-family:'DM Mono',monospace !important; font-size:10px !important; color:#b0a898 !important; padding:0 10px !important; }
        .dv-filter-select .st:hover { border-color:rgba(226,201,126,0.3) !important; }
        .dv-filter-select .st:focus-within { border-color:rgba(226,201,126,0.4) !important; box-shadow:none !important; }
        .dv-filter-content { background:#0e0f10 !important; border:1px solid #1e2022 !important; border-radius:5px !important; font-family:'DM Mono',monospace !important; font-size:10px !important; }
        .dv-filter-item { color:#b0a898 !important; font-size:10px !important; padding:7px 12px !important; cursor:pointer; }
        .dv-filter-item:hover, .dv-filter-item:focus { background:rgba(226,201,126,0.07) !important; color:#e2c97e !important; }
        .dv-calendar { background:#0e0f10 !important; border:1px solid #1e2022 !important; border-radius:5px !important; }
        .dv-preset-btn { background:none; border:none; padding:4px 10px; border-radius:3px; font-family:'DM Mono',monospace; font-size:10px; font-weight:500; cursor:pointer; letter-spacing:0.08em; transition:all 0.15s; color:#3a3c40; }
        .dv-preset-btn:hover { color:#b0a898; background:rgba(255,255,255,0.04); }
        .dv-preset-btn.active { background:#e2c97e; color:#0c0d0e; }
        .dv-date-trigger { background:#0c0d0e; border:1px solid #1e2022; border-radius:4px; padding:0 12px; color:#3a3c40; font-family:'DM Mono',monospace; font-size:10px; cursor:pointer; display:flex; align-items:center; gap:6px; height:30px; letter-spacing:0.04em; transition:border-color 0.15s; }
        .dv-date-trigger:hover { border-color:rgba(226,201,126,0.3); }
        .dv-date-trigger.active { border-color:rgba(226,201,126,0.3); color:#b0a898; }
        .dv-reset-btn { background:none; border:1px solid transparent; border-radius:4px; padding:0 10px; color:#2e3033; font-family:'DM Mono',monospace; font-size:10px; cursor:pointer; display:flex; align-items:center; gap:5px; height:30px; letter-spacing:0.06em; transition:all 0.15s; }
        .dv-reset-btn:hover { border-color:#1e2022; color:#888; }
        .dv-divider { width:1px; height:18px; background:#1e2022; flex-shrink:0; }
      `}</style>

      <div style={baseCardStyle}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
          {/* Label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 9, color: '#2e3033', letterSpacing: '0.16em', textTransform: 'uppercase', marginRight: 4 }}>
            <SlidersHorizontal size={11} color="#2e3033" />
            Filters
          </div>

          {/* Preset pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: '#0c0d0e', border: '1px solid #1e2022', borderRadius: 4, padding: '2px 3px' }}>
            {PRESETS.map((preset, i) => (
              <button key={preset.label} className={`dv-preset-btn${activePreset === i ? ' active' : ''}`}
                onClick={() => setPreset(preset.days, i)}>
                {preset.label}
              </button>
            ))}
          </div>

          <div className="dv-divider" />

          {/* Date range */}
          <Popover>
            <PopoverTrigger asChild>
              <button className={`dv-date-trigger${filters.startDate ? ' active' : ''}`}>
                <CalendarIcon size={11} color={filters.startDate ? '#e2c97e' : '#2e3033'} />
                {dateLabel}
              </button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-auto dv-calendar" align="start">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={handleDateRange}
                numberOfMonths={2}
                className="text-gray-400"
              />
            </PopoverContent>
          </Popover>

          <div className="dv-divider" />

          {/* Status select */}
          <div className="dv-filter-select">
            <Select
              value={filters.status || '__all__'}
              onValueChange={(val) => applyFilters({ ...filters, status: val === '__all__' ? '' : val })}
            >
              <SelectTrigger className="w-[108px] st">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="dv-filter-content">
                <SelectItem value="__all__" className="dv-filter-item">All status</SelectItem>
                <SelectItem value="CLOSED" className="dv-filter-item">Closed</SelectItem>
                <SelectItem value="OPEN" className="dv-filter-item">Open</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Symbol select */}
          <div className="dv-filter-select">
            <Select
              value={filters.symbol || '__all__'}
              onValueChange={(val) => applyFilters({ ...filters, symbol: val === '__all__' ? '' : val })}
            >
              <SelectTrigger className="w-[140px] st">
                <SelectValue placeholder="All symbols" />
              </SelectTrigger>
              <SelectContent className="dv-filter-content">
                <SelectItem value="__all__" className="dv-filter-item">All symbols</SelectItem>
                {symbols.map((s) => (
                  <SelectItem key={s} value={s} className="dv-filter-item">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reset */}
          <button className="dv-reset-btn" onClick={handleReset}>
            <RotateCcw size={10} />
            Reset
          </button>
        </div>
      </div>
    </>
  );
}