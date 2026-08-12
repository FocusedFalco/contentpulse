'use client';

import React, { useState } from 'react';

export default function SettingsPage() {
  // Ingestion seed state
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);

  // URL Scraper State
  const [urlToScrape, setUrlToScrape] = useState('');
  const [scraping, setScraping] = useState(false);
  const [scrapeLogs, setScrapeLogs] = useState<string | null>(null);

  const handleScrapeURL = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlToScrape) return;
    setScraping(true);
    setScrapeLogs('Connecting to crawler...');
    try {
      setScrapeLogs(prev => prev + '\nFetching page HTML & parsing metadata...');
      const res = await fetch('/api/ingestion/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlToScrape })
      });
      const data = await res.json();
      if (data.success) {
        setScrapeLogs(prev => prev + `\n\n🎉 SUCCESS:\n• Title: "${data.content.title}"\n• Channel: ${data.content.channel}\n• Format: ${data.content.format}\n• Word Count: ${data.content.wordCount || 'N/A'}\n• Est. Views Seeded: ${data.content.estimatedViews}\n• Auto-Topic: ${data.content.topic}`);
        setUrlToScrape('');
      } else {
        setScrapeLogs(prev => prev + `\n\n❌ FAILED: ${data.error}`);
      }
    } catch (err: any) {
      setScrapeLogs(prev => prev + `\n\n❌ ERROR: ${err?.message || String(err)}`);
    } finally {
      setUrlToScrape('');
      setScraping(false);
    }
  };

  const handleRebuildDatabase = async () => {
    if (!confirm('Are you sure you want to wipe your database? This will drop and recreate all tables, removing all scraped content and metrics.')) {
      return;
    }
    setSeeding(true);
    setSeedResult('Starting database wipe and reset...');
    try {
      // Initialize schema (drops and recreates tables)
      setSeedResult(prev => prev + '\nRunning SQL schema migrations...');
      const schemaRes = await fetch('/api/db-status?reset=true', { method: 'POST' });
      const schemaData = await schemaRes.json();
      setSeedResult(prev => prev + '\n' + schemaData.log);

      if (!schemaData.success) throw new Error('Database reset failed.');

      setSeedResult(prev => prev + '\n🎉 Database tables wiped and re-initialized successfully!');
    } catch (err: any) {
      setSeedResult(prev => prev + `\n❌ ERROR: ${err?.message || String(err)}`);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 700, margin: 0 }}>Sync & Settings</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '15px', marginTop: '4px' }}>
          Sync content from publishing platforms and manage your database state
        </p>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* Left Column: URL Scraper Section */}
        <section className="glass-card" style={{ padding: '32px', borderLeft: '4px solid var(--color-primary)' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🔗</span> Scrape Content from URL
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', marginBottom: '20px', lineHeight: '1.5' }}>
            Paste a link to your Substack newsletter, Medium blog, personal article, or YouTube video. 
            Our system will crawl the page, extract metadata, auto-tag the topic cluster, and seed 30 days of metrics into your dashboard.
          </p>

          <form onSubmit={handleScrapeURL} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input 
              type="url"
              value={urlToScrape}
              onChange={e => setUrlToScrape(e.target.value)}
              placeholder="https://myblog.substack.com/p/my-awesome-newsletter-post"
              required
              style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: '#fff', fontSize: '14px' }}
            />
            <button 
              type="submit" 
              disabled={scraping}
              className="glow-btn glow-btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
            >
              {scraping ? 'Scraping...' : 'Extract & Add'}
            </button>
          </form>

          {scrapeLogs && (
            <pre style={{ marginTop: '16px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px', fontSize: '12px', whiteSpace: 'pre-wrap', color: '#e5e7eb', fontFamily: 'monospace', lineHeight: '1.5' }}>
              {scrapeLogs}
            </pre>
          )}
        </section>

        {/* Right Column: Database Maintenance */}
        <section className="glass-card" style={{ padding: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px', fontFamily: 'var(--font-display)' }}>
            Database Maintenance
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', marginBottom: '24px', lineHeight: '1.5' }}>
            Reset your Supabase database schema. This will cleanly drop and recreate all tables, removing all scraped content items and daily metrics to let you start fresh.
          </p>

          <button 
            onClick={handleRebuildDatabase}
            disabled={seeding}
            className="glow-btn"
            style={{ width: '100%', justifyContent: 'center', border: '1px solid var(--color-error)', color: 'var(--color-error)', background: 'var(--color-error-bg)', padding: '12px' }}
          >
            {seeding ? 'Wiping...' : 'Wipe & Reset Database'}
          </button>

          {seedResult && (
            <pre style={{ marginTop: '16px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px', fontSize: '11px', maxHeight: '200px', overflowY: 'auto', whiteSpace: 'pre-wrap', color: 'var(--color-text-muted)' }}>
              {seedResult}
            </pre>
          )}
        </section>

      </div>
    </div>
  );
}
