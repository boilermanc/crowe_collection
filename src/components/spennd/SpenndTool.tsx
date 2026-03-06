import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { DiscogsRelease, LabelValidation, MatrixResult, PriceData, EbayData } from '../../types/spennd';
import { ConditionGrade } from '../../constants/conditionGrades';

type Step = 'search' | 'label' | 'matrix' | 'grading' | 'results';

const SpenndTool: React.FC = () => {
  // State
  const [step, setStep] = useState<Step>('search');
  const [recordsChecked, setRecordsChecked] = useState(0);
  const [nudgeDismissed, setNudgeDismissed] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<DiscogsRelease[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedRelease, setSelectedRelease] = useState<DiscogsRelease | null>(null);

  // Label state
  const [labelInputs, setLabelInputs] = useState({
    labelName: '',
    catalog: '',
    year: '',
    yearUnknown: false,
    country: '',
    countryUnknown: false
  });
  const [labelValidation, setLabelValidation] = useState<LabelValidation | null>(null);

  // Matrix, grading, results state (placeholders for now)
  const [matrixResult, setMatrixResult] = useState<MatrixResult | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<'vinyl' | 'cd' | null>(null);
  const [grade, setGrade] = useState<ConditionGrade | null>(null);
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [ebayData, setEbayData] = useState<EbayData | null>(null);

  // Step 1: Search
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearchLoading(true);
    setSearchError(null);
    setSearchResults([]);

    try {
      const response = await fetch(`/api/spennd/search?q=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) throw new Error('Search failed');

      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      setSearchError("We're having trouble reaching the database. Try again in a moment.");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSelectRelease = (release: DiscogsRelease) => {
    setSelectedRelease(release);
    setStep('label');
  };

  // Step 2a: Label
  const handleLabelSubmit = async () => {
    if (!selectedRelease) return;

    try {
      const params = new URLSearchParams({
        release_id: selectedRelease.id.toString(),
        catalog: labelInputs.catalog,
        country: labelInputs.country
      });

      const response = await fetch(`/api/spennd/label-validate?${params}`);
      const data: LabelValidation = await response.json();

      setLabelValidation(data);

      // Show validation result briefly, then advance
      setTimeout(() => {
        setStep('matrix');
      }, 1500);
    } catch (error) {
      console.error('Label validation error:', error);
      setStep('matrix');
    }
  };

  // Detect promo/white label
  const hasPromoKeyword = [labelInputs.labelName, labelInputs.catalog].some(val =>
    /promo|not for sale|promotional/i.test(val)
  );
  const hasWhiteLabelKeyword = /white label|white/i.test(labelInputs.labelName);

  // Render based on step
  if (step === 'search') {
    return (
      <div className="max-w-xl mx-auto bg-paper rounded-2xl p-8 shadow-sm">
        <h3 className="font-display text-[24px] text-ink mb-2">
          What record do you have?
        </h3>
        <p className="font-serif text-[14px] text-ink/60 mb-4">
          Type the artist and album title
        </p>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="e.g. Elvis Costello Armed Forces"
          className="w-full bg-paper-dark rounded-xl py-3 px-4 font-serif text-ink focus:outline-none focus:ring-2 focus:ring-burnt-peach"
        />

        <button
          onClick={handleSearch}
          disabled={searchLoading}
          className="mt-3 bg-burnt-peach text-white rounded-full py-2 px-5 font-serif hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          Search →
        </button>

        {searchLoading && (
          <div className="flex justify-center mt-4">
            <Loader2 className="animate-spin text-burnt-peach" size={24} />
          </div>
        )}

        {searchError && (
          <div className="mt-4 bg-amber-50 rounded-xl p-3 border border-amber-200">
            <p className="text-amber-800 font-serif text-[13px]">{searchError}</p>
            <button
              onClick={handleSearch}
              className="mt-2 text-burnt-peach font-serif text-[13px] underline"
            >
              Retry
            </button>
          </div>
        )}

        {searchResults.length > 0 && (
          <>
            <div className="mt-4 flex flex-col gap-2">
              {searchResults.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleSelectRelease(result)}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-paper-dark transition-colors text-left"
                >
                  <img
                    src={result.thumb || '/placeholder-vinyl.png'}
                    alt=""
                    className="w-10 h-10 rounded-lg object-cover bg-paper-dark"
                  />
                  <div className="flex-1">
                    <div className="font-serif text-[14px] text-ink font-medium">
                      {result.artist} — {result.title}
                    </div>
                    <div className="font-mono text-[11px] text-ink/60">
                      {result.year} · {result.label} · {result.country}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <p className="mt-3 font-serif text-[13px] italic text-ink/60">
              Seeing multiple versions? That's normal. The same album was often pressed in different countries and years — each pressing has a different value. We'll help you figure out which one you have next.
            </p>
          </>
        )}

        {!searchLoading && searchResults.length === 0 && searchQuery && !searchError && (
          <p className="mt-3 font-serif text-[13px] italic text-ink/60">
            Nothing found. Try simpler — just the artist name, or just the album title. Leave out words like 'the' or 'and'.
          </p>
        )}
      </div>
    );
  }

  if (step === 'label') {
    return (
      <div className="max-w-xl mx-auto bg-paper rounded-2xl p-8 shadow-sm">
        <button
          onClick={() => {
            setSelectedRelease(null);
            setStep('search');
          }}
          className="text-sm text-ink/60 underline mb-4"
        >
          ← Change record
        </button>

        <h3 className="font-display text-[22px] text-ink mt-4 mb-2">
          Let's read your label first
        </h3>

        <p className="font-serif text-[14px] italic text-ink/60 mb-4">
          Before we look at the matrix, the label on your record already tells us a lot. Pick up the record, look at the center paper label, and answer these questions.
        </p>

        <div className="bg-pearl-beige rounded-xl p-3 mb-5">
          <p className="font-serif text-[13px] text-ink">
            📌 Make sure you're reading the label on the actual vinyl record — not the cardboard sleeve or cover.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {/* Label Name */}
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-wide text-ink/60 mb-1">
              Label Name
            </label>
            <input
              type="text"
              value={labelInputs.labelName}
              onChange={(e) => setLabelInputs(prev => ({ ...prev, labelName: e.target.value }))}
              placeholder="e.g. Columbia, Parlophone, Warner Bros."
              className="w-full bg-paper-dark rounded-xl py-2 px-3 font-serif text-ink focus:outline-none focus:ring-2 focus:ring-burnt-peach"
            />
            <p className="mt-1 font-serif text-[12px] text-ink/60">
              The company name printed on the center label — usually at the top.
            </p>
          </div>

          {/* Catalog Number */}
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-wide text-ink/60 mb-1">
              Catalog Number
            </label>
            <input
              type="text"
              value={labelInputs.catalog}
              onChange={(e) => setLabelInputs(prev => ({ ...prev, catalog: e.target.value }))}
              placeholder="e.g. JC 35709 or BSK 3010"
              className="w-full bg-paper-dark rounded-xl py-2 px-3 font-serif text-ink focus:outline-none focus:ring-2 focus:ring-burnt-peach"
            />
            <p className="mt-1 font-serif text-[12px] text-ink/60">
              Usually on the left or right side of the label. Includes letters and numbers.
            </p>
          </div>

          {/* Year */}
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-wide text-ink/60 mb-1">
              Year
            </label>
            <input
              type="text"
              value={labelInputs.year}
              onChange={(e) => setLabelInputs(prev => ({ ...prev, year: e.target.value }))}
              disabled={labelInputs.yearUnknown}
              placeholder="e.g. 1979"
              className="w-full bg-paper-dark rounded-xl py-2 px-3 font-serif text-ink focus:outline-none focus:ring-2 focus:ring-burnt-peach disabled:opacity-50"
            />
            <label className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                checked={labelInputs.yearUnknown}
                onChange={(e) => setLabelInputs(prev => ({ ...prev, yearUnknown: e.target.checked, year: '' }))}
                className="rounded"
              />
              <span className="font-serif text-[12px] text-ink">Can't find a year</span>
            </label>
          </div>

          {/* Country */}
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-wide text-ink/60 mb-1">
              Country
            </label>
            <input
              type="text"
              value={labelInputs.country}
              onChange={(e) => setLabelInputs(prev => ({ ...prev, country: e.target.value }))}
              disabled={labelInputs.countryUnknown}
              placeholder="e.g. Made in USA"
              className="w-full bg-paper-dark rounded-xl py-2 px-3 font-serif text-ink focus:outline-none focus:ring-2 focus:ring-burnt-peach disabled:opacity-50"
            />
            <label className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                checked={labelInputs.countryUnknown}
                onChange={(e) => setLabelInputs(prev => ({ ...prev, countryUnknown: e.target.checked, country: '' }))}
                className="rounded"
              />
              <span className="font-serif text-[12px] text-ink">Doesn't say</span>
            </label>
          </div>
        </div>

        {/* Special detection callouts */}
        {hasPromoKeyword && (
          <div className="mt-4 bg-pearl-beige rounded-xl p-3">
            <p className="font-serif text-[13px] text-ink">
              Promo copies were pressed for radio stations before commercial release. They can be more collectible and may have different matrix strings.
            </p>
          </div>
        )}

        {hasWhiteLabelKeyword && (
          <div className="mt-4 bg-pearl-beige rounded-xl p-3">
            <p className="font-serif text-[13px] text-ink">
              White labels are usually test pressings or very early promos — sometimes rare and valuable.
            </p>
          </div>
        )}

        <button
          onClick={handleLabelSubmit}
          className="mt-6 w-full bg-burnt-peach text-white rounded-full py-3 px-6 font-serif hover:opacity-90 transition-opacity"
        >
          Next: Find the Matrix →
        </button>

        {labelValidation && (
          <div className={`mt-4 rounded-xl p-3 ${labelValidation.confirmed ? 'bg-green-50 border border-green-200' : 'bg-paper-dark'}`}>
            <p className={`font-serif text-[13px] ${labelValidation.confirmed ? 'text-green-800' : 'text-ink/60'}`}>
              {labelValidation.confirmed ? '✓ Label confirmed' : "We'll continue — the matrix may tell us more."}
            </p>
          </div>
        )}
      </div>
    );
  }

  // Placeholder for matrix/grading/results
  return (
    <div className="max-w-xl mx-auto bg-paper rounded-2xl p-8 shadow-sm">
      <p className="text-ink font-serif">Step {step} - will be implemented in next prompts</p>
    </div>
  );
};

export default SpenndTool;
