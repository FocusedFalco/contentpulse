'use client';

import React, { useState, useEffect } from 'react';
import SidebarLayout from '../SidebarLayout';
import Link from 'next/link';

interface SocialHandle {
  handle_name: string;
  channel: string;
  sample_url: string;
  items_count: number;
  total_views: number;
  total_conversions: number;
  avg_engagement: number;
  last_synced: string;
}

const ALLOWED_SOCIAL_DOMAINS = [
  'x.com',
  'twitter.com',
  'linkedin.com',
  'instagram.com',
  'threads.net',
  'tiktok.com',
  'youtube.com',
  'youtu.be',
  'bsky.app'
];

const PLATFORMS = [
  { name: 'YouTube', domain: 'youtube.com', placeholder: '@mrbeast or https://youtube.com/@mrbeast' },
  { name: 'X / Twitter', domain: 'x.com', placeholder: '@sarahchen or https://x.com/sarahchen' },
  { name: 'LinkedIn', domain: 'linkedin.com', placeholder: 'https://linkedin.com/in/username or post URL' },
  { name: 'Instagram', domain: 'instagram.com', placeholder: 'https://instagram.com/username or post URL' },
  { name: 'Threads', domain: 'threads.net', placeholder: 'https://threads.net/@creator' },
  { name: 'Bluesky', domain: 'bsky.app', placeholder: 'https://bsky.app/profile/user.bsky.social' },
  { name: 'TikTok', domain: 'tiktok.com', placeholder: 'https://tiktok.com/@creator' }
];

