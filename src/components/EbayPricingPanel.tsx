import React, { useState, useEffect } from 'react';

interface EbayItem {
  title: string;
  itemWebUrl: string;
  price: {
    value: string;
    currency: string;
  };
}

interface EbaySearchResponse {
  itemSummaries?: EbayItem[];
}

interface EbayPricingPanelProps {
  query: string;
}

const EbayPricingPanel: React.FC<EbayPricingPanelProps> = ({ query }) => {
  const [items, setItems] = useState<EbayItem[]>([]);
  const [priceRange, setPriceRange] = useState<{ min: number; max: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!query) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setItems([]);
    setPriceRange(null);

    fetch(`/api/ebay/search?q=${encodeURIComponent(query)}&limit=5`)
      .then((r) => {
        if (r.status === 503 || !r.ok) return null;
        return r.json() as Promise<EbaySearchResponse>;
      })
      .then((data) => {
        if (!data?.itemSummaries?.length) return;

        const summaries = data.itemSummaries;
        setItems(summaries);

        const prices = summaries
          .map((i) => parseFloat(i.price?.value))
          .filter((p) => !isNaN(p));

        if (prices.length > 0) {
          setPriceRange({ min: Math.min(...prices), max: Math.max(...prices) });
        }
      })
      .catch(() => {
        // Silently fail
      })
      .finally(() => setLoading(false));
  }, [query]);

  if (loading) {
    return (
      <section className="p-6 rounded-2xl bg-[#dd6e42]/5 border border-[#dd6e42]/10 space-y-4">
        <h4 className="text-[#f0a882] text-[10px] font-label tracking-[0.3em] uppercase">
          eBay Listings
        </h4>
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 border-2 border-[#dd6e42]/40 border-t-[#dd6e42] rounded-full animate-spin" />
          <span className="text-th-text3/70 text-[9px] uppercase tracking-widest">Loading...</span>
        </div>
      </section>
    );
  }

  if (items.length === 0) return null;

  const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  return (
    <section className="p-6 rounded-2xl bg-[#dd6e42]/5 border border-[#dd6e42]/10 space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-[#f0a882] text-[10px] font-label tracking-[0.3em] uppercase">
          eBay Listings
        </h4>
        <span className="text-th-text3 text-[9px] uppercase tracking-widest">Fixed Price</span>
      </div>

      {priceRange && (
        <p className="text-th-text2 text-sm">
          Price range:{' '}
          <span className="font-bold text-th-text">{fmt(priceRange.min)}</span>
          {' – '}
          <span className="font-bold text-[#f0a882]">{fmt(priceRange.max)}</span>
        </p>
      )}

      <div className="space-y-2">
        {items.map((item, i) => (
          <a
            key={i}
            href={item.itemWebUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`View ${item.title} on eBay`}
            className="flex items-start justify-between gap-3 p-3 rounded-xl bg-th-surface/[0.04] border border-th-surface/[0.08] hover:border-[#dd6e42]/30 transition-colors group"
          >
            <span className="text-th-text2 text-xs leading-snug line-clamp-2 group-hover:text-th-text transition-colors">
              {item.title}
            </span>
            <span className="text-th-text font-bold text-sm whitespace-nowrap shrink-0">
              ${parseFloat(item.price?.value || '0').toFixed(2)}
            </span>
          </a>
        ))}
      </div>

      <a
        href={`https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(query)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#f0a882] text-[10px] uppercase tracking-widest hover:text-[#dd6e42] transition-colors inline-block"
      >
        View on eBay &rarr;
      </a>
    </section>
  );
};

export default EbayPricingPanel;
