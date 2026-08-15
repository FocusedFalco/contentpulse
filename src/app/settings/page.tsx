'use client';

import React, { useState, useEffect } from 'react';
import SidebarLayout from '../SidebarLayout';

export default function SettingsPage() {
  // Theme state
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
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
    const savedTheme = localStorage.getItem('cp_theme') as 'dark' | 'light' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    }

    const savedDensity = localStorage.getItem('cp_density');
    if (savedDensity === 'compact') {
      setCompactDensity(true);
      document.documentElement.classList.add('compact-density');
    }

    const savedWorkspace = localStorage.getItem('cp_workspace_name');
    if (savedWorkspace) setWorkspaceName(savedWorkspace);

    const savedTimezone = localStorage.getItem('cp_timezone');
    if (savedTimezone) setTimezone(savedTimezone);

    const savedCurrency = localStorage.getItem('cp_currency');
    if (savedCurrency) setCurrency(savedCurrency);

    const savedNumberFormat = localStorage.getItem('cp_number_format');
    if (savedNumberFormat) setNumberFormat(savedNumberFormat);

    const savedSlack = localStorage.getItem('cp_slack_webhook');
    if (savedSlack) setSlackWebhook(savedSlack);
  }, []);

  const applyTheme = (newTheme: 'dark' | 'light') => {
    setTheme(newTheme);
    localStorage.setItem('cp_theme', newTheme);
    if (newTheme === 'light') {
      document.documentElement.classList.add('light-theme');
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.classList.remove('light-theme');
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  };

  const handleToggleDensity = (isCompact: boolean) => {
    setCompactDensity(isCompact);
    localStorage.setItem('cp_density', isCompact ? 'compact' : 'comfortable');
    if (isCompact) {
      document.documentElement.classList.add('compact-density');
    } else {
      document.documentElement.classList.remove('compact-density');
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('cp_theme', theme);
    localStorage.setItem('cp_density', compactDensity ? 'compact' : 'comfortable');
    localStorage.setItem('cp_workspace_name', workspaceName);
    localStorage.setItem('cp_timezone', timezone);
    localStorage.setItem('cp_currency', currency);
    localStorage.setItem('cp_number_format', numberFormat);
    if (slackWebhook) localStorage.setItem('cp_slack_webhook', slackWebhook);

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
        setSlackStatus('Test alert message sent to Slack successfully!');
      } else {
        setSlackStatus(`Slack test failed: ${data.error}`);
      }
    } catch (err: any) {
      setSlackStatus(`Error: ${err?.message || String(err)}`);
    } finally {
      setSlackTesting(false);
    }
  };

  return (
    <SidebarLayout>
      <div className="animate-fade-in" style={{ maxWidth: '960px', margin: '0 auto' }}>
        
        {/* Header */}
        <header style={{ marginBottom: '36px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 800, margin: 0, letterSpacing: '-0.5px', color: 'var(--color-text)', fontFamily: 'var(--font-display)' }}>
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
            Preferences and theme saved successfully!
          </div>
        )}

        <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

          {/* 1. Appearance & Theme */}
          <section className="glass-card" style={{ padding: '28px 32px', borderRadius: '12px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2">
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
            <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', marginBottom: '24px' }}>
              Select your interface color scheme and visual display density. (Changes apply instantly)
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              
              {/* Dark Theme Option */}
              <div 
                onClick={() => applyTheme('dark')}
                style={{
                  padding: '18px 20px',
                  borderRadius: '10px',
                  background: theme === 'dark' ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-base)',
                  border: theme === 'dark' ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px'
                }}
              >
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#09090b', border: theme === 'dark' ? '2px solid var(--color-primary)' : '2px solid #52525b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {theme === 'dark' && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-primary)' }}></div>}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-text)' }}>Obsidian Dark</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>OLED sleek high contrast</div>
                </div>
              </div>

              {/* Light Theme Option */}
              <div 
                onClick={() => applyTheme('light')}
                style={{
                  padding: '18px 20px',
                  borderRadius: '10px',
                  background: theme === 'light' ? 'rgba(37, 99, 235, 0.1)' : 'var(--bg-base)',
                  border: theme === 'light' ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px'
                }}
              >
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#ffffff', border: theme === 'light' ? '2px solid var(--color-primary)' : '2px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {theme === 'light' && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-primary)' }}></div>}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-text)' }}>Editorial Light</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Clean paper aesthetic</div>
                </div>
              </div>
            </div>

            {/* Density switch */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)' }}>Compact Table Density</div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Display more data rows on screen with reduced padding</div>
              </div>
              <input 
                type="checkbox"
                checked={compactDensity}
                onChange={e => handleToggleDensity(e.target.checked)}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
            </div>
          </section>

          {/* 2. Workspace & Regional Localization */}
          <section className="glass-card" style={{ padding: '28px 32px', borderRadius: '12px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
              </svg>
              Workspace & Localization
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', marginBottom: '24px' }}>
              Configure your organization profile, default currency, and time settings.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                  Workspace / Organization Name
                </label>
                <input 
                  type="text"
                  value={workspaceName}
                  onChange={e => setWorkspaceName(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', background: 'var(--bg-base)', border: '1px solid var(--border-color)', color: 'var(--color-text)', fontSize: '14px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                  Primary Reporting Timezone
                </label>
                <select
                  value={timezone}
                  onChange={e => setTimezone(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', background: 'var(--bg-base)', border: '1px solid var(--border-color)', color: 'var(--color-text)', fontSize: '14px' }}
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
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                  Conversion Value Currency
                </label>
                <select
                  value={currency}
                  onChange={e => setCurrency(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', background: 'var(--bg-base)', border: '1px solid var(--border-color)', color: 'var(--color-text)', fontSize: '14px' }}
                >
                  <option value="USD ($)">USD ($) - US Dollar</option>
                  <option value="EUR (€)">EUR (€) - Euro</option>
                  <option value="GBP (£)">GBP (£) - British Pound</option>
                  <option value="INR (₹)">INR (₹) - Indian Rupee</option>
                  <option value="CAD ($)">CAD ($) - Canadian Dollar</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                  Metric Formatting Style
                </label>
                <select
                  value={numberFormat}
                  onChange={e => setNumberFormat(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', background: 'var(--bg-base)', border: '1px solid var(--border-color)', color: 'var(--color-text)', fontSize: '14px' }}
                >
                  <option value="compact">Compact (e.g. 184.7M / 42.5K)</option>
                  <option value="full">Exact (e.g. 184,720,500)</option>
                </select>
              </div>
            </div>
          </section>

          {/* 3. Notifications & Slack Integration */}
          <section className="glass-card" style={{ padding: '28px 32px', borderRadius: '12px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              Notifications & Automated Alerts
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', marginBottom: '24px' }}>
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
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)' }}>Weekly AI Editorial Digest</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Summary of highest performing content formats and search gap opportunities</div>
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
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)' }}>Virality & Audience Spike Alerts</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Real-time alerts when a post or video surpasses 50,000 views in 24 hours</div>
                </div>
              </label>
            </div>

            {/* Slack Webhook Input */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                Slack Incoming Webhook URL
              </label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input 
                  type="url"
                  placeholder="https://your-slack-incoming-webhook-url"
                  value={slackWebhook}
                  onChange={e => setSlackWebhook(e.target.value)}
                  style={{ flex: 1, padding: '12px 14px', borderRadius: '8px', background: 'var(--bg-base)', border: '1px solid var(--border-color)', color: 'var(--color-text)', fontSize: '14px' }}
                />
                <button
                  type="button"
                  onClick={handleTestSlack}
                  disabled={slackTesting || !slackWebhook}
                  style={{
                    padding: '12px 20px',
                    borderRadius: '8px',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--color-text)',
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
                <div style={{ marginTop: '10px', fontSize: '12px', color: slackStatus.includes('successfully') ? 'var(--color-success)' : 'var(--color-error)' }}>
                  {slackStatus}
                </div>
              )}
            </div>
          </section>

          {/* 4. AI Services & Platform Status */}
          <section className="glass-card" style={{ padding: '28px 32px', borderRadius: '12px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-secondary)" strokeWidth="2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
              </svg>
              AI Services & Infrastructure Status
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', marginBottom: '20px' }}>
              Live connection status for background crawlers, databases, and AI models.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div style={{ padding: '14px', borderRadius: '8px', background: 'var(--bg-base)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>AI Reasoning Engine</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-primary)', marginTop: '4px' }}>Gemini 1.5 Flash</div>
                <div style={{ fontSize: '11px', color: 'var(--color-success)', marginTop: '2px' }}>● Active & Connected</div>
              </div>

              <div style={{ padding: '14px', borderRadius: '8px', background: 'var(--bg-base)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Database Storage</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text)', marginTop: '4px' }}>Neon PostgreSQL</div>
                <div style={{ fontSize: '11px', color: 'var(--color-success)', marginTop: '2px' }}>● Connected</div>
              </div>

              <div style={{ padding: '14px', borderRadius: '8px', background: 'var(--bg-base)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Video Data API</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#f87171', marginTop: '4px' }}>YouTube Data v3</div>
                <div style={{ fontSize: '11px', color: 'var(--color-success)', marginTop: '2px' }}>● Ready</div>
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