export default function SocialChannelPage() {
  const [inputVal, setInputVal] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('YouTube');
  const [scraping, setScraping] = useState(false);
  const [scrapeLogs, setScrapeLogs] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [handles, setHandles] = useState<SocialHandle[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);

  // Fetch connected social channels / handles
  const loadSocialHandles = async () => {
    try {
      setLoadingItems(true);
      const res = await fetch('/api/content/channel?channel=social');
      const data = await res.json();
      if (data.success && data.handles) {
        setHandles(data.handles);
      }
    } catch (e) {
      console.error('Failed to load social handles:', e);
    } finally {
      setLoadingItems(false);
    }
  };

  const handleDisconnectHandle = async (handleName: string) => {
    if (!confirm(`Are you sure you want to disconnect and wipe all tracked data for "${handleName}"?`)) {
      return;
    }
    try {
      const res = await fetch('/api/content/channel', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle_name: handleName, channel: 'social' })
      });
      const data = await res.json();
      if (data.success) {
        loadSocialHandles();
      } else {
        alert(`Failed to disconnect: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Error: ${err?.message || String(err)}`);
    }
  };

  useEffect(() => {
    loadSocialHandles();
  }, []);

  // Validate domain or handle
  const validateInput = (value: string): { isValid: boolean; normalizedUrl: string; error?: string } => {
    const trimmed = value.trim();
    if (!trimmed) {
      return { isValid: false, normalizedUrl: '', error: 'Please enter a social handle or profile URL.' };
    }

    // If it's a handle like @username
    if (trimmed.startsWith('@')) {
      const handleName = trimmed.replace(/^@+/, '');
      if (handleName.length < 2) {
        return { isValid: false, normalizedUrl: '', error: 'Please provide a valid handle with at least 2 characters.' };
      }
      if (selectedPlatform === 'YouTube') {
        return { isValid: true, normalizedUrl: `https://www.youtube.com/@${handleName}` };
      }
      return { isValid: true, normalizedUrl: `https://x.com/${handleName}` };
    }

    // Try parsing as URL or domain
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
    const isDomainAllowed = ALLOWED_SOCIAL_DOMAINS.some(d => hostname === d || hostname.endsWith(`.${d}`));

    if (!isDomainAllowed) {
      return {
        isValid: false,
        normalizedUrl: parsedUrl.toString(),
        error: `Invalid domain "${hostname}". Only social platforms (YouTube, X/Twitter, LinkedIn, Instagram, Threads, Bluesky, TikTok) or handles (@username) are accepted.`
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
      setValidationError(check.error || 'Please enter a valid social URL or handle.');
      return;
    }

    setValidationError(null);
    setScraping(true);
    setScrapeLogs(`Connecting to crawler for Social profile/channel: ${check.normalizedUrl}...`);

    try {
      setScrapeLogs(prev => prev + '\nFetching channel metadata & indexing latest feed content...');
      const res = await fetch('/api/ingestion/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: check.normalizedUrl, channel: 'social' })
      });
      const data = await res.json();
      if (data.success) {
        setScrapeLogs(
          prev => prev + `\n\nSUCCESSFUL SOCIAL INGESTION:\n• Channel / Handle: "${data.content.author || data.content.title}"\n• Format: ${data.content.format}\n• Estimated Views: ${data.content.estimatedViews.toLocaleString()}\n• Status: Active Sync Connected`
        );
        setInputVal('');
        loadSocialHandles();
      } else {
        setScrapeLogs(prev => prev + `\n\nFAILED: ${data.error}`);
      }
    } catch (err: any) {
      setScrapeLogs(prev => prev + `\n\nERROR: ${err?.message || String(err)}`);
    } finally {
      setScraping(false);
    }
  };

  const currentPlaceholder = PLATFORMS.find(p => p.name === selectedPlatform)?.placeholder || '@username or channel URL';

  // Calculate totals
  const totalTrackedHandles = handles.length;
  const totalPostsCount = handles.reduce((acc, h) => acc + h.items_count, 0);
  const totalReach = handles.reduce((acc, h) => acc + h.total_views, 0);
  const totalConversions = handles.reduce((acc, h) => acc + h.total_conversions, 0);

  const getPlatformLabel = (url: string, channel: string) => {
    const u = (url || '').toLowerCase();
    if (u.includes('youtube.com') || u.includes('youtu.be') || channel === 'youtube') return { name: 'YouTube', color: '#f87171', bg: 'rgba(239, 68, 68, 0.15)' };
    if (u.includes('twitter.com') || u.includes('x.com')) return { name: 'X / Twitter', color: '#60a5fa', bg: 'rgba(59, 130, 246, 0.15)' };
    if (u.includes('linkedin.com')) return { name: 'LinkedIn', color: '#0ea5e9', bg: 'rgba(14, 165, 233, 0.15)' };
    if (u.includes('instagram.com')) return { name: 'Instagram', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.15)' };
    if (u.includes('threads.net')) return { name: 'Threads', color: '#e2e8f0', bg: 'rgba(255, 255, 255, 0.15)' };
    if (u.includes('tiktok.com')) return { name: 'TikTok', color: '#22d3ee', bg: 'rgba(6, 182, 212, 0.15)' };
    return { name: 'Social Stream', color: '#a78bfa', bg: 'rgba(167, 139, 250, 0.15)' };
  };

  return (
    <SidebarLayout>
      <div className="animate-fade-in" style={{ maxWidth: '1100px', margin: '0 auto' }}>
        
        {/* Header Bar */}
        <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: 700, margin: 0, letterSpacing: '-0.5px' }}>Social Channel</h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '15px', marginTop: '6px' }}>
              Connect social accounts and handles. Individual post performance and virality metrics are monitored on your dashboard.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <Link href="/?channel=social" style={{ textDecoration: 'none' }}>
              <button className="glow-btn" style={{ padding: '8px 16px', fontSize: '13px' }}>
                View Social Dashboard
              </button>
            </Link>
          </div>
        </header>

        {/* Summary Metric Cards */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          <div className="glass-card" style={{ padding: '20px' }}>
            <span style={{ fontSize: '12px', color: '#718096', fontWeight: 600, textTransform: 'uppercase' }}>Connected Channels</span>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>
              {totalTrackedHandles}
            </div>
            <span style={{ fontSize: '11px', color: '#60a5fa', marginTop: '2px', display: 'block' }}>{totalPostsCount} Tracked Posts / Videos</span>
          </div>

          <div className="glass-card" style={{ padding: '20px' }}>
            <span style={{ fontSize: '12px', color: '#718096', fontWeight: 600, textTransform: 'uppercase' }}>Combined Reach</span>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>
              {totalReach.toLocaleString()}
            </div>
            <span style={{ fontSize: '11px', color: '#718096', marginTop: '2px', display: 'block' }}>Total Audience Views</span>
          </div>

          <div className="glass-card" style={{ padding: '20px' }}>
            <span style={{ fontSize: '12px', color: '#718096', fontWeight: 600, textTransform: 'uppercase' }}>Social Conversions</span>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>
              {totalConversions.toLocaleString()}
            </div>
            <span style={{ fontSize: '11px', color: '#34d399', marginTop: '2px', display: 'block' }}>${(totalConversions * 49).toLocaleString()} Est. Value</span>
          </div>
        </section>

        {/* Input Box Card */}
        <section className="glass-card" style={{ padding: '32px', marginBottom: '32px', borderLeft: '4px solid #3b82f6', background: 'linear-gradient(180deg, rgba(24,24,27,0.8) 0%, rgba(9,9,11,0.9) 100%)' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
              </svg>
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0, fontFamily: 'var(--font-display)' }}>
                Connect Social Media Handle or Channel URL
              </h2>
              <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                Enter your YouTube channel link (e.g. <code>@mrbeast</code>) or profile handle from supported social platforms
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
                      if (p.name === 'YouTube') setInputVal('@');
                      else if (p.name === 'X / Twitter') setInputVal('@');
                    }
                  }}
                  style={{
                    background: active ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                    border: `1px solid ${active ? '#3b82f6' : 'rgba(255, 255, 255, 0.08)'}`,
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
                  if (!validationError) e.currentTarget.style.borderColor = '#3b82f6';
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
                Strict Domain Enforced: Only <strong>YouTube, X/Twitter, LinkedIn, Instagram, Threads, Bluesky, TikTok</strong> accepted.
              </span>

              <button
                type="submit"
                disabled={scraping || !inputVal || !!validationError}
                className="glow-btn glow-btn-primary"
                style={{
                  padding: '12px 28px',
                  fontWeight: 600,
                  fontSize: '14px',
                  opacity: scraping || !inputVal || !!validationError ? 0.5 : 1,
                  cursor: scraping || !inputVal || !!validationError ? 'not-allowed' : 'pointer'
                }}
              >
                {scraping ? 'Connecting Channel...' : 'Connect Social Channel'}
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

        {/* Connected Social Accounts / Handles Feed */}
        <section className="glass-card" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, fontFamily: 'var(--font-display)' }}>
                Connected Social Handles & Channels ({handles.length})
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                Active social channels connected to your monitoring pipeline
              </p>
            </div>
            <button
              onClick={loadSocialHandles}
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
              Loading connected channels...
            </div>
          ) : handles.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 24px', background: 'rgba(255,255,255,0.01)', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.08)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', color: '#60a5fa' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                </svg>
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#ffffff', marginBottom: '6px' }}>No Social Channels Connected Yet</h3>
              <p style={{ fontSize: '13px', color: '#718096', maxWidth: '400px', margin: '0 auto' }}>
                Add your YouTube channel or social media handle above to begin monitoring channel reach, engagement rates, and conversions.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: '#718096' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>CHANNEL / HANDLE</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>PLATFORM</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>TRACKED ITEMS</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>TOTAL REACH</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>AVG ENGAGEMENT</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>STATUS</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {handles.map((h, i) => {
                    const platform = getPlatformLabel(h.sample_url, h.channel);
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)', transition: 'background 0.2s' }}>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              background: platform.bg,
                              color: platform.color,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '11px'
                            }}>
                              {platform.name === 'YouTube' ? 'YT' : (platform.name === 'X / Twitter' ? 'X' : 'SOC')}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, color: '#ffffff' }}>
                                {h.handle_name}
                              </div>
                              <span style={{ fontSize: '11px', color: '#718096' }}>
                                Last active: {h.last_synced ? new Date(h.last_synced).toLocaleDateString() : 'Active'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            background: platform.bg,
                            color: platform.color,
                            fontSize: '11px',
                            fontWeight: 600
                          }}>
                            {platform.name}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', color: '#e2e8f0', fontWeight: 600 }}>
                          {h.items_count} {h.items_count === 1 ? 'item' : 'items'}
                        </td>
                        <td style={{ padding: '14px 16px', fontWeight: 700, color: '#ffffff' }}>
                          {h.total_views.toLocaleString()}
                        </td>
                        <td style={{ padding: '14px 16px', color: '#34d399', fontWeight: 600 }}>
                          {(h.avg_engagement * 100).toFixed(1)}%
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '6px',
                            background: 'rgba(52, 211, 153, 0.1)',
                            color: '#34d399',
                            fontSize: '11px',
                            fontWeight: 600
                          }}>
                            Active
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
                            <Link href="/?channel=social" style={{ fontSize: '12px', color: '#60a5fa', textDecoration: 'none', fontWeight: 600 }}>
                              Dashboard →
                            </Link>
                            <button
                              onClick={() => handleDisconnectHandle(h.handle_name)}
                              style={{
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.25)',
                                color: '#f87171',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                            >
                              Disconnect & Wipe
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </div>
    </SidebarLayout>
  );
}
