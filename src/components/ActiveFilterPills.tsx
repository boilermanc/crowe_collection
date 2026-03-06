import { X } from 'lucide-react';
import type { CollectionFilters } from '../hooks/useCollectionFilters';

interface ActiveFilterPillsProps {
  filters: CollectionFilters;
  setFilter: <K extends keyof CollectionFilters>(key: K, value: CollectionFilters[K]) => void;
  clearFilter: (key: keyof CollectionFilters) => void;
  clearAll: () => void;
  resultCount: number;
  totalCount: number;
}

interface Pill {
  label: string;
  onDismiss: () => void;
}

function buildPills(
  filters: CollectionFilters,
  setFilter: ActiveFilterPillsProps['setFilter'],
  clearFilter: ActiveFilterPillsProps['clearFilter'],
): Pill[] {
  const pills: Pill[] = [];

  const arrayFilters: { key: keyof CollectionFilters & ('genres' | 'formats' | 'decades' | 'conditions' | 'labels' | 'tags'); label: string }[] = [
    { key: 'genres', label: 'Genre' },
    { key: 'formats', label: 'Format' },
    { key: 'decades', label: 'Decade' },
    { key: 'conditions', label: 'Condition' },
    { key: 'labels', label: 'Label' },
    { key: 'tags', label: 'Tag' },
  ];

  for (const { key, label } of arrayFilters) {
    const values = filters[key] as string[];
    for (const value of values) {
      pills.push({
        label: `${label}: ${value}`,
        onDismiss: () => setFilter(key, (values.filter(v => v !== value)) as CollectionFilters[typeof key]),
      });
    }
  }

  // Price range — single combined pill
  if (filters.priceMin !== null || filters.priceMax !== null) {
    const min = filters.priceMin !== null ? `$${filters.priceMin}` : '';
    const max = filters.priceMax !== null ? `$${filters.priceMax}` : '';
    const rangeLabel = min && max ? `Price: ${min}–${max}` : min ? `Price: ${min}+` : `Price: up to ${max}`;
    pills.push({
      label: rangeLabel,
      onDismiss: () => {
        clearFilter('priceMin');
        clearFilter('priceMax');
      },
    });
  }

  if (filters.favoritesOnly) {
    pills.push({
      label: 'Favorites only',
      onDismiss: () => clearFilter('favoritesOnly'),
    });
  }

  return pills;
}

export default function ActiveFilterPills({
  filters,
  setFilter,
  clearFilter,
  clearAll,
  resultCount,
  totalCount,
}: ActiveFilterPillsProps) {
  const pills = buildPills(filters, setFilter, clearFilter);
  if (pills.length === 0) return null;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
        {pills.map((pill) => (
          <button
            key={pill.label}
            type="button"
            onClick={pill.onDismiss}
            aria-label={`Remove filter: ${pill.label}`}
            className="flex items-center gap-1 whitespace-nowrap rounded-full bg-th-bg2 border border-th-surface/[0.10] px-3 py-1 text-xs text-th-text2 hover:border-amber-500/50 transition-colors flex-shrink-0"
          >
            {pill.label}
            <X className="w-3 h-3 text-th-text3" />
          </button>
        ))}
        <button
          type="button"
          onClick={clearAll}
          aria-label="Clear all filters"
          className="whitespace-nowrap text-[10px] font-label uppercase tracking-[0.15em] text-amber-400 hover:text-amber-300 transition-colors flex-shrink-0"
        >
          Clear all
        </button>
      </div>
      <span className="text-sm text-th-text3">
        Showing {resultCount} of {totalCount} records
      </span>
    </div>
  );
}
