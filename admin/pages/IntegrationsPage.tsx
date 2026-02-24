import React, { useEffect, useState, useCallback } from 'react';
import { adminService } from '../../services/adminService';

// ── Types ────────────────────────────────────────────────────────────

type StripeMode = 'test' | 'live';

interface ModeKeys {
  secret_key: string;
  publishable_key: string;
  webhook_secret: string;
  sellr_webhook_secret: string;
  price_curator_monthly: string;
  price_curator_annual: string;
  price_enthusiast_monthly: string;
  price_enthusiast_annual: string;
}

const EMPTY_KEYS: ModeKeys = {
  secret_key: '',
  publishable_key: '',
  webhook_secret: '',
  sellr_webhook_secret: '',
  price_curator_monthly: '',
  price_curator_annual: '',
  price_enthusiast_monthly: '',
  price_enthusiast_annual: '',
};

// ── Component ────────────────────────────────────────────────────────

const IntegrationsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [testingTest, setTestingTest] = useState(false);
  const [testingLive, setTestingLive] = useState(false);
  const [testResult, setTestResult] = useState<{ mode: StripeMode; success: boolean; message: string } | null>(null);

  const [mode, setMode] = useState<StripeMode>('live');
  const [testKeys, setTestKeys] = useState<ModeKeys>({ ...EMPTY_KEYS });
  const [liveKeys, setLiveKeys] = useState<ModeKeys>({ ...EMPTY_KEYS });
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  // ── Load ──────────────────────────────────────────────────────────

  useEffect(() => {
    adminService.getIntegrationSettings('stripe')
      .then((settings) => {
        setMode((settings.stripe_mode as StripeMode) || 'live');

        const loadKeys = (prefix: string): ModeKeys => ({
          secret_key: (settings[`${prefix}secret_key`] as string) || '',
          publishable_key: (settings[`${prefix}publishable_key`] as string) || '',
          webhook_secret: (settings[`${prefix}webhook_secret`] as string) || '',
          sellr_webhook_secret: (settings[`${prefix}sellr_webhook_secret`] as string) || '',
          price_curator_monthly: (settings[`${prefix}price_curator_monthly`] as string) || '',
          price_curator_annual: (settings[`${prefix}price_curator_annual`] as string) || '',
          price_enthusiast_monthly: (settings[`${prefix}price_enthusiast_monthly`] as string) || '',
          price_enthusiast_annual: (settings[`${prefix}price_enthusiast_annual`] as string) || '',
        });

        setTestKeys(loadKeys('stripe_test_'));
        setLiveKeys(loadKeys('stripe_live_'));
      })
      .catch((err) => console.error('Failed to load Stripe settings:', err))
      .finally(() => setLoading(false));
  }, []);

  // ── Save ──────────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaveMessage(null);
    try {
      const settings: Record<string, { value: string; dataType: string }> = {
        stripe_mode: { value: mode, dataType: 'string' },
      };

      const addKeys = (prefix: string, keys: ModeKeys) => {
        for (const [k, v] of Object.entries(keys)) {
          settings[`${prefix}${k}`] = { value: v, dataType: 'string' };
        }
      };

      addKeys('stripe_test_', testKeys);
      addKeys('stripe_live_', liveKeys);

      await adminService.saveIntegrationSettings(settings, 'stripe');
      setSaveMessage('Settings saved!');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      setSaveMessage('Failed to save settings');
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  }, [mode, testKeys, liveKeys]);

  // ── Test ──────────────────────────────────────────────────────────

  const handleTest = useCallback(async (testMode: StripeMode) => {
    const setter = testMode === 'test' ? setTestingTest : setTestingLive;
    setter(true);
    setTestResult(null);
    try {
      const key = testMode === 'test' ? testKeys.secret_key : liveKeys.secret_key;
      const result = await adminService.testIntegration('stripe', { secret_key: key });
      setTestResult({ mode: testMode, ...result });
    } catch (err) {
      setTestResult({
        mode: testMode,
        success: false,
        message: err instanceof Error ? err.message : 'Test failed',
      });
    } finally {
      setter(false);
    }
  }, [testKeys.secret_key, liveKeys.secret_key]);

  // ── Mode switch ───────────────────────────────────────────────────

  const handleModeSwitch = useCallback((newMode: StripeMode) => {
    if (newMode === mode) return;
    const confirmed = window.confirm(
      `Switch to ${newMode.toUpperCase()} mode?\n\nThis affects all new checkouts for both Rekkrd and Sellr. In-progress payments will complete in their original mode.`
    );
    if (confirmed) setMode(newMode);
  }, [mode]);

  // ── Helpers ───────────────────────────────────────────────────────

  const toggleShow = (fieldId: string) => {
    setShowSecrets((prev) => ({ ...prev, [fieldId]: !prev[fieldId] }));
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="w-6 h-6 border-2 border-[rgb(99,102,241)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: 'rgb(17,24,39)' }}>Integrations</h1>
          <p className="text-sm mt-1" style={{ color: 'rgb(107,114,128)' }}>Manage Stripe keys for Rekkrd and Sellr</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          style={{ backgroundColor: 'rgb(99,102,241)', color: 'white' }}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {/* Mode Toggle */}
      <div className="rounded-xl border mb-6" style={{ backgroundColor: 'rgb(255,255,255)', borderColor: 'rgb(229,231,235)' }}>
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: mode === 'live' ? 'rgb(34,197,94)' : 'rgb(234,179,8)' }}
            />
            <div>
              <span className="text-base font-semibold" style={{ color: 'rgb(17,24,39)' }}>
                Active Mode: {mode === 'live' ? 'Live' : 'Test'}
              </span>
              {mode === 'test' && (
                <p className="text-xs" style={{ color: 'rgb(234,179,8)' }}>
                  Test mode — no real charges will be processed
                </p>
              )}
            </div>
          </div>
          <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: 'rgb(209,213,219)' }}>
            <button
              onClick={() => handleModeSwitch('test')}
              className="px-4 py-2 text-sm font-medium transition-colors"
              style={{
                backgroundColor: mode === 'test' ? 'rgb(234,179,8)' : 'transparent',
                color: mode === 'test' ? 'white' : 'rgb(107,114,128)',
              }}
            >
              Test
            </button>
            <button
              onClick={() => handleModeSwitch('live')}
              className="px-4 py-2 text-sm font-medium transition-colors"
              style={{
                backgroundColor: mode === 'live' ? 'rgb(34,197,94)' : 'transparent',
                color: mode === 'live' ? 'white' : 'rgb(107,114,128)',
              }}
            >
              Live
            </button>
          </div>
        </div>
      </div>

      {/* Key Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <KeySection
          title="Test Keys"
          mode="test"
          isActive={mode === 'test'}
          keys={testKeys}
          onChange={setTestKeys}
          showSecrets={showSecrets}
          toggleShow={toggleShow}
          testing={testingTest}
          onTest={() => handleTest('test')}
          testResult={testResult?.mode === 'test' ? testResult : null}
        />
        <KeySection
          title="Live Keys"
          mode="live"
          isActive={mode === 'live'}
          keys={liveKeys}
          onChange={setLiveKeys}
          showSecrets={showSecrets}
          toggleShow={toggleShow}
          testing={testingLive}
          onTest={() => handleTest('live')}
          testResult={testResult?.mode === 'live' ? testResult : null}
        />
      </div>

      {/* Save feedback toast */}
      {saveMessage && (
        <div
          className="fixed bottom-4 right-4 px-4 py-3 rounded-xl shadow-lg z-50 flex items-center gap-2 text-sm font-medium text-white"
          style={{
            backgroundColor: saveMessage.includes('Failed') ? 'rgb(239,68,68)' : 'rgb(34,197,94)',
          }}
        >
          {saveMessage}
        </div>
      )}
    </div>
  );
};

