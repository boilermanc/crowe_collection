import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

const SpenndHeader: React.FC = () => {
  const [sellrOpen, setSellrOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!sellrOpen) return;
    const handleMouseDown = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setSellrOpen(false);
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [sellrOpen]);

  return (
    <header className="bg-paper border-b border-paper-dark sticky top-0 z-50 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left side — Spennd brand */}
        <Link to="/spennd" className="flex items-center gap-2">
          <img src="/spennd-icon.svg" width={32} height={32} alt="Spennd" />
          <span className="font-display text-[22px] text-ink font-semibold">Spennd</span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Sellr dropdown — hidden on xs */}
          <div ref={dropdownRef} className="relative hidden sm:flex items-center">
            <button
              onClick={() => setSellrOpen(!sellrOpen)}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              {/* Sellr icon — inline SVG vinyl record in blue-slate */}
              <svg width="24" height="24" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <radialGradient id="sellrRecordGrad" cx="40%" cy="38%" r="55%">
                    <stop offset="0%" stopColor="#6a8a96"/>
                    <stop offset="100%" stopColor="#2e4f5a"/>
                  </radialGradient>
                  <radialGradient id="sellrLabelGrad" cx="40%" cy="36%" r="60%">
                    <stop offset="0%" stopColor="#7a9daa"/>
                    <stop offset="100%" stopColor="#4f6d7a"/>
                  </radialGradient>
                </defs>
                <circle cx="50" cy="50" r="44" fill="url(#sellrRecordGrad)"/>
                <circle cx="50" cy="50" r="42" fill="none" stroke="#1e3540" strokeWidth="0.6" opacity="0.9"/>
                <circle cx="50" cy="50" r="38" fill="none" stroke="#1e3540" strokeWidth="0.5" opacity="0.8"/>
                <circle cx="50" cy="50" r="33" fill="none" stroke="#1e3540" strokeWidth="0.5" opacity="0.7"/>
                <circle cx="50" cy="50" r="28" fill="none" stroke="#1e3540" strokeWidth="0.45" opacity="0.6"/>
                <circle cx="50" cy="50" r="23" fill="none" stroke="#1e3540" strokeWidth="0.4" opacity="0.5"/>
                <circle cx="50" cy="50" r="16" fill="url(#sellrLabelGrad)"/>
                <circle cx="50" cy="50" r="16" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.6"/>
                <circle cx="50" cy="50" r="4" fill="#1e3540" opacity="0.6"/>
              </svg>

              {/* Sellr wordmark */}
              <div className="flex flex-col items-start leading-tight">
                <span className="font-mono text-sm font-semibold text-[#4f6d7a] tracking-wide">Sellr</span>
                <span className="font-mono text-[10px] text-[#4f6d7a]/60 tracking-wide">vinyl appraisals</span>
              </div>

              {/* Chevron */}
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                className={`transition-transform duration-200 ${sellrOpen ? 'rotate-180' : ''}`}
              >
                <path d="M2 4l4 4 4-4" stroke="#4f6d7a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {/* Dropdown panel */}
            <div
              className={`absolute top-full right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-paper-dark p-5 z-50 transition-all duration-200 ${
                sellrOpen
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-1 pointer-events-none'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <img src="/spennd-icon.svg" width={20} height={20} alt="" />
                <span className="font-mono text-[14px] text-[#4f6d7a] font-semibold">Sellr</span>
              </div>

              <p className="font-serif text-[13px] text-ink/60 mb-4">
                The vinyl appraisal marketplace. List your records for appraisal, get real offers from collectors.
              </p>

              <Link to="/sellr" onClick={() => setSellrOpen(false)}>
                <button className="w-full bg-[#4f6d7a] text-white rounded-full py-2.5 px-4 font-mono text-[12px] font-medium hover:opacity-90 transition-opacity">
                  Explore Sellr →
                </button>
              </Link>

              <Link to="/signup" onClick={() => setSellrOpen(false)}>
                <button className="w-full mt-2 border border-[#5a8a6e] text-[#5a8a6e] rounded-full py-2.5 px-4 font-mono text-[12px] font-medium hover:bg-[#5a8a6e]/10 transition-colors">
                  Sign Up Free →
                </button>
              </Link>
            </div>
          </div>

          {/* Sign Up button */}
          <Link
            to="/signup"
            className="bg-[#5a8a6e] text-white rounded-full py-1.5 px-3 sm:py-2 sm:px-4 font-mono text-[12px] font-medium hover:bg-[#3d6b54] transition-colors"
          >
            Sign Up Free →
          </Link>
        </div>
      </div>
    </header>
  );
};

export default SpenndHeader;
