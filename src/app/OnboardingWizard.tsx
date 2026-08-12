'use client';

import React, { useState } from 'react';

interface OnboardingWizardProps {
  initialError?: string;
}

export default function OnboardingWizard({ initialError }: OnboardingWizardProps) {
  const [contentUrl, setContentUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(initialError || null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [statusLog, setStatusLog] = useState<string | null>(null);

  const handleScrapeFirstUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contentUrl) return;
    setLoading(true);
    setErrorMsg(null);
    setStatusLog('Connecting to URL crawler...');

    try {
      setStatusLog('Fetching page/feed and parsing metadata...');
      const res = await fetch('/api/ingestion/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: contentUrl })
      });
      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Scraping failed.');
      }

      const isChannel = data.channelImport;
      const count = data.count || 1;

      if (isChannel) {
        setStatusLog(`Success! Imported YouTube channel with ${count} latest videos.`);
        setSuccessMsg(`Imported channel feed successfully!`);
      } else {
        setStatusLog(`Success! Extracted: "${data.content.title}" (${data.content.topic})`);
        setSuccessMsg('First content article scraped successfully!');
      }

      setTimeout(() => {
        setSuccessMsg(null);
        setStatusLog(null);
        window.location.reload(); // Reload immediately, it will load the live dashboard!
      }, 1500);

    } catch (err: any) {
      setErrorMsg(err?.message || String(err));
      setStatusLog(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 20px', fontFamily: 'var(--font-sans)' }} className="animate-fade-in">
      
      {/* Brand Header */}
      <header style={{ textAlign: 'center', marginBottom: '48px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <span style={{ fontSize: '32px' }}>⚡</span>
          <span style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.5px', background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            ContentPulse
          </span>
        </div>
        <h1 style={{ fontSize: '36px', fontWeight: 800, margin: '0 0 12px 0', letterSpacing: '-0.5px' }}>
          Editorial Strategy & Content Analytics, Simplified.
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '16px', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6' }}>
          Connect your channels, crawl your publications, and let Gemini generate executive reports to double your high-performing content topics.
        </p>
      </header>

      {/* Hero Visual Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '48px' }}>
        <div className="glass-card" style={{ padding: '24px', borderTop: '2px solid var(--color-primary)' }}>
          <div style={{ fontSize: '24px', marginBottom: '12px' }}>📊</div>
          <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 8px 0' }}>Multi-Channel Normalization</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', margin: 0, lineHeight: '1.5' }}>
            Compare articles, YouTube videos, newsletters, and social posts on a level playing field using percentile scoring.
          </p>
        </div>
        <div className="glass-card" style={{ padding: '24px', borderTop: '2px solid var(--color-secondary)' }}>
          <div style={{ fontSize: '24px', marginBottom: '12px' }}>🔍</div>
          <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 8px 0' }}>Organic Search Gap Analysis</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', margin: 0, lineHeight: '1.5' }}>
            Identify search keywords that bring impressions but zero clicks, automatically flagging opportunities to capture traffic.
          </p>
        </div>
        <div className="glass-card" style={{ padding: '24px', borderTop: '2px solid var(--color-success)' }}>
          <div style={{ fontSize: '24px', marginBottom: '12px' }}>🤖</div>
          <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 8px 0' }}>Gemini Editorial Intelligence</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', margin: 0, lineHeight: '1.5' }}>
            Leverage Gemini 2.5 Flash to automatically output high-impact action recommendations: Continue, Stop, or Create.
          </p>
        </div>
      </div>

      {/* Main Single-Step Onboarding Form */}
      <div className="glass-card" style={{ padding: '40px', maxWidth: '640px', margin: '0 auto', border: '1px solid rgba(255,255,255,0.08)' }}>
        
        <form onSubmit={handleScrapeFirstUrl} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 700, margin: 0, fontFamily: 'var(--font-display)' }}>
            Launch Your Dashboard
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', margin: 0, lineHeight: '1.6' }}>
            Paste a link to your YouTube channel (e.g. <code>https://youtube.com/@MrBeast</code>), a specific video, a Substack newsletter post, a Medium article, or a blog post to begin.
          </p>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '8px' }}>
              Channel or Content Link (URL)
            </label>
            <input 
              type="url"
              required
              value={contentUrl}
              onChange={e => setContentUrl(e.target.value)}
              placeholder="https://www.youtube.com/@MrBeast"
              style={{ width: '100%', padding: '14px 16px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: '#fff', fontSize: '14px', transition: 'all 0.3s ease' }}
            />
            <span style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '8px' }}>
              💡 Pasting a YouTube channel URL will automatically import the latest 5 videos using the YouTube Data API.
            </span>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="glow-btn glow-btn-primary"
            style={{ padding: '14px', justifyContent: 'center', fontWeight: 600, fontSize: '15px' }}
          >
            {loading ? 'Importing Content...' : 'Import & Build Dashboard ➔'}
          </button>
        </form>

        {/* Setup Logs & Status */}
        {statusLog && (
          <div style={{ marginTop: '20px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', padding: '12px 16px', borderRadius: '6px', fontSize: '12px', fontFamily: 'monospace', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="animate-pulse" style={{ width: '8px', height: '8px', background: 'var(--color-primary)', borderRadius: '50%' }}></span>
            <span>{statusLog}</span>
          </div>
        )}

        {successMsg && (
          <div style={{ marginTop: '20px', background: 'var(--color-success-bg)', border: '1px solid var(--color-success)', padding: '12px 16px', borderRadius: '6px', fontSize: '13px', color: '#fff', fontWeight: 500 }}>
            🎉 {successMsg}
          </div>
        )}

        {errorMsg && (
          <div style={{ marginTop: '20px', background: 'var(--color-error-bg)', border: '1px solid var(--color-error)', padding: '12px 16px', borderRadius: '6px', fontSize: '13px', color: '#fff' }}>
            <strong style={{ display: 'block', marginBottom: '4px' }}>⚠️ Import Failed:</strong>
            <pre style={{ margin: 0, fontSize: '11px', whiteSpace: 'pre-wrap', fontFamily: 'monospace', opacity: 0.9 }}>{errorMsg}</pre>
          </div>
        )}

      </div>
      
    </div>
  );
}
