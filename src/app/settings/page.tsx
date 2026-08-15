'use client';

import React, { useState, useEffect } from 'react';
import SidebarLayout from '../SidebarLayout';

export default function SettingsPage() {
  // Theme state
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [accentColor, setAccentColor] = useState<'blue' | 'green' | 'purple'>('blue');
  const [compactDensity, setCompactDensity] = useState(false);

  // Workspace Settings
  const [workspaceName, setWorkspaceName] = useState('ContentPulse Media');
  const [timezone, setTimezone] = useState('UTC');
  const [currency, setCurrency] = useState('USD ($)');
  const [numberFormat, setNumberFormat] = useState('compact');

  // Notifications
  const [emailDigest, setEmailDigest] = useState(true);
  const [viralityAlerts, setViralityAlerts] = useState(true);
  const [slackWebhook, setSlackWebhook] = useState('');
  const [slackTesting, setSlackTesting] = useState(false);
  const [slackStatus, setSlackStatus] = useState<string | null>(null);

  // Save state
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    // Load local settings if previously saved
    const savedTheme = localStorage.getItem('cp_theme') as 'dark' | 'light' | null;
    if (savedTheme) setTheme(savedTheme);

    const savedWorkspace = localStorage.getItem('cp_workspace_name');
    if (savedWorkspace) setWorkspaceName(savedWorkspace);

    const savedSlack = localStorage.getItem('cp_slack_webhook');
    if (savedSlack) setSlackWebhook(savedSlack);
  }, []);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('cp_theme', theme);
    localStorage.setItem('cp_workspace_name', workspaceName);
    localStorage.setItem('cp_timezone', timezone);
    localStorage.setItem('cp_currency', currency);
    if (slackWebhook) localStorage.setItem('cp_slack_webhook', slackWebhook);

    // Apply theme class to document
    if (theme === 'light') {
      document.documentElement.classList.add('light-theme');
    } else {
      document.documentElement.classList.remove('light-theme');
    }

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleTestSlack = async () => {
    if (!slackWebhook) {
      setSlackStatus('Please enter a valid Slack Webhook URL first.');
      return;
    }

    setSlackTesting(true);
    setSlackStatus(null);
    try {
      const res = await fetch('/api/settings/slack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl: slackWebhook })
      });
      const data = await res.json();
      if (data.success) {
        setSlackStatus('✅ Test message sent to Slack successfully!');
      } else {
        setSlackStatus(`❌ Slack test failed: ${data.error}`);
      }
    } catch (err: any) {
      setSlackStatus(`❌ Error: ${err?.message || String(err)}`);
    } finally {
      setSlackTesting(false);
    }
  };

  return (
    <SidebarLayout>
      <div className="animate-fade-in" style={{ maxWidth: '960px', margin: '0 auto' }}>
        
        {/* Header */}
        <header style={{ marginBottom: '36px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 800, margin: 0, letterSpacing: '-0.5px', fontFamily: 'var(--font-display)' }}>
            System Settings & Preferences
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '15px', marginTop: '6px' }}>
            Customize your workspace appearance, notifications, currency localization, and connected AI services
          </p>
        </header>

        {savedSuccess && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid #10b981',
            color: '#34d399',
            padding: '14px 20px',
            borderRadius: '8px',
            marginBottom: '28px',
            fontSize: '14px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            Preferences saved successfully!
          </div>
        )}

        <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

          {/* 1. Appearance & Theme */}
          <section className="glass-card" style={{ padding: '28px 32px', borderRadius: '12px', background: 'rgba(10, 10, 12, 0.45)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
              Appearance & Theme
            </h2>
            <p style={{ color: '#718096', fontSize: '13px', marginBottom: '24px' }}>
              Select your interface color scheme and visual display density.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              {/* Dark Theme Option */}
              <div 
                onClick={() => setTheme('dark')}
                style={{
                  padding: '16px 20px',
                  borderRadius: '10px',
                  background: theme === 'dark' ? 'rgba(59, 130, 246, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                  border: theme === 'dark' ? '2px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.08)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#000000', border: '2px solid #3b82f6' }}></div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: '#ffffff' }}>Obsidian Dark</div>
                  <div style={{ fontSize: '11px', color: '#718096' }}>OLED high contrast</div>
                </div>
              </div>

              {/* Light Theme Option */}
              <div 
                onClick={() => setTheme('light')}
                style={{
                  padding: '16px 20px',
                  borderRadius: '10px',
                  background: theme === 'light' ? 'rgba(59, 130, 246, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                  border: theme === 'light' ? '2px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.08)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#ffffff', border: '2px solid #cbd5e1' }}></div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: '#ffffff' }}>Editorial Light</div>
                  <div style={{ fontSize: '11px', color: '#718096' }}>Clean paper aesthetic</div>
                </div>
              </div>
            </div>

            {/* Density switch */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#e2e8f0' }}>Compact Table Density</div>
                <div style={{ fontSize: '12px', color: '#718096' }}>Display more data rows on screen with reduced padding</div>
              </div>
              <input 
                type="checkbox"
                checked={compactDensity}
                onChange={e => setCompactDensity(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
            </div>
          </section>

          {/* 2. Workspace & Regional Localization */}
          <section className="glass-card" style={{ padding: '28px 32px', borderRadius: '12px', background: 'rgba(10, 10, 12, 0.45)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
              </svg>
              Workspace & Localization
            </h2>
            <p style={{ color: '#718096', fontSize: '13px', marginBottom: '24px' }}>
              Configure your organization profile, default currency, and time settings.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#a0aec0', marginBottom: '8px' }}>
                  Workspace / Organization Name
                </label>
                <input 
                  type="text"
                  value={workspaceName}
                  onChange={e => setWorkspaceName(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '14px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#a0aec0', marginBottom: '8px' }}>
                  Primary Reporting Timezone
                </label>
                <select
                  value={timezone}
                  onChange={e => setTimezone(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', background: '#0a0a0c', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '14px' }}
                >
                  <option value="UTC">UTC (Universal Coordinated Time)</option>
                  <option value="America/New_York">Eastern Time (US / New York)</option>
                  <option value="America/Los_Angeles">Pacific Time (US / Los Angeles)</option>
                  <option value="Europe/London">Greenwich Mean Time (London)</option>
                  <option value="Asia/Kolkata">India Standard Time (IST / New Delhi)</option>
                  <option value="Asia/Tokyo">Japan Standard Time (JST / Tokyo)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#a0aec0', marginBottom: '8px' }}>
                  Conversion Value Currency
                </label>
                <select
                  value={currency}
                  onChange={e => setCurrency(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', background: '#0a0a0c', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '14px' }}
                >
                  <option value="USD ($)">USD ($) - US Dollar</option>
                  <option value="EUR (€)">EUR (€) - Euro</option>
                  <option value="GBP (£)">GBP (£) - British Pound</option>
                  <option value="INR (₹)">INR (₹) - Indian Rupee</option>
                  <option value="CAD ($)">CAD ($) - Canadian Dollar</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#a0aec0', marginBottom: '8px' }}>
                  Metric Formatting Style
                </label>
                <select
                  value={numberFormat}
                  onChange={e => setNumberFormat(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', background: '#0a0a0c', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '14px' }}
                >
                  <option value="compact">Compact (e.g. 184.7M / 42.5K)</option>
                  <option value="full">Exact (e.g. 184,720,500)</option>
                </select>
              </div>
            </div>
          </section>

          {/* 3. Notifications & Slack Integration */}
          <section className="glass-card" style={{ padding: '28px 32px', borderRadius: '12px', background: 'rgba(10, 10, 12, 0.45)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              Notifications & Automated Alerts
            </h2>
            <p style={{ color: '#718096', fontSize: '13px', marginBottom: '24px' }}>
              Receive AI strategy summaries and virality spikes directly in your channels.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginBottom: '24px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                <input 
                  type="checkbox"
                  checked={emailDigest}
                  onChange={e => setEmailDigest(e.target.checked)}
                  style={{ width: '18px', height: '18px' }}
                />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#e2e8f0' }}>Weekly AI Editorial Digest</div>
                  <div style={{ fontSize: '12px', color: '#718096' }}>Summary of highest performing content formats and search gap opportunities</div>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                <input 
                  type="checkbox"
                  checked={viralityAlerts}
                  onChange={e => setViralityAlerts(e.target.checked)}
                  style={{ width: '18px', height: '18px' }}
                />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#e2e8f0' }}>Virality & Audience Spike Alerts</div>
                  <div style={{ fontSize: '12px', color: '#718096' }}>Real-time alerts when a post or video surpasses 50,000 views in 24 hours</div>
                </div>
              </label>
            </div>

            {/* Slack Webhook Input */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#a0aec0', marginBottom: '8px' }}>
                Slack Incoming Webhook URL
              </label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input 
                  type="url"
                  placeholder="https://your-slack-incoming-webhook-url"
                  value={slackWebhook}
                  onChange={e => setSlackWebhook(e.target.value)}
                  style={{ flex: 1, padding: '12px 14px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '14px' }}
                />
                <button
                  type="button"
                  onClick={handleTestSlack}
                  disabled={slackTesting || !slackWebhook}
                  style={{
                    padding: '12px 20px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {slackTesting ? 'Sending...' : 'Test Slack Alert'}
                </button>
              </div>
              {slackStatus && (
                <div style={{ marginTop: '10px', fontSize: '12px', color: slackStatus.startsWith('✅') ? '#34d399' : '#f87171' }}>
                  {slackStatus}
                </div>
              )}
            </div>
          </section>

          {/* 4. AI Services & Platform Status */}
          <section className="glass-card" style={{ padding: '28px 32px', borderRadius: '12px', background: 'rgba(10, 10, 12, 0.45)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
              </svg>
              AI Services & Infrastructure Status
            </h2>
            <p style={{ color: '#718096', fontSize: '13px', marginBottom: '20px' }}>
              Live connection status for background crawlers, databases, and AI models.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div style={{ padding: '14px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '11px', color: '#718096', fontWeight: 600, textTransform: 'uppercase' }}>AI Reasoning Engine</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#38bdf8', marginTop: '4px' }}>Gemini 1.5 Flash</div>
                <div style={{ fontSize: '11px', color: '#34d399', marginTop: '2px' }}>● Active & Connected</div>
              </div>

              <div style={{ padding: '14px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '11px', color: '#718096', fontWeight: 600, textTransform: 'uppercase' }}>Database Storage</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff', marginTop: '4px' }}>Neon PostgreSQL</div>
                <div style={{ fontSize: '11px', color: '#34d399', marginTop: '2px' }}>● Connected</div>
              </div>

              <div style={{ padding: '14px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '11px', color: '#718096', fontWeight: 600, textTransform: 'uppercase' }}>Video Data API</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#f87171', marginTop: '4px' }}>YouTube Data v3</div>
                <div style={{ fontSize: '11px', color: '#34d399', marginTop: '2px' }}>● Ready</div>
              </div>
            </div>
          </section>

          {/* Submit Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
            <button
              type="submit"
              className="glow-btn glow-btn-primary"
              style={{ padding: '14px 32px', fontSize: '15px', fontWeight: 700, borderRadius: '8px' }}
            >
              Save System Preferences
            </button>
          </div>

        </form>

      </div>
    </SidebarLayout>
  );
}
