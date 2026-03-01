import React, { useRef } from 'react';

export interface BrowseFilters {
  search: string;
  genre: string;
  decade: string;
  format: string;
}

interface ListeningRoomFiltersProps {
  filters: BrowseFilters;
  onChange: (filters: BrowseFilters) => void;
  genres: string[];
  decades: string[];
  formats: string[];
  resultCount: number;
  totalCount: number;
  ambientMode?: boolean;
}

const ListeningRoomFilters: React.FC<ListeningRoomFiltersProps> = ({
  filters,
  onChange,
  genres,
  decades,
  formats,
  resultCount,
  totalCount,
  ambientMode,
}) => {
  const searchRef = useRef<HTMLInputElement>(null);

  const hasActiveFilter = filters.search || filters.genre || filters.decade || filters.format;

  const update = (patch: Partial<BrowseFilters>) => onChange({ ...filters, ...patch });

  const clearAll = () => {
    onChange({ search: '', genre: '', decade: '', format: '' });
    searchRef.current?.focus();
  };

  const selectClass = ambientMode
    ? 'bg-[#1a1a1a] border border-[#c4b5a0]/15 rounded-xl px-3 py-2 text-xs font-label text-[#c4b5a0] focus:outline-none focus:ring-1 focus:ring-[#dd6e42]/50 appearance-none cursor-pointer transition-colors duration-500'
    : 'bg-th-surface/[0.04] border border-th-surface/[0.10] rounded-xl px-3 py-2 text-xs font-label text-th-text2 focus:outline-none focus:ring-1 focus:ring-[#dd6e42]/50 appearance-none cursor-pointer transition-colors duration-500';

  return (
    <div className="px-4 pt-4 pb-2 space-y-2">
      {/* Filter row */}
      <div className="flex flex-wrap gap-2">
        {/* Search */}
        <div className="relative w-full md:w-auto md:flex-1 md:min-w-[180px]">
          <input
            ref={searchRef}
            type="text"
            placeholder="Search artist or album..."
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
            aria-label="Search albums"
            className={`w-full rounded-xl pl-9 pr-3 py-2 text-xs font-label focus:outline-none focus:ring-1 focus:ring-[#dd6e42]/50 transition-colors duration-500 ${
              ambientMode
                ? 'bg-[#1a1a1a] border border-[#c4b5a0]/15 text-[#c4b5a0] placeholder:text-[#c4b5a0]/30'
                : 'bg-th-surface/[0.04] border border-th-surface/[0.10] placeholder:text-th-text3/50'
            }`}
          />
          <svg
            className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none transition-colors duration-500 ${
              ambientMode ? 'text-[#c4b5a0]/40' : 'text-th-text3/70'
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Dropdowns */}
        <select
          value={filters.genre}
          onChange={(e) => update({ genre: e.target.value })}
          aria-label="Filter by genre"
          className={selectClass}
        >
          <option value="">All Genres</option>
          {genres.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>

        <select
          value={filters.decade}
          onChange={(e) => update({ decade: e.target.value })}
          aria-label="Filter by decade"
          className={selectClass}
        >
          <option value="">All Decades</option>
          {decades.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        <select
          value={filters.format}
          onChange={(e) => update({ format: e.target.value })}
          aria-label="Filter by format"
          className={selectClass}
        >
          <option value="">All Formats</option>
          {formats.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>

        {/* Clear button */}
        {hasActiveFilter && (
          <button
            type="button"
            onClick={clearAll}
            className="px-3 py-2 text-[10px] font-label font-bold uppercase tracking-widest text-[#dd6e42] hover:text-[#f0a882] transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Live result count */}
      {hasActiveFilter && (
        <p aria-live="polite" className={`text-[10px] font-label transition-colors duration-500 ${
          ambientMode ? 'text-[#c4b5a0]/50' : 'text-th-text3'
        }`}>
          {resultCount} of {totalCount} record{totalCount !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
};

export default ListeningRoomFilters;
