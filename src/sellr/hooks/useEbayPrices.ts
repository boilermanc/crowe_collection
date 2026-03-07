import { useState, useEffect, useRef } from 'react';
import type { SellrRecord } from '../types';

export interface EbayPriceRange {
  min: number;
  max: number;
}

function cacheKey(record: SellrRecord): string {
  return `${record.artist}-${record.title}`;
}

/**
 * Fetches eBay price ranges for a list of Sellr records.
 * Returns a map keyed by "artist-title" with { min, max } price ranges.
 * Silently skips records that return no results or errors.
 */
export function useEbayPrices(records: SellrRecord[]): Record<string, EbayPriceRange> {
  const [prices, setPrices] = useState<Record<string, EbayPriceRange>>({});
  const fetchedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    for (const record of records) {
      const key = cacheKey(record);
      if (fetchedRef.current.has(key)) continue;
      fetchedRef.current.add(key);

      const q = `${record.artist} ${record.title} vinyl record`;
      fetch(`/api/ebay/search?q=${encodeURIComponent(q)}&limit=5`)
        .then(r => {
          if (!r.ok) return null;
          return r.json();
        })
        .then((data: { itemSummaries?: { price?: { value: string } }[] } | null) => {
          if (!data?.itemSummaries?.length) return;
          const vals = data.itemSummaries
            .map(i => parseFloat(i.price?.value ?? ''))
            .filter(p => !isNaN(p));
          if (vals.length === 0) return;
          setPrices(prev => ({
            ...prev,
            [key]: { min: Math.min(...vals), max: Math.max(...vals) },
          }));
        })
        .catch(() => {});
    }
  }, [records]);

  return prices;
}
