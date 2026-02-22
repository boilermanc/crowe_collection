
import React, { useState, useEffect } from 'react';
import { CheckCircle, Disc3, Trash2 } from 'lucide-react';
import { WantlistItem } from '../types';
import { proxyImageUrl } from '../services/imageProxy';

interface WantlistCardProps {
  item: WantlistItem;
  onRemove: (id: string) => void;
  onMarkAsOwned: (item: WantlistItem) => void;
  isInCollection?: boolean;
}

function formatRelativeDate(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffMs = now - then;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 1) return 'today';
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;

  const d = new Date(dateString);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

const WantlistCard: React.FC<WantlistCardProps> = ({ item, onRemove, onMarkAsOwned, isInCollection }) => {
  const hasPrices = item.price_low !== null || item.price_median !== null || item.price_high !== null;
  const [confirmingOwned, setConfirmingOwned] = useState(false);

  useEffect(() => {
    if (!confirmingOwned) return;
    const timer = setTimeout(() => setConfirmingOwned(false), 4000);
    return () => clearTimeout(timer);
  }, [confirmingOwned]);

  return (
    <div className="group relative glass-morphism rounded-xl overflow-hidden hover:neon-border transition-all duration-300 transform hover:-translate-y-1 border border-th-surface/[0.06]">
      <div className="aspect-square overflow-hidden bg-th-bg/40 relative">
        {item.cover_url ? (
          <img
            src={proxyImageUrl(item.cover_url)}
            alt={`Album cover for ${item.title} by ${item.artist}`}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        <div className={`${item.cover_url ? 'hidden' : ''} absolute inset-0 flex items-center justify-center`}>
          <Disc3 className="w-16 h-16 text-th-text3/30" />
        </div>

        {isInCollection && (
          <div className="absolute top-2 left-2 bg-green-500/80 backdrop-blur-sm text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide shadow-lg z-10 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Owned
          </div>
        )}

        {item.price_median !== null && (
          <div className="absolute bottom-2 left-2 bg-[#dd6e42]/90 backdrop-blur-sm text-th-text px-2 py-0.5 rounded text-[10px] font-bold shadow-lg z-10 border border-[#f0a882]/50">
            ${Math.round(item.price_median)}
          </div>
        )}

        <div className="absolute inset-0 bg-[#c45a30]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      <div className="p-4 relative">
        <h3 className="font-bold text-th-text truncate w-full" title={item.title}>{item.title}</h3>
        <p className="text-[#dd6e42] text-sm font-medium truncate">{item.artist}</p>

        <div className="mt-2 flex items-center justify-between text-[10px] text-th-text3 uppercase tracking-widest">
          <span>{item.year || 'No Date'}</span>
          <span>{item.genre || 'Vinyl'}</span>
        </div>

        {hasPrices && (
          <div className="mt-3 pt-3 border-t border-th-surface/[0.08]">
            <div className="flex items-center justify-between text-[10px]">
              {item.price_low !== null && (
                <div className="text-center">
                  <span className="block text-th-text3 uppercase tracking-wider">Low</span>
                  <span className="block text-[#dd6e42] font-bold">${Math.round(item.price_low)}</span>
                </div>
              )}
              {item.price_median !== null && (
                <div className="text-center">
                  <span className="block text-th-text3 uppercase tracking-wider">Med</span>
                  <span className="block text-[#dd6e42] font-bold">${Math.round(item.price_median)}</span>
                </div>
              )}
              {item.price_high !== null && (
                <div className="text-center">
                  <span className="block text-th-text3 uppercase tracking-wider">High</span>
                  <span className="block text-[#dd6e42] font-bold">${Math.round(item.price_high)}</span>
                </div>
              )}
            </div>
            {item.prices_updated_at && (
              <p className="text-[9px] text-th-text3/60 mt-1 text-center">
                Updated {formatRelativeDate(item.prices_updated_at)}
              </p>
            )}
          </div>
        )}

        <div className="mt-3 flex gap-2">
          {confirmingOwned ? (
            <>
              <button
                onClick={() => { onMarkAsOwned(item); setConfirmingOwned(false); }}
                className="flex-1 flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-medium py-2 px-3 rounded-lg transition-colors"
                aria-label={`Confirm mark ${item.artist} - ${item.title} as owned`}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Confirm?
              </button>
              <button
                onClick={() => setConfirmingOwned(false)}
                className="text-th-text3 text-xs px-2 py-2 rounded-lg hover:text-th-text transition-colors"
                aria-label="Cancel mark as owned"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setConfirmingOwned(true)}
                disabled={isInCollection}
                className={`flex-1 flex items-center justify-center gap-1.5 bg-[#dd6e42] text-th-text text-xs font-medium py-2 px-3 rounded-lg transition-colors ${isInCollection ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#c45a30]'}`}
                aria-label={`Mark ${item.artist} - ${item.title} as owned`}
                title={isInCollection ? 'Already in your collection' : undefined}
              >
                <Disc3 className="w-3.5 h-3.5" />
                Mark as Owned
              </button>
              <button
                onClick={() => onRemove(item.id)}
                className="flex items-center justify-center text-th-text3 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-th-surface/[0.08]"
                aria-label={`Remove ${item.artist} - ${item.title} from wantlist`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(WantlistCard);
