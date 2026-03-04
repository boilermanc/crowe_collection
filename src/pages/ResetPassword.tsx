import React, { useState, useEffect, useCallback, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabaseService';
import SEO from '../components/SEO';
import Turnstile from '../components/Turnstile';
import './ResetPassword.css';

const ResetPassword: React.FC = () => {
  // Mode: 'request' = email form, 'reset' = new password form
  const [mode, setMode] = useState<'request' | 'reset'>('request');

  // Request mode state
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  // Reset mode state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  // Listen for PASSWORD_RECOVERY event from Supabase
  useEffect(() => {
    if (!supabase) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setMode('reset');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Validation
  const passwordLongEnough = newPassword.length >= 8;
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const passwordValid = passwordLongEnough && passwordsMatch;

  const handleTurnstileVerify = useCallback((token: string) => setTurnstileToken(token), []);
  const handleTurnstileExpire = useCallback(() => setTurnstileToken(null), []);

  // Request password reset email
  const handleRequestReset = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!supabase) {
      setError('Database connection is not available.');
      return;
    }
    if (!email.trim()) {
      setError('Email is required.');
      return;
    }
    if (!turnstileToken) {
      setError('Please complete the verification challenge.');
      return;
    }

    setLoading(true);
    try {
      // Verify Turnstile server-side first
      const verifyRes = await fetch('/api/auth/verify-turnstile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ turnstileToken }),
      });
      if (!verifyRes.ok) {
        const data = await verifyRes.json().catch(() => ({}));
        setTurnstileToken(null);
        throw new Error(data.error || 'Verification failed. Please try again.');
      }

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin + '/reset-password',
      });
      if (resetError) throw resetError;

      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  // Set new password
  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    setResetError(null);

    if (!supabase) {
      setResetError('Database connection is not available.');
      return;
    }
    if (!passwordLongEnough) {
      setResetError('Password must be at least 8 characters.');
      return;
    }
    if (!passwordsMatch) {
      setResetError('Passwords do not match.');
      return;
    }

    setResetting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setResetSuccess(true);
    } catch (err: unknown) {
      setResetError(err instanceof Error ? err.message : 'Failed to update password.');
    } finally {
      setResetting(false);
    }
  };

  const logoSvg = (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill="#3a525d"/>
      <circle cx="12" cy="12" r="9.5" fill="none" stroke="#4f6d7a" strokeWidth="0.4" opacity="0.5"/>
      <circle cx="12" cy="12" r="8" fill="none" stroke="#4f6d7a" strokeWidth="0.3" opacity="0.4"/>
      <circle cx="12" cy="12" r="6.5" fill="none" stroke="#4f6d7a" strokeWidth="0.3" opacity="0.3"/>
      <circle cx="12" cy="12" r="5.2" fill="#2a3d46"/>
      <text x="12" y="12.5" textAnchor="middle" dominantBaseline="central" fontFamily="Georgia,serif" fontWeight="bold" fontSize="7" fill="#dd6e42">R</text>
    </svg>
  );

  const passwordToggleIcon = (visible: boolean) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="#dd6e42" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="7.5" stroke="#dd6e42" strokeWidth="0.75" opacity="0.5" />
      <circle cx="12" cy="12" r="5.5" stroke="#dd6e42" strokeWidth="0.75" opacity="0.4" />
      <circle cx="12" cy="12" r="3.5" fill="#c45a30" opacity="0.4" />
      <circle cx="12" cy="12" r="1.2" fill="#dd6e42" />
      {visible && (
        <line x1="4" y1="4" x2="20" y2="20" stroke="#c45a30" strokeWidth="2" strokeLinecap="round" />
      )}
    </svg>
  );

  return (
    <div className="reset-password-page">
      <SEO
        title="Reset Password — Rekkrd"
        description="Reset your Rekkrd account password."
      />

      <Link to="/" className="reset-logo">
        {logoSvg}
        <span>Rekk<span>r</span>d</span>
      </Link>

      <div className="reset-card">
        {/* REQUEST MODE — Email form */}
        {mode === 'request' && !submitted && (
          <>
            <h1>Reset Password</h1>
            <p className="reset-subtitle">
              Enter your email and we&rsquo;ll send you a reset link.
            </p>

            <div aria-live="polite">
              {error && <p className="reset-error" role="alert">{error}</p>}
            </div>

            <form onSubmit={handleRequestReset} role="form" aria-label="Request password reset">
              <div className="reset-field">
                <label htmlFor="reset-email">Email</label>
                <input
                  id="reset-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>

              <Turnstile
                onVerify={handleTurnstileVerify}
                onExpire={handleTurnstileExpire}
                resetKey="reset-password"
              />

              <button
                type="submit"
                className="reset-submit"
                disabled={loading || !turnstileToken}
              >
                {loading ? 'Sending\u2026' : 'Send Reset Link'}
              </button>
            </form>

            <div className="reset-back">
              <Link to="/">Back to sign in</Link>
            </div>
          </>
        )}

        {/* REQUEST SUCCESS — Check email message */}
        {mode === 'request' && submitted && (
          <div className="reset-success">
            <div className="reset-success-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M22 4L12 13L2 4" />
              </svg>
            </div>
            <h2>Check Your Email</h2>
            <p>
              If an account exists with that email, you&rsquo;ll receive a password reset link shortly.
            </p>
            <Link to="/" className="reset-link">Back to sign in</Link>
          </div>
        )}

        {/* RESET MODE — New password form */}
        {mode === 'reset' && !resetSuccess && (
          <>
            <h1>Set New Password</h1>
            <p className="reset-subtitle">
              Choose a new password for your account.
            </p>

            <div aria-live="polite">
              {resetError && <p className="reset-error" role="alert">{resetError}</p>}
            </div>

            <form onSubmit={handleResetPassword} role="form" aria-label="Set new password">
              <div className="reset-field">
                <label htmlFor="reset-new-password">New Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="reset-new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder={'\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022'}
                    style={{ paddingRight: 40 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(v => !v)}
                    className="reset-password-toggle"
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    {passwordToggleIcon(showNewPassword)}
                  </button>
                </div>
              </div>

              <div className="reset-field">
                <label htmlFor="reset-confirm-password">Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="reset-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder={'\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022'}
                    style={{ paddingRight: 40 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(v => !v)}
                    className="reset-password-toggle"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    {passwordToggleIcon(showConfirmPassword)}
                  </button>
                </div>
              </div>

              {newPassword.length > 0 && (
                <div className="reset-validation">
                  <span className={passwordLongEnough ? 'valid' : 'invalid'}>
                    {passwordLongEnough ? '\u2713' : '\u2022'} At least 8 characters
                  </span>
                  {confirmPassword.length > 0 && (
                    <span className={passwordsMatch ? 'valid' : 'invalid'}>
                      {passwordsMatch ? '\u2713' : '\u2022'} Passwords match
                    </span>
                  )}
                </div>
              )}

              <button
                type="submit"
                className="reset-submit"
                disabled={resetting || !passwordValid}
              >
                {resetting ? 'Updating\u2026' : 'Update Password'}
              </button>
            </form>
          </>
        )}

        {/* RESET SUCCESS */}
        {mode === 'reset' && resetSuccess && (
          <div className="reset-success">
            <div className="reset-success-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <h2>Password Updated</h2>
            <p>
              Your password has been changed successfully. You can now sign in with your new password.
            </p>
            <Link to="/" className="reset-link">Go to Rekkrd</Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
