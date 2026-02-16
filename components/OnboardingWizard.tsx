import React, { useState } from 'react';
import { updateProfile } from '../services/profileService';

interface OnboardingWizardProps {
  userId: string;
  onComplete: (action: 'add' | 'explore') => void;
}

const STEPS = ['Welcome', 'Your Habits', 'Feature Tour', 'Get Started'] as const;

const GENRE_OPTIONS = [
  'Rock', 'Jazz', 'Hip-Hop', 'Electronic', 'Classical', 'Blues',
  'R&B/Soul', 'Country', 'Folk', 'Punk', 'Metal', 'Pop',
  'Reggae', 'Latin', 'Funk', 'World',
] as const;

const SETUP_OPTIONS = [
  { id: 'dedicated', emoji: '\uD83C\uDF9B\uFE0F', label: 'Dedicated Setup', desc: 'Turntable, receiver, speakers' },
  { id: 'casual', emoji: '\uD83C\uDFA7', label: 'Casual Listener', desc: 'Portable / bluetooth' },
  { id: 'new', emoji: '\uD83C\uDD95', label: 'Just Getting Started', desc: 'No setup yet' },
] as const;

const GOAL_OPTIONS = [
  { id: 'listener', emoji: '\uD83C\uDFB5', label: 'Casual Listener', desc: 'I just play what I like' },
  { id: 'completionist', emoji: '\uD83D\uDCC0', label: 'Completionist', desc: 'Gotta have every pressing' },
  { id: 'investor', emoji: '\uD83D\uDCB0', label: 'Investor', desc: 'Tracking value and rare finds' },
  { id: 'curator', emoji: '\uD83C\uDFA8', label: 'Curator', desc: "It's about the art and experience" },
] as const;

type SetupId = typeof SETUP_OPTIONS[number]['id'];
type GoalId = typeof GOAL_OPTIONS[number]['id'];

