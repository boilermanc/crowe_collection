import React, { useState, useRef, useEffect } from 'react';
import { BarChart3, Bell, Compass, TrendingUp, Wrench } from 'lucide-react';
import type { ViewMode } from '../hooks/useAppNavigation';
import type { GatedFeature } from '../contexts/SubscriptionContext';

interface NavToolsDropdownProps {
  currentView: ViewMode;
  setCurrentView: React.Dispatch<React.SetStateAction<ViewMode>>;
  canUse: (feature: GatedFeature) => boolean;
  setUpgradeFeature: (feature: string | null) => void;
  navigate: (path: string) => void;
  wantlistCount: number;
  priceAlertCount: number;
}

/* ── shared menu-item renderer ── */

const menuItem = (
  label: string,
  icon: React.ReactNode,
  onClick: () => void,
  options?: { active?: boolean; locked?: boolean; badge?: number },
) => {
  const { active = false, locked = false, badge } = options || {};
  return (
    <button
      key={label}
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all ${
        active
          ? 'bg-[#dd6e42]/20 text-[#f0a882] font-semibold'
          : 'text-th-text2 hover:bg-th-surface/[0.08] hover:text-th-text'
      }`}
    >
      <span className="w-5 h-5 flex-shrink-0 relative">
        {icon}
        {locked && (
          <span className="absolute -top-1 -right-1.5 w-3 h-3 rounded-full bg-th-accent/80 flex items-center justify-center">
            <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </span>
        )}
      </span>
      <span className="flex-1 text-left">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="bg-[#dd6e42] text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
          {badge}
        </span>
      )}
    </button>
  );
};

/* ── shared hook: close on outside click + Escape ── */

function useDropdownClose(
  ref: React.RefObject<HTMLDivElement | null>,
  isOpen: boolean,
  close: () => void,
) {
  useEffect(() => {
    if (!isOpen) return;
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [isOpen, ref, close]);

  useEffect(() => {
    if (!isOpen) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [isOpen, close]);
}

const PANEL_CLASS =
  'absolute right-0 top-full mt-2 w-52 rounded-2xl border border-th-surface/[0.15] p-2 z-50 shadow-2xl bg-th-bg2';

/* ── Browse dropdown ── */

const BrowseDropdown: React.FC<NavToolsDropdownProps> = ({
  currentView, setCurrentView, navigate, wantlistCount,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = React.useCallback(() => setIsOpen(false), []);
  useDropdownClose(ref, isOpen, close);

  const browseViews: ViewMode[] = ['stakkd', 'discogs', 'wantlist'];
  const isActive = browseViews.includes(currentView);

  const nav = (view: ViewMode) => { setCurrentView(view); setIsOpen(false); };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex p-3 rounded-full border transition-all flex-shrink-0 relative ${
          isActive || isOpen
            ? 'bg-[#dd6e42] border-[#dd6e42] text-th-text shadow-lg'
            : 'bg-th-surface/[0.04] border-th-surface/[0.10] text-th-text2 hover:text-th-text'
        }`}
        title="Browse"
        aria-label="Browse menu"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Compass className="w-5 h-5" />
        {wantlistCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-[#dd6e42] text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
            {wantlistCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className={PANEL_CLASS}>
          {menuItem('Listening Room', <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>, () => { navigate('/listening-room'); setIsOpen(false); })}
          {menuItem('Stakkd', <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" /><circle cx="12" cy="14" r="4" /><circle cx="12" cy="6" r="2" /></svg>, () => nav('stakkd'), { active: currentView === 'stakkd' })}
          {menuItem('Browse Discogs', <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" /><path d="M12 2a10 10 0 0 1 7.07 2.93" /><path d="M12 6a6 6 0 0 1 4.24 1.76" /></svg>, () => nav('discogs'), { active: currentView === 'discogs' })}
          {menuItem('Wantlist', <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="M12 11h4" /><path d="M12 16h4" /><path d="M8 11h.01" /><path d="M8 16h.01" /></svg>, () => nav('wantlist'), { active: currentView === 'wantlist', badge: wantlistCount })}
          {menuItem('Spins', <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M6 8.5a6 6 0 0 1 12 0c0 3-2 4.5-2 7a2 2 0 0 1-2 2h-1a1 1 0 0 1-1-1v-1" /><path d="M10.5 8.5a1.5 1.5 0 0 1 3 0c0 1.5-1.5 2-1.5 3.5" /></svg>, () => nav('spins'), { active: currentView === 'spins' })}
        </div>
      )}
    </div>
  );
};

/* ── Tools dropdown ── */

const ToolsDropdown: React.FC<NavToolsDropdownProps> = ({
  currentView, setCurrentView, canUse, setUpgradeFeature, priceAlertCount,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = React.useCallback(() => setIsOpen(false), []);
  useDropdownClose(ref, isOpen, close);

  const toolViews: ViewMode[] = ['value-dashboard', 'analytics', 'price-alerts', 'shelves', 'bulk-import'];
  const isActive = toolViews.includes(currentView);

  const nav = (view: ViewMode, gatedFeature?: GatedFeature) => {
    if (gatedFeature && !canUse(gatedFeature)) {
      setUpgradeFeature(gatedFeature);
      setIsOpen(false);
      return;
    }
    setCurrentView(view);
    setIsOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex p-3 rounded-full border transition-all flex-shrink-0 relative ${
          isActive || isOpen
            ? 'bg-[#dd6e42] border-[#dd6e42] text-th-text shadow-lg'
            : 'bg-th-surface/[0.04] border-th-surface/[0.10] text-th-text2 hover:text-th-text'
        }`}
        title="Tools"
        aria-label="Tools menu"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Wrench className="w-5 h-5" />
        {priceAlertCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-[#dd6e42] text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
            {priceAlertCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className={PANEL_CLASS}>
          {menuItem('Collection Value', <TrendingUp className="w-5 h-5" />, () => nav('value-dashboard'), { active: currentView === 'value-dashboard' })}
          {menuItem('Analytics', <BarChart3 className="w-5 h-5" />, () => nav('analytics', 'analytics'), { active: currentView === 'analytics', locked: !canUse('analytics') })}
          {menuItem('Price Alerts', <Bell className="w-5 h-5" />, () => nav('price-alerts'), { active: currentView === 'price-alerts', badge: priceAlertCount })}
          {menuItem('Shelves', <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>, () => nav('shelves', 'shelf_organizer'), { active: currentView === 'shelves', locked: !canUse('shelf_organizer') })}
          {menuItem('Import / Export', <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>, () => nav('bulk-import', 'bulk_import'), { active: currentView === 'bulk-import', locked: !canUse('bulk_import') })}
        </div>
      )}
    </div>
  );
};

/* ── Combined export ── */

const NavToolsDropdowns: React.FC<NavToolsDropdownProps> = (props) => (
  <>
    <BrowseDropdown {...props} />
    <ToolsDropdown {...props} />
  </>
);

export default NavToolsDropdowns;
