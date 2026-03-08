import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import SpenndHeader from '../components/spennd/SpenndHeader';
import SpenndTool from '../components/spennd/SpenndTool';

const SpenndLandingPage: React.FC = () => {
  const scrollToTool = () => {
    const toolSection = document.getElementById('tool');
    if (toolSection) {
      toolSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Set Spennd favicon and title
  useEffect(() => {
    const prevTitle = document.title;
    document.title = 'Spennd — Know what your record is worth';

    const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement
      ?? document.createElement('link');
    const prevHref = link.href;
    link.rel = 'icon';
    link.href = '/spennd-favicon.svg';
    document.head.appendChild(link);

    return () => {
      document.title = prevTitle;
      link.href = prevHref || '/favicon.ico';
    };
  }, []);

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <SpenndHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section aria-labelledby="spennd-hero-heading" className="pt-12 pb-20 md:pt-20 md:pb-28 px-6">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-10 md:gap-16">
            <div className="flex-1 text-center md:text-left">
              <h1
                id="spennd-hero-heading"
                className="font-display text-[clamp(1.75rem,6vw,2.25rem)] md:text-5xl lg:text-6xl leading-tight text-ink"
              >
                Know what your record is worth.
              </h1>
              <p className="mt-5 text-lg md:text-xl text-ink/80 max-w-lg mx-auto md:mx-0">
                In about 3 minutes. For free. No account, no Discogs login, no jargon — we walk you through everything.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start">
                <button
                  onClick={scrollToTool}
                  className="px-7 py-3 min-h-[44px] bg-[#5a8a6e] text-white font-medium rounded hover:bg-[#3d6b54] transition-colors text-base"
                >
                  Check My Record
                </button>
                <a
                  href="#how-it-works"
                  onClick={(e) => { e.preventDefault(); document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' }); }}
                  className="text-[#5a8a6e] font-medium hover:text-[#3d6b54] transition-colors text-base min-h-[44px] inline-flex items-center"
                >
                  See how it works
                </a>
              </div>
            </div>
            <div className="flex-shrink-0">
              <svg
                viewBox="0 0 320 320"
                className="w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 max-w-full"
                aria-hidden="true"
                role="img"
              >
                <circle cx="160" cy="160" r="156" fill="#5a8a6e" opacity="0.08" />
                <circle cx="160" cy="160" r="140" fill="none" stroke="#5a8a6e" strokeWidth="0.5" opacity="0.15" />
                <circle cx="160" cy="160" r="120" fill="none" stroke="#5a8a6e" strokeWidth="0.5" opacity="0.18" />
                <circle cx="160" cy="160" r="100" fill="none" stroke="#5a8a6e" strokeWidth="0.5" opacity="0.22" />
                <circle cx="160" cy="160" r="80" fill="none" stroke="#5a8a6e" strokeWidth="0.5" opacity="0.25" />
                <circle cx="160" cy="160" r="60" fill="none" stroke="#5a8a6e" strokeWidth="0.5" opacity="0.28" />
                <circle cx="160" cy="160" r="40" fill="#5a8a6e" opacity="0.1" />
                <text
                  x="160" y="172" textAnchor="middle"
                  fontFamily="Playfair Display, Georgia, serif"
                  fontSize="48" fontWeight="700" fill="#5a8a6e" opacity="0.25"
                >$</text>
              </svg>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="bg-paper-dark py-16 px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="font-display text-[28px] text-ink text-center mb-10">
              Three steps. Plain English.
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1 */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="font-display text-[48px] text-[#5a8a6e]">1</div>
                <h3 className="font-serif text-[16px] font-bold text-ink mt-2">
                  Find your record
                </h3>
                <p className="font-serif text-[15px] text-ink/80 mt-2">
                  Type the artist and title. We search Discogs' 8 million+ release database and show you matching pressings.
                </p>
              </div>

              {/* Card 2 */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="font-display text-[48px] text-[#5a8a6e]">2</div>
                <h3 className="font-serif text-[16px] font-bold text-ink mt-2">
                  Identify your pressing
                </h3>
                <p className="font-serif text-[15px] text-ink/80 mt-2">
                  We show you exactly where to look on the record and what to read. The pressing determines real value more than anything else.
                </p>
              </div>

              {/* Card 3 */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="font-display text-[48px] text-[#5a8a6e]">3</div>
                <h3 className="font-serif text-[16px] font-bold text-ink mt-2">
                  Grade the condition
                </h3>
                <p className="font-serif text-[15px] text-ink/80 mt-2">
                  A few quick questions with clear instructions. Hold it under a light — we guide you step by step.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Strip */}
        <section className="bg-paper py-10 text-center px-6">
          <p className="font-serif text-base text-ink mb-3">
            Prices come from two independent sources:
          </p>

          <div className="flex justify-center flex-wrap gap-3">
            <span className="border border-[#5a8a6e] text-[#5a8a6e] font-mono text-[13px] rounded-full px-3 py-1">
              Discogs Marketplace
            </span>
            <span className="border border-[#5a8a6e] text-[#5a8a6e] font-mono text-[13px] rounded-full px-3 py-1">
              eBay Completed Sales
            </span>
          </div>

          <p className="font-serif italic text-[15px] text-ink/80 mt-3">
            Real transactions — not asking prices, not estimates.
          </p>
        </section>

        {/* Tool Section */}
        <section id="tool" className="bg-paper py-16 px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-display text-[28px] text-ink mb-8 text-center">
              Let's check your record
            </h2>
            <SpenndTool />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer role="contentinfo" className="border-t border-ink/10 pt-12 pb-8 mt-12 px-6 max-w-5xl mx-auto w-full">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <a href="https://rekkrd.com" className="inline-flex items-center gap-2 mb-3">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="11" fill="#3a525d"/>
                <circle cx="12" cy="12" r="9.5" fill="none" stroke="#4f6d7a" strokeWidth="0.4" opacity="0.5"/>
                <circle cx="12" cy="12" r="8" fill="none" stroke="#4f6d7a" strokeWidth="0.3" opacity="0.4"/>
                <circle cx="12" cy="12" r="6.5" fill="none" stroke="#4f6d7a" strokeWidth="0.3" opacity="0.3"/>
                <circle cx="12" cy="12" r="5.2" fill="#2a3d46"/>
                <text x="12" y="12.5" textAnchor="middle" dominantBaseline="central" fontFamily="Georgia,serif" fontWeight="bold" fontSize="7" fill="#dd6e42">R</text>
              </svg>
              <span className="font-display text-lg text-ink">Rekk<span className="text-[#c45a30]">r</span>d</span>
            </a>
            <p className="text-sm text-ink/70 leading-relaxed">
              The AI-powered vinyl collection manager for serious crate diggers and casual collectors alike.
            </p>
          </div>

          {/* Products */}
          <div>
            <h4 className="font-medium text-sm text-ink mb-3">Products</h4>
            <ul className="space-y-2 text-sm text-ink/70">
              <li><Link to="/sellr" className="hover:text-[#5a8a6e] transition-colors">Sel<span className="text-[#4f6d7a]">l</span>r</Link></li>
              <li><a href="https://rekkrd.com#features" className="hover:text-[#5a8a6e] transition-colors">Features</a></li>
              <li><a href="https://rekkrd.com#pricing" className="hover:text-[#5a8a6e] transition-colors">Pricing</a></li>
              <li><a href="https://rekkrd.com#playlist" className="hover:text-[#5a8a6e] transition-colors">Playlists</a></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-medium text-sm text-ink mb-3">Resources</h4>
            <ul className="space-y-2 text-sm text-ink/70">
              <li><a href="https://rekkrd.com#faq" className="hover:text-[#5a8a6e] transition-colors">FAQ</a></li>
              <li><a href="https://rekkrd.com/support" className="hover:text-[#5a8a6e] transition-colors">Support</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-medium text-sm text-ink mb-3">Company</h4>
            <ul className="space-y-2 text-sm text-ink/70">
              <li><a href="https://rekkrd.com/blog" className="hover:text-[#5a8a6e] transition-colors">Blog</a></li>
              <li><a href="https://rekkrd.com/privacy" className="hover:text-[#5a8a6e] transition-colors">Privacy</a></li>
              <li><a href="https://rekkrd.com/terms" className="hover:text-[#5a8a6e] transition-colors">Terms</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-ink/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-ink/60">
          <span>&copy; {new Date().getFullYear()} <a href="https://www.sweetwater.technology" target="_blank" rel="noopener noreferrer" className="hover:text-ink/60 transition-colors">Sweetwater Technology</a></span>
          <span>Made with &#9829; for vinyl lovers</span>
        </div>
      </footer>
    </div>
  );
};

export default SpenndLandingPage;
