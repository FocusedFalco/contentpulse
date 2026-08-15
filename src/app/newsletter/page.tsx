'use client';

import React, { useState, useEffect } from 'react';
import SidebarLayout from '../SidebarLayout';
import Link from 'next/link';

interface NewsletterItem {
  content_id: number;
  title: string;
  channel: string;
  format: string;
  word_count: number | null;
  duration: number | null;
  publish_date: string;
  author: string;
  url: string;
  topic?: string;
  total_views: number;
  total_conversions: number;
  avg_engagement: number;
}

const ALLOWED_NEWSLETTER_DOMAINS = [
  'substack.com',
  'beehiiv.com',
  'medium.com',
  'ghost.io',
  'ghost.org',
  'convertkit.com',
  'ck.page',
  'buttondown.email',
  'mailchimp.com',
  'revue.co',
  'newsletters.co'
];

const PLATFORMS = [
  { name: 'Substack', domain: 'substack.com', placeholder: 'https://mybrand.substack.com/p/my-awesome-issue' },
  { name: 'Beehiiv', domain: 'beehiiv.com', placeholder: 'https://newsletter.beehiiv.com/p/weekly-insights' },
  { name: 'Medium', domain: 'medium.com', placeholder: 'https://medium.com/@author/deep-dive-into-ai' },
  { name: 'Ghost', domain: 'ghost.io', placeholder: 'https://blog.ghost.org/growth-playbook' },
  { name: 'ConvertKit', domain: 'convertkit.com', placeholder: 'https://creator.ck.page/posts/issue-12' },
  { name: 'Buttondown', domain: 'buttondown.email', placeholder: 'https://buttondown.email/author/archive/post-name' },
  { name: 'Mailchimp', domain: 'mailchimp.com', placeholder: 'https://mailchi.mp/brand/newsletter-issue-4' }
];

