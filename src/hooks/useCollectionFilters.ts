import { useState, useMemo, useCallback, useEffect } from 'react';
import type { Album } from '../types';

export interface CollectionFilters {
  search: string;
  genres: string[];
  formats: string[];
  decades: string[];
  conditions: string[];
  labels: string[];
  priceMin: number | null;
  priceMax: number | null;
  favoritesOnly: boolean;
  tags: string[];
}

const DEFAULT_FILTERS: CollectionFilters = {
  search: '',
  genres: [],
  formats: [],
  decades: [],
  conditions: [],
  labels: [],
  priceMin: null,
  priceMax: null,
  favoritesOnly: false,
  tags: [],
};

function isDefault(key: keyof CollectionFilters, value: CollectionFilters[keyof CollectionFilters]): boolean {
  const def = DEFAULT_FILTERS[key];
  if (Array.isArray(def)) return (value as string[]).length === 0;
  return value === def;
}

/** Derive the decade bucket for a given year string, e.g. "1973" → "1970s" */
function yearToDecade(year: string | undefined): string | null {
  if (!year) return null;
  const n = parseInt(year, 10);
  if (isNaN(n) || n < 1900) return null;
  return `${Math.floor(n / 10) * 10}s`;
}

/** Deduplicate and sort an array of strings. */
function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

const SESSION_KEY = 'rekkrd_collection_filters';

function loadFromSession(): CollectionFilters {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<CollectionFilters>;
      return { ...DEFAULT_FILTERS, ...parsed };
    }
  } catch { /* ignore corrupt data */ }
  return { ...DEFAULT_FILTERS };
}

export function useCollectionFilters() {
  const [filters, setFilters] = useState<CollectionFilters>(loadFromSession);

  // Persist to sessionStorage on every change
  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(filters));
    } catch { /* quota exceeded — ignore */ }
  }, [filters]);

  const setFilter = useCallback(<K extends keyof CollectionFilters>(key: K, value: CollectionFilters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilter = useCallback((key: keyof CollectionFilters) => {
    setFilters(prev => ({ ...prev, [key]: DEFAULT_FILTERS[key] }));
  }, []);

  const clearAll = useCallback(() => {
    setFilters({ ...DEFAULT_FILTERS });
  }, []);

  // Count non-default filters, excluding search
  const activeFilterCount = useMemo(() => {
    let count = 0;
    for (const key of Object.keys(filters) as (keyof CollectionFilters)[]) {
      if (key === 'search') continue;
      if (!isDefault(key, filters[key])) count++;
    }
    return count;
  }, [filters]);

  const applyFilters = useCallback((albums: Album[]): Album[] => {
    const searchLower = filters.search.toLowerCase().trim();

    return albums.filter(album => {
      // Search: case-insensitive match on title, artist, genre, label
      if (searchLower) {
        const haystack = [album.title, album.artist, album.genre, album.label]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(searchLower)) return false;
      }

      // Genres
      if (filters.genres.length > 0) {
        if (!album.genre || !filters.genres.includes(album.genre)) return false;
      }

      // Formats
      if (filters.formats.length > 0) {
        if (!album.format || !filters.formats.includes(album.format)) return false;
      }

      // Decades
      if (filters.decades.length > 0) {
        const decade = yearToDecade(album.year);
        if (!decade || !filters.decades.includes(decade)) return false;
      }

      // Conditions
      if (filters.conditions.length > 0) {
        if (!album.condition || !filters.conditions.includes(album.condition)) return false;
      }

      // Labels
      if (filters.labels.length > 0) {
        if (!album.label || !filters.labels.includes(album.label)) return false;
      }

      // Tags
      if (filters.tags.length > 0) {
        if (!album.tags || !filters.tags.some(t => album.tags!.includes(t))) return false;
      }

      // Price range
      if (filters.priceMin !== null) {
        if (album.price_median == null || album.price_median < filters.priceMin) return false;
      }
      if (filters.priceMax !== null) {
        if (album.price_median == null || album.price_median > filters.priceMax) return false;
      }

      // Favorites only
      if (filters.favoritesOnly && !album.isFavorite) return false;

      return true;
    });
  }, [filters]);

  // Derive available options from an albums array
  const deriveAvailableOptions = useCallback((albums: Album[]) => {
    const genres: string[] = [];
    const formats: string[] = [];
    const decades: string[] = [];
    const conditions: string[] = [];
    const labels: string[] = [];
    const tags: string[] = [];

    for (const album of albums) {
      if (album.genre) genres.push(album.genre);
      if (album.format) formats.push(album.format);
      if (album.condition) conditions.push(album.condition);
      if (album.label) labels.push(album.label);
      const decade = yearToDecade(album.year);
      if (decade) decades.push(decade);
      if (album.tags) {
        for (const tag of album.tags) tags.push(tag);
      }
    }

    return {
      availableGenres: uniqueSorted(genres),
      availableFormats: uniqueSorted(formats),
      availableDecades: uniqueSorted(decades),
      availableConditions: uniqueSorted(conditions),
      availableLabels: uniqueSorted(labels),
      availableTags: uniqueSorted(tags),
    };
  }, []);

  return {
    filters,
    setFilter,
    clearFilter,
    clearAll,
    activeFilterCount,
    applyFilters,
    deriveAvailableOptions,
  };
}