const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ userId, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const [animKey, setAnimKey] = useState(0);

  // Step 2 state — lifted to wizard level so it persists across navigation
  const [selectedGenres, setSelectedGenres] = useState<Set<string>>(new Set());
  const [selectedSetup, setSelectedSetup] = useState<SetupId | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<GoalId | null>(null);

  const isFirst = currentStep === 0;
  const isLast = currentStep === STEPS.length - 1;

  const isStep2Valid = selectedGenres.size > 0 && selectedSetup !== null && selectedGoal !== null;
  const canAdvance = currentStep !== 1 || isStep2Valid;

  const goNext = () => {
    if (!canAdvance) return;
    // On the last step, the CTAs inside StepGetStarted handle completion
    if (isLast) return;
    setDirection('forward');
    setAnimKey(k => k + 1);
    setCurrentStep(s => s + 1);
  };

  const goBack = () => {
    if (isFirst) return;
    setDirection('back');
    setAnimKey(k => k + 1);
    setCurrentStep(s => s - 1);
  };

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev => {
      const next = new Set(prev);
      if (next.has(genre)) next.delete(genre);
      else next.add(genre);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-emerald-500/5 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        {/* Progress indicator */}
        <div
          className="flex items-center justify-center gap-2 mb-8"
          role="progressbar"
          aria-label={`Onboarding progress, step ${currentStep + 1} of ${STEPS.length}`}
          aria-valuenow={currentStep + 1}
          aria-valuemin={1}
          aria-valuemax={STEPS.length}
        >
          {STEPS.map((label, i) => (
            <div
              key={label}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === currentStep
                  ? 'w-8 bg-emerald-500'
                  : i < currentStep
                    ? 'w-4 bg-emerald-500/40'
                    : 'w-4 bg-white/10'
              }`}
              title={label}
            />
          ))}
        </div>

        {/* Card */}
        <div className="glass-morphism rounded-3xl border border-white/10 p-8 md:p-10 min-h-[360px] flex flex-col">
          {/* Step content with fade transition */}
          <div
            key={animKey}
            className={`flex-1 flex flex-col ${
              direction === 'forward'
                ? 'animate-in fade-in slide-in-from-bottom-4'
                : 'animate-in fade-in'
            } duration-500`}
          >
            {currentStep === 0 && <StepWelcome />}
            {currentStep === 1 && (
              <StepHabits
                selectedGenres={selectedGenres}
                selectedSetup={selectedSetup}
                selectedGoal={selectedGoal}
                onToggleGenre={toggleGenre}
                onSelectSetup={setSelectedSetup}
                onSelectGoal={setSelectedGoal}
              />
            )}
            {currentStep === 2 && <StepFeatureTour />}
            {currentStep === 3 && (
              <StepGetStarted
                userId={userId}
                selectedGenres={selectedGenres}
                selectedSetup={selectedSetup}
                selectedGoal={selectedGoal}
                onComplete={onComplete}
              />
            )}
          </div>

          {/* Navigation buttons — hidden on last step (CTAs are in the step itself) */}
          {!isLast && (
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/5">
              {!isFirst ? (
                <button
                  type="button"
                  onClick={goBack}
                  className="px-5 py-2.5 rounded-full text-sm text-white/50 hover:text-white hover:bg-white/5 transition-all"
                  aria-label={`Back to ${STEPS[currentStep - 1]}`}
                >
                  Back
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-3">
                {currentStep === 1 && !canAdvance && (
                  <span className="text-white/20 text-[10px] tracking-wide">
                    Select all sections to continue
                  </span>
                )}
                <button
                  type="button"
                  onClick={goNext}
                  disabled={!canAdvance}
                  className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all shadow-lg ${
                    canAdvance
                      ? 'bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white hover:shadow-emerald-500/20'
                      : 'bg-white/5 text-white/20 cursor-not-allowed shadow-none'
                  }`}
                  aria-label={`Next: ${STEPS[currentStep + 1]}`}
                  aria-disabled={!canAdvance}
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Back button only on last step */}
          {isLast && (
            <div className="mt-6 pt-4 border-t border-white/5">
              <button
                type="button"
                onClick={goBack}
                className="px-5 py-2.5 rounded-full text-sm text-white/50 hover:text-white hover:bg-white/5 transition-all"
                aria-label={`Back to ${STEPS[currentStep - 1]}`}
              >
                Back
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Step 1: Welcome ─── */
const StepWelcome: React.FC = () => (
  <div className="flex flex-col items-center justify-center text-center flex-1">
    <div className="mb-6" aria-hidden="true">
      <svg
        className="w-16 h-16 animate-spin-vinyl opacity-30"
        viewBox="0 0 400 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="200" cy="200" r="195" fill="#fff" />
        {[175, 155, 135, 115, 95].map(r => (
          <circle key={r} cx="200" cy="200" r={r} stroke="#000" strokeWidth="0.8" opacity="0.3" />
        ))}
        <circle cx="200" cy="200" r="58" fill="#10b981" opacity="0.6" />
        <circle cx="200" cy="200" r="6" fill="#050505" />
      </svg>
    </div>

    <h2 className="font-syncopate text-2xl md:text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60 mb-3">
      REKKRD
    </h2>
    <p className="text-white/40 text-sm md:text-base tracking-wide mb-4">
      Your vinyl collection, organized.
    </p>
    <p className="text-white/25 text-xs md:text-sm max-w-xs leading-relaxed">
      Scan album covers with AI, build your digital crate, and generate playlists from what you actually own.
    </p>

    <p className="mt-8 text-emerald-500/60 text-[10px] font-syncopate tracking-[0.3em] uppercase animate-pulse">
      Let's get started
    </p>
  </div>
);

/* ─── Step 2: Your Habits ─── */
interface StepHabitsProps {
  selectedGenres: Set<string>;
  selectedSetup: SetupId | null;
  selectedGoal: GoalId | null;
  onToggleGenre: (genre: string) => void;
  onSelectSetup: (id: SetupId) => void;
  onSelectGoal: (id: GoalId) => void;
}

const StepHabits: React.FC<StepHabitsProps> = ({
  selectedGenres,
  selectedSetup,
  selectedGoal,
  onToggleGenre,
  onSelectSetup,
  onSelectGoal,
}) => (
  <div className="flex flex-col gap-6 flex-1 overflow-y-auto -mx-2 px-2">
    <h3 className="font-syncopate text-xs tracking-widest uppercase font-bold text-white/60 text-center">
      Tell us about your habits
    </h3>

    {/* Favorite Genres */}
    <div>
      <p className="text-[10px] font-syncopate text-white/40 tracking-widest uppercase mb-3">
        Favorite Genres
        {selectedGenres.size > 0 && (
          <span className="ml-2 text-emerald-500/60">({selectedGenres.size})</span>
        )}
      </p>
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="Select your favorite genres"
      >
        {GENRE_OPTIONS.map(genre => {
          const selected = selectedGenres.has(genre);
          return (
            <button
              key={genre}
              type="button"
              role="switch"
              aria-checked={selected}
              onClick={() => onToggleGenre(genre)}
              className={`px-3.5 py-1.5 rounded-full text-[11px] tracking-wide transition-all duration-200 border ${
                selected
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.15)] scale-105'
                  : 'bg-white/[0.03] border-white/10 text-white/40 hover:border-white/20 hover:text-white/60'
              }`}
            >
              {genre}
            </button>
          );
        })}
      </div>
    </div>

    {/* Listening Setup */}
    <div>
      <p className="text-[10px] font-syncopate text-white/40 tracking-widest uppercase mb-3">
        Listening Setup
      </p>
      <div
        className="grid grid-cols-3 gap-2"
        role="radiogroup"
        aria-label="Select your listening setup"
      >
        {SETUP_OPTIONS.map(opt => {
          const selected = selectedSetup === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onSelectSetup(opt.id)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all duration-200 ${
                selected
                  ? 'bg-emerald-500/10 border-emerald-500/40 shadow-[0_0_16px_rgba(16,185,129,0.12)] scale-[1.03]'
                  : 'bg-white/[0.02] border-white/10 hover:border-white/20'
              }`}
            >
              <span className="text-xl" aria-hidden="true">{opt.emoji}</span>
              <span className={`text-[10px] font-semibold tracking-wide ${selected ? 'text-emerald-300' : 'text-white/50'}`}>
                {opt.label}
              </span>
              <span className="text-[9px] text-white/20 leading-tight text-center">
                {opt.desc}
              </span>
            </button>
          );
        })}
      </div>
    </div>

    {/* Collecting Goals */}
    <div>
      <p className="text-[10px] font-syncopate text-white/40 tracking-widest uppercase mb-3">
        Collecting Goal
      </p>
      <div
        className="grid grid-cols-2 gap-2"
        role="radiogroup"
        aria-label="Select your collecting goal"
      >
        {GOAL_OPTIONS.map(opt => {
          const selected = selectedGoal === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onSelectGoal(opt.id)}
              className={`flex items-center gap-3 p-3 rounded-2xl border transition-all duration-200 text-left ${
                selected
                  ? 'bg-emerald-500/10 border-emerald-500/40 shadow-[0_0_16px_rgba(16,185,129,0.12)] scale-[1.02]'
                  : 'bg-white/[0.02] border-white/10 hover:border-white/20'
              }`}
            >
              <span className="text-xl flex-shrink-0" aria-hidden="true">{opt.emoji}</span>
              <div className="min-w-0">
                <span className={`text-[11px] font-semibold tracking-wide block ${selected ? 'text-emerald-300' : 'text-white/50'}`}>
                  {opt.label}
                </span>
                <span className="text-[9px] text-white/20 leading-tight">
                  {opt.desc}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  </div>
);

/* ─── Step 3: Feature Tour ─── */
const FEATURES = [
  {
    title: 'Add Albums',
    desc: 'Scan, search, or manually add albums to your collection',
    preview: 'album-card',
  },
  {
    title: 'AI-Powered Details',
    desc: 'Get descriptions, tracklists, and price estimates powered by AI',
    preview: 'album-detail',
  },
  {
    title: 'Playlist Studio',
    desc: 'Create and organize playlists from your collection',
    preview: 'playlist',
  },
  {
    title: 'Track & Explore',
    desc: 'Filter by genre, condition, favorites — know your collection',
    preview: 'filters',
  },
] as const;

type FeaturePreview = typeof FEATURES[number]['preview'];

const FeaturePreviewCard: React.FC<{ type: FeaturePreview }> = ({ type }) => {
  if (type === 'album-card') {
    return (
      <div className="flex gap-3 items-start">
        {/* Mock cover art */}
        <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-900 flex-shrink-0 flex items-center justify-center overflow-hidden">
          <svg className="w-8 h-8 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-bold text-white/80 truncate">Kind of Blue</p>
          <p className="text-[10px] text-white/40">Miles Davis</p>
          <p className="text-[9px] text-white/20 mt-0.5">1959 &middot; Jazz</p>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400/80 text-[8px] tracking-wide">Near Mint</span>
            <span className="px-2 py-0.5 rounded-full bg-white/5 text-white/30 text-[8px]">$38</span>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'album-detail') {
    return (
      <div className="space-y-2.5">
        <p className="text-[9px] text-white/50 leading-relaxed italic">
          "A landmark modal jazz recording that redefined improvisation. Davis assembled an iconic sextet to create music of extraordinary beauty and restraint."
        </p>
        <div className="border-t border-white/5 pt-2">
          <p className="text-[8px] font-syncopate text-white/30 tracking-widest uppercase mb-1.5">Tracklist</p>
          {['So What', 'Freddie Freeloader', 'Blue in Green', 'All Blues'].map((t, i) => (
            <div key={t} className="flex items-center justify-between py-0.5">
              <span className="text-[9px] text-white/40"><span className="text-white/20 mr-1.5">{i + 1}.</span>{t}</span>
              <span className="text-[8px] text-white/15">{['9:22', '9:46', '5:27', '11:33'][i]}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3 pt-1 border-t border-white/5">
          <div>
            <p className="text-[8px] text-white/20">Low</p>
            <p className="text-[10px] text-white/40">$22</p>
          </div>
          <div>
            <p className="text-[8px] text-emerald-500/50">Median</p>
            <p className="text-[10px] text-emerald-400/70 font-semibold">$38</p>
          </div>
          <div>
            <p className="text-[8px] text-white/20">High</p>
            <p className="text-[10px] text-white/40">$65</p>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'playlist') {
    return (
      <div>
        <div className="flex items-center gap-2 mb-2.5">
          <span className="px-2.5 py-1 rounded-full bg-pink-500/15 text-pink-400/80 text-[8px] tracking-wide font-semibold">Late Night Jazz</span>
        </div>
        {[
          { n: '01', title: 'So What', artist: 'Miles Davis' },
          { n: '02', title: 'Take Five', artist: 'Dave Brubeck' },
          { n: '03', title: "'Round Midnight", artist: 'Thelonious Monk' },
          { n: '04', title: 'A Love Supreme Pt. I', artist: 'John Coltrane' },
        ].map(tr => (
          <div key={tr.n} className="flex items-center gap-2.5 py-1.5 border-b border-white/[0.03] last:border-0">
            <span className="text-[9px] text-white/15 w-4 text-right">{tr.n}</span>
            <div className="w-6 h-6 rounded bg-gradient-to-br from-white/10 to-white/[0.02] flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-white/60 truncate">{tr.title}</p>
              <p className="text-[8px] text-white/25 truncate">{tr.artist}</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // filters
  return (
    <div className="space-y-3">
      <div>
        <p className="text-[8px] font-syncopate text-white/30 tracking-widest uppercase mb-2">Genre</p>
        <div className="flex flex-wrap gap-1.5">
          {['Jazz', 'Rock', 'Soul', 'Electronic'].map((g, i) => (
            <span
              key={g}
              className={`px-2.5 py-1 rounded-full text-[9px] tracking-wide border ${
                i < 2
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300/80'
                  : 'bg-white/[0.03] border-white/10 text-white/30'
              }`}
            >
              {g}
            </span>
          ))}
        </div>
      </div>
      <div>
        <p className="text-[8px] font-syncopate text-white/30 tracking-widest uppercase mb-2">Condition</p>
        <div className="flex flex-wrap gap-1.5">
          {['Mint', 'Near Mint', 'Very Good+'].map((c, i) => (
            <span
              key={c}
              className={`px-2.5 py-1 rounded-full text-[9px] tracking-wide border ${
                i === 1
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300/80'
                  : 'bg-white/[0.03] border-white/10 text-white/30'
              }`}
            >
              {c}
            </span>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2 pt-1">
        <div className="w-8 h-4 rounded-full bg-emerald-600 relative">
          <div className="absolute top-0.5 left-4 w-3 h-3 bg-white rounded-full" />
        </div>
        <span className="text-[9px] text-white/40">Favorites only</span>
      </div>
    </div>
  );
};

const StepFeatureTour: React.FC = () => {
  const [featureIdx, setFeatureIdx] = useState(0);
  const feature = FEATURES[featureIdx];

  const goPrev = () => setFeatureIdx(i => (i - 1 + FEATURES.length) % FEATURES.length);
  const goFeatureNext = () => setFeatureIdx(i => (i + 1) % FEATURES.length);

  return (
    <div className="flex flex-col flex-1">
      <h3 className="font-syncopate text-xs tracking-widest uppercase font-bold text-white/60 text-center mb-5">
        Feature Tour
      </h3>

      {/* Carousel tabs */}
      <div className="flex items-center justify-center gap-1.5 mb-4" role="tablist" aria-label="Feature tour navigation">
        {FEATURES.map((f, i) => (
          <button
            key={f.title}
            type="button"
            role="tab"
            aria-selected={i === featureIdx}
            aria-label={f.title}
            onClick={() => setFeatureIdx(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === featureIdx ? 'w-6 bg-emerald-500' : 'w-3 bg-white/15 hover:bg-white/25'
            }`}
          />
        ))}
      </div>

      {/* Feature content */}
      <div
        role="tabpanel"
        aria-label={feature.title}
        aria-live="polite"
        className="flex-1 flex flex-col"
      >
        <div className="text-center mb-4">
          <p className="text-sm font-semibold text-white/80">{feature.title}</p>
          <p className="text-[11px] text-white/30 mt-0.5">{feature.desc}</p>
        </div>

        {/* Preview box */}
        <div className="flex-1 relative rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden p-4">
          <div className="origin-top-left scale-[0.85]">
            <FeaturePreviewCard type={feature.preview} />
          </div>
        </div>
      </div>

      {/* Carousel arrow buttons */}
      <div className="flex items-center justify-between mt-4">
        <button
          type="button"
          onClick={goPrev}
          className="p-2 rounded-full text-white/30 hover:text-white/60 hover:bg-white/5 transition-all"
          aria-label="Previous feature"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-[9px] text-white/20 tracking-widest">
          {featureIdx + 1} / {FEATURES.length}
        </span>
        <button
          type="button"
          onClick={goFeatureNext}
          className="p-2 rounded-full text-white/30 hover:text-white/60 hover:bg-white/5 transition-all"
          aria-label="Next feature"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};

/* ─── Step 4: Get Started ─── */
interface StepGetStartedProps {
  userId: string;
  selectedGenres: Set<string>;
  selectedSetup: SetupId | null;
  selectedGoal: GoalId | null;
  onComplete: (action: 'add' | 'explore') => void;
}

const StepGetStarted: React.FC<StepGetStartedProps> = ({
  userId,
  selectedGenres,
  selectedSetup,
  selectedGoal,
  onComplete,
}) => {
  const [saving, setSaving] = useState<'add' | 'explore' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const setupLabel = SETUP_OPTIONS.find(o => o.id === selectedSetup)?.label ?? '';
  const goalOption = GOAL_OPTIONS.find(o => o.id === selectedGoal);

  const handleFinish = async (action: 'add' | 'explore') => {
    setSaving(action);
    setError(null);
    try {
      await updateProfile(userId, {
        favorite_genres: [...selectedGenres],
        listening_setup: selectedSetup,
        collecting_goal: selectedGoal,
        onboarding_completed: true,
      });
    } catch (err) {
      console.error('Failed to save onboarding profile:', err);
      setError('Could not save your preferences, but you can update them later in your profile.');
    }
    // Always proceed — don't block entry to the app
    onComplete(action);
  };

  return (
    <div className="flex flex-col items-center flex-1">
      <h3 className="font-syncopate text-xs tracking-widest uppercase font-bold text-white/60 text-center mb-2">
        You're all set!
      </h3>
      <p className="text-white/25 text-[11px] text-center mb-6">
        Here's what we know about you
      </p>

      {/* Selection summary */}
      <div className="w-full space-y-4 mb-6">
        {/* Genres */}
        {selectedGenres.size > 0 && (
          <div>
            <p className="text-[9px] font-syncopate text-white/30 tracking-widest uppercase mb-2">Your Genres</p>
            <div className="flex flex-wrap gap-1.5">
              {[...selectedGenres].map(g => (
                <span
                  key={g}
                  className="px-2.5 py-1 rounded-full text-[9px] tracking-wide bg-emerald-500/15 border border-emerald-500/30 text-emerald-300/80"
                >
                  {g}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Setup & Goal side by side */}
        <div className="grid grid-cols-2 gap-3">
          {selectedSetup && (
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3 text-center">
              <p className="text-[9px] font-syncopate text-white/30 tracking-widest uppercase mb-1">Setup</p>
              <p className="text-[11px] text-white/60 font-semibold">{setupLabel}</p>
            </div>
          )}
          {goalOption && (
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3 text-center">
              <p className="text-[9px] font-syncopate text-white/30 tracking-widest uppercase mb-1">Goal</p>
              <p className="text-[11px] text-white/60 font-semibold">{goalOption.label}</p>
            </div>
          )}
        </div>
      </div>

      {/* Error message */}
      <div aria-live="assertive" className="w-full min-h-[20px] mb-2">
        {error && (
          <p className="text-amber-400/80 text-[10px] text-center" role="alert">
            {error}
          </p>
        )}
      </div>

      {/* CTA buttons */}
      <div className="w-full flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={() => handleFinish('add')}
          disabled={saving !== null}
          className="flex-1 px-6 py-3 rounded-full text-sm font-semibold bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white transition-all shadow-lg hover:shadow-emerald-500/20 disabled:opacity-60 disabled:cursor-wait flex items-center justify-center gap-2"
          aria-label="Add your first album"
        >
          {saving === 'add' ? (
            <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )}
          Add Your First Album
        </button>

        <button
          type="button"
          onClick={() => handleFinish('explore')}
          disabled={saving !== null}
          className="flex-1 px-6 py-3 rounded-full text-sm font-semibold border border-white/15 text-white/60 hover:text-white hover:bg-white/5 transition-all disabled:opacity-60 disabled:cursor-wait flex items-center justify-center gap-2"
          aria-label="Explore the app"
        >
          {saving === 'explore' ? (
            <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          )}
          Explore the App
        </button>
      </div>

      <p className="text-white/15 text-[9px] mt-5 text-center">
        You can update these anytime in your profile
      </p>
    </div>
  );
};

export default OnboardingWizard;