export default function NewsletterChannelPage() {
  const [inputVal, setInputVal] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('Substack');
  const [scraping, setScraping] = useState(false);
  const [scrapeLogs, setScrapeLogs] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [items, setItems] = useState<NewsletterItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);

  // Fetch existing newsletter content
  const loadNewsletterItems = async () => {
    try {
      setLoadingItems(true);
      const res = await fetch('/api/content/channel?channel=newsletter');
      const data = await res.json();
      if (data.success && data.items) {
        setItems(data.items);
      }
    } catch (e) {
      console.error('Failed to load newsletter items:', e);
    } finally {
      setLoadingItems(false);
    }
  };

  useEffect(() => {
    loadNewsletterItems();
  }, []);

  // Validate newsletter domain
  const validateInput = (value: string): { isValid: boolean; normalizedUrl: string; error?: string } => {
    const trimmed = value.trim();
    if (!trimmed) {
      return { isValid: false, normalizedUrl: '', error: 'Please enter a newsletter publication or issue URL.' };
    }

    // Parse URL
    let parsedUrl: URL;
    try {
      const urlWithProtocol = trimmed.startsWith('http://') || trimmed.startsWith('https://') 
        ? trimmed 
        : `https://${trimmed}`;
      parsedUrl = new URL(urlWithProtocol);
    } catch (e) {
      return { isValid: false, normalizedUrl: '', error: 'Invalid URL format.' };
    }

    const hostname = parsedUrl.hostname.toLowerCase().replace(/^www\./, '');
    const isDomainAllowed = ALLOWED_NEWSLETTER_DOMAINS.some(d => hostname === d || hostname.endsWith(`.${d}`));

    if (!isDomainAllowed) {
      return {
        isValid: false,
        normalizedUrl: parsedUrl.toString(),
        error: `Invalid domain "${hostname}". Only newsletter platforms (Substack, Beehiiv, Medium, Ghost, ConvertKit, Buttondown, Mailchimp) are accepted.`
      };
    }

    return { isValid: true, normalizedUrl: parsedUrl.toString() };
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputVal(val);
    if (val.trim()) {
      const check = validateInput(val);
      setValidationError(check.isValid ? null : check.error || null);
    } else {
      setValidationError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const check = validateInput(inputVal);
    if (!check.isValid) {
      setValidationError(check.error || 'Please enter a valid newsletter URL.');
      return;
    }

    setValidationError(null);
    setScraping(true);
    setScrapeLogs(`Connecting to crawler for Newsletter issue: ${check.normalizedUrl}...`);

    try {
      setScrapeLogs(prev => prev + '\nFetching article HTML, calculating word count & audience engagement...');
      const res = await fetch('/api/ingestion/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: check.normalizedUrl, channel: 'newsletter' })
      });
      const data = await res.json();
      if (data.success) {
        setScrapeLogs(
          prev => prev + `\n\n🎉 SUCCESSFUL NEWSLETTER INGESTION:\n• Title: "${data.content.title}"\n• Channel: ${data.content.channel.toUpperCase()}\n• Format: ${data.content.format}\n• Word Count: ${data.content.wordCount || 'N/A'}\n• Estimated Views: ${data.content.estimatedViews.toLocaleString()}\n• Auto Topic: ${data.content.topic}`
        );
        setInputVal('');
        loadNewsletterItems();
      } else {
        setScrapeLogs(prev => prev + `\n\n❌ FAILED: ${data.error}`);
      }
    } catch (err: any) {
      setScrapeLogs(prev => prev + `\n\n❌ ERROR: ${err?.message || String(err)}`);
    } finally {
      setScraping(false);
    }
  };

  const currentPlaceholder = PLATFORMS.find(p => p.name === selectedPlatform)?.placeholder || 'https://myblog.substack.com/p/awesome-post';

  return (
    <SidebarLayout>
      <div className="animate-fade-in" style={{ maxWidth: '1100px', margin: '0 auto' }}>
        
        {/* Header Bar */}
        <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 10px', borderRadius: '20px', background: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.25)', color: '#22d3ee', fontSize: '12px', fontWeight: 600, marginBottom: '10px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22d3ee' }}></span>
              Newsletter Channel • Active Monitoring
            </div>
            <h1 style={{ fontSize: '32px', fontWeight: 700, margin: 0, letterSpacing: '-0.5px' }}>Newsletter Channel</h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '15px', marginTop: '6px' }}>
              Track readership, open engagement, and subscriber conversion across your newsletter publications
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <Link href="/" style={{ textDecoration: 'none' }}>
              <button className="glow-btn" style={{ padding: '8px 16px', fontSize: '13px' }}>
                View Dashboard
              </button>
            </Link>
          </div>
        </header>

        {/* Input Box Card */}
        <section className="glass-card" style={{ padding: '32px', marginBottom: '32px', borderLeft: '4px solid #06b6d4', background: 'linear-gradient(180deg, rgba(24,24,27,0.8) 0%, rgba(9,9,11,0.9) 100%)' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(6,182,212,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22d3ee' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0, fontFamily: 'var(--font-display)' }}>
                Add Newsletter Publication or Post URL
              </h2>
              <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                Paste a link to your Substack, Beehiiv, Medium, Ghost, ConvertKit, or Mailchimp newsletter
              </span>
            </div>
          </div>

          {/* Platform Pills Filter / Quick Selector */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', margin: '20px 0 16px 0' }}>
            {PLATFORMS.map(p => {
              const active = selectedPlatform === p.name;
              return (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => {
                    setSelectedPlatform(p.name);
                    if (!inputVal) {
                      setInputVal(`https://${p.domain}/`);
                    }
                  }}
                  style={{
                    background: active ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                    border: `1px solid ${active ? '#06b6d4' : 'rgba(255, 255, 255, 0.08)'}`,
                    color: active ? '#ffffff' : '#a0aec0',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: active ? 600 : 400,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {p.name}
                </button>
              );
            })}
          </div>

          {/* Form Box */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={inputVal}
                onChange={handleInputChange}
                placeholder={currentPlaceholder}
                required
                style={{
                  width: '100%',
                  padding: '14px 18px',
                  borderRadius: '8px',
                  background: 'rgba(0,0,0,0.4)',
                  border: `1px solid ${validationError ? '#ef4444' : 'var(--border-color)'}`,
                  color: '#fff',
                  fontSize: '15px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)'
                }}
                onFocus={e => {
                  if (!validationError) e.currentTarget.style.borderColor = '#06b6d4';
                }}
                onBlur={e => {
                  if (!validationError) e.currentTarget.style.borderColor = 'var(--border-color)';
                }}
              />
            </div>

            {/* Validation Alert */}
            {validationError && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                padding: '12px 16px',
                color: '#fca5a5',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span>{validationError}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <span style={{ fontSize: '12px', color: '#718096' }}>
                Strict Domain Enforced: Only <strong>Substack, Beehiiv, Medium, Ghost, ConvertKit, Buttondown, Mailchimp</strong> accepted.
              </span>

              <button
                type="submit"
                disabled={scraping || !inputVal || !!validationError}
                className="glow-btn"
                style={{
                  background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '12px 28px',
                  fontWeight: 600,
                  fontSize: '14px',
                  opacity: scraping || !inputVal || !!validationError ? 0.5 : 1,
                  cursor: scraping || !inputVal || !!validationError ? 'not-allowed' : 'pointer'
                }}
              >
                {scraping ? 'Syncing Newsletter Issue...' : 'Extract & Sync Newsletter'}
              </button>
            </div>
          </form>

          {/* Crawler Logs Console */}
          {scrapeLogs && (
            <div style={{ marginTop: '20px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#a0aec0', display: 'block', marginBottom: '6px' }}>
                Live Ingestion Console
              </span>
              <pre style={{
                background: 'rgba(0,0,0,0.6)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                padding: '16px',
                fontSize: '12px',
                whiteSpace: 'pre-wrap',
                color: '#e5e7eb',
                fontFamily: 'monospace',
                lineHeight: '1.6'
              }}>
                {scrapeLogs}
              </pre>
            </div>
          )}
        </section>

        {/* Existing Newsletter Content Feed */}
        <section className="glass-card" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, fontFamily: 'var(--font-display)' }}>
                Active Newsletter Publications ({items.length})
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                Content items tracked in your Newsletter channel
              </p>
            </div>
            <button
              onClick={loadNewsletterItems}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#a0aec0',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Refresh
            </button>
          </div>

          {loadingItems ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#718096' }}>
              Loading newsletter items...
            </div>
          ) : items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 24px', background: 'rgba(255,255,255,0.01)', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.08)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(6,182,212,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', color: '#22d3ee' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#ffffff', marginBottom: '6px' }}>No Newsletter Issues Connected Yet</h3>
              <p style={{ fontSize: '13px', color: '#718096', maxWidth: '400px', margin: '0 auto' }}>
                Add your newsletter publication link above to begin monitoring readership, word count performance, and conversions.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: '#718096' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>ISSUE TITLE</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>TOPIC CLUSTER</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>WORDS</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>EST. VIEWS</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>CONVERSIONS</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>DATE</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.content_id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)', transition: 'background 0.2s' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 600, color: '#ffffff', marginBottom: '2px' }}>
                          {item.title}
                        </div>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          style={{ fontSize: '11px', color: '#22d3ee', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <span>{item.author || 'Publication'}</span> • <span>{item.url}</span>
                        </a>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          background: 'rgba(6, 182, 212, 0.1)',
                          border: '1px solid rgba(6, 182, 212, 0.2)',
                          color: '#22d3ee',
                          fontSize: '11px',
                          fontWeight: 500
                        }}>
                          {item.topic || 'Uncategorized'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', color: '#a0aec0' }}>
                        {item.word_count ? `${item.word_count.toLocaleString()} words` : 'N/A'}
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: 600, color: '#ffffff' }}>
                        {item.total_views.toLocaleString()}
                      </td>
                      <td style={{ padding: '14px 16px', color: '#34d399', fontWeight: 500 }}>
                        {item.total_conversions.toLocaleString()}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right', color: '#718096', fontSize: '12px' }}>
                        {item.publish_date}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </div>
    </SidebarLayout>
  );
}