// ── Key Section ──────────────────────────────────────────────────────

interface KeySectionProps {
  title: string;
  mode: StripeMode;
  isActive: boolean;
  keys: ModeKeys;
  onChange: React.Dispatch<React.SetStateAction<ModeKeys>>;
  showSecrets: Record<string, boolean>;
  toggleShow: (id: string) => void;
  testing: boolean;
  onTest: () => void;
  testResult: { success: boolean; message: string } | null;
}

const KeySection: React.FC<KeySectionProps> = ({
  title, mode, isActive, keys, onChange, showSecrets, toggleShow, testing, onTest, testResult,
}) => {
  const update = (field: keyof ModeKeys, value: string) => {
    onChange((prev) => ({ ...prev, [field]: value }));
  };

  const borderColor = isActive ? 'rgb(99,102,241)' : 'rgb(229,231,235)';

  return (
    <div
      className="rounded-xl border"
      style={{ backgroundColor: 'rgb(255,255,255)', borderColor, borderWidth: isActive ? 2 : 1 }}
    >
      <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'rgb(229,231,235)' }}>
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold" style={{ color: 'rgb(17,24,39)' }}>{title}</h3>
          {isActive && (
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ backgroundColor: 'rgb(238,242,255)', color: 'rgb(99,102,241)' }}
            >
              Active
            </span>
          )}
        </div>
      </div>

      <div className="px-6 py-5 space-y-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgb(107,114,128)' }}>
          API Keys
        </h4>
        <SecretField label="Secret Key" id={`${mode}_sk`} value={keys.secret_key} show={showSecrets[`${mode}_sk`]} onToggle={() => toggleShow(`${mode}_sk`)} onChange={(v) => update('secret_key', v)} placeholder={`sk_${mode}_...`} />
        <SecretField label="Publishable Key" id={`${mode}_pk`} value={keys.publishable_key} show={showSecrets[`${mode}_pk`]} onToggle={() => toggleShow(`${mode}_pk`)} onChange={(v) => update('publishable_key', v)} placeholder={`pk_${mode}_...`} />

        <h4 className="text-xs font-semibold uppercase tracking-wider pt-2" style={{ color: 'rgb(107,114,128)' }}>
          Webhook Secrets
        </h4>
        <SecretField label="Rekkrd (Subscriptions)" id={`${mode}_wh`} value={keys.webhook_secret} show={showSecrets[`${mode}_wh`]} onToggle={() => toggleShow(`${mode}_wh`)} onChange={(v) => update('webhook_secret', v)} placeholder="whsec_..." />
        <SecretField label="Sellr (Payments)" id={`${mode}_swh`} value={keys.sellr_webhook_secret} show={showSecrets[`${mode}_swh`]} onToggle={() => toggleShow(`${mode}_swh`)} onChange={(v) => update('sellr_webhook_secret', v)} placeholder="whsec_..." />

        <h4 className="text-xs font-semibold uppercase tracking-wider pt-2" style={{ color: 'rgb(107,114,128)' }}>
          Price IDs
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Curator Monthly" value={keys.price_curator_monthly} onChange={(v) => update('price_curator_monthly', v)} placeholder="price_..." />
          <TextField label="Curator Annual" value={keys.price_curator_annual} onChange={(v) => update('price_curator_annual', v)} placeholder="price_..." />
          <TextField label="Enthusiast Monthly" value={keys.price_enthusiast_monthly} onChange={(v) => update('price_enthusiast_monthly', v)} placeholder="price_..." />
          <TextField label="Enthusiast Annual" value={keys.price_enthusiast_annual} onChange={(v) => update('price_enthusiast_annual', v)} placeholder="price_..." />
        </div>

        {/* Test + Result */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={onTest}
            disabled={testing || !keys.secret_key}
            className="px-4 py-2 rounded-lg text-sm font-medium border transition-colors disabled:opacity-50 flex items-center gap-2"
            style={{ borderColor: 'rgb(209,213,219)', color: 'rgb(55,65,81)' }}
          >
            {testing ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Testing...
              </>
            ) : (
              'Test Connection'
            )}
          </button>
        </div>

        {testResult && (
          <div
            className="flex items-start gap-2 px-4 py-3 rounded-lg text-sm"
            style={{
              backgroundColor: testResult.success ? 'rgb(240,253,244)' : 'rgb(254,242,242)',
              color: testResult.success ? 'rgb(22,101,52)' : 'rgb(153,27,27)',
            }}
          >
            {testResult.message}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Field Components ─────────────────────────────────────────────────

const SecretField: React.FC<{
  label: string;
  id: string;
  value: string;
  show?: boolean;
  onToggle: () => void;
  onChange: (v: string) => void;
  placeholder?: string;
}> = ({ label, value, show, onToggle, onChange, placeholder }) => (
  <div>
    <label className="block text-sm font-medium mb-1" style={{ color: 'rgb(55,65,81)' }}>{label}</label>
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 pr-10 rounded-lg border text-sm focus:outline-none focus:ring-2"
        style={{ borderColor: 'rgb(209,213,219)', color: 'rgb(17,24,39)' }}
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-2.5 top-1/2 -translate-y-1/2"
        style={{ color: 'rgb(156,163,175)' }}
        title={show ? 'Hide' : 'Show'}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {show ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M3 3l18 18" />
          ) : (
            <>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </>
          )}
        </svg>
      </button>
    </div>
  </div>
);

const TextField: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}> = ({ label, value, onChange, placeholder }) => (
  <div>
    <label className="block text-xs font-medium mb-1" style={{ color: 'rgb(55,65,81)' }}>{label}</label>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2"
      style={{ borderColor: 'rgb(209,213,219)', color: 'rgb(17,24,39)' }}
    />
  </div>
);

export default IntegrationsPage;
