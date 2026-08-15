'use client';

import React, { useState, useEffect } from 'react';
import SidebarLayout from '../SidebarLayout';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface UserProfile {
  id: number;
  name: string;
  email: string;
  company?: string;
  created_at: string;
  stats: {
    total_items: number;
    total_channels: number;
    total_views: number;
    total_conversions: number;
    total_reports: number;
  };
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/auth');
      const data = await res.json();
      if (data && data.user) {
        setUser(data.user);
      } else {
        router.push('/auth?mode=signin');
      }
    } catch (e) {
      console.error('Failed to load user profile:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSignOut = async () => {
    if (!confirm('Are you sure you want to sign out of ContentPulse?')) return;

    setSigningOut(true);
    try {
      await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'signout' })
      });

      router.push('/');
      router.refresh();
    } catch (e) {
      console.error('Sign out error:', e);
    } finally {
      setSigningOut(false);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'CP';
    return name
      .split(' ')
      .map(n => n.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <SidebarLayout>
      <div className="animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto', color: 'var(--color-text)' }}>
        
        {/* Header */}
        <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: 800, margin: 0, letterSpacing: '-0.5px', color: 'var(--color-text)' }}>
              Account Profile
            </h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '15px', marginTop: '4px' }}>
              Manage your personal credentials, workspace organization, and active session
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: 'var(--color-error)',
                padding: '10px 20px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: signingOut ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              <span>{signingOut ? 'Signing out...' : 'Sign Out'}</span>
            </button>
          </div>
        </header>

        {loading ? (
          <div className="glass-card" style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            Loading account profile...
          </div>
        ) : user ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* User Identity Card */}
            <div className="glass-card" style={{ padding: '36px', display: 'flex', alignItems: 'center', gap: '28px', flexWrap: 'wrap', borderLeft: '4px solid var(--color-primary)' }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
                fontWeight: 800,
                color: '#ffffff',
                boxShadow: '0 8px 24px rgba(59, 130, 246, 0.3)'
              }}>
                {getInitials(user.name)}
              </div>

              <div style={{ flex: 1, minWidth: '240px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <h2 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: 'var(--color-text)' }}>
                    {user.name}
                  </h2>
                  <span style={{
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    background: 'var(--color-success-bg)',
                    border: '1px solid rgba(52, 211, 153, 0.3)',
                    color: 'var(--color-success)',
                    fontWeight: 700
                  }}>
                    ACTIVE SUBSCRIBER
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '14px', color: 'var(--color-text-muted)' }}>
                  <div>Email: {user.email}</div>
                  {user.company && <div>Company: {user.company}</div>}
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    Member since {new Date(user.created_at || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </div>
                </div>
              </div>
            </div>

            {/* Account Portfolio Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
              <div className="glass-card" style={{ padding: '20px' }}>
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Tracked Items</span>
                <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-text)', marginTop: '4px' }}>
                  {user.stats?.total_items || 0}
                </div>
                <span style={{ fontSize: '11px', color: 'var(--color-primary)', marginTop: '2px', display: 'block' }}>All Channels</span>
              </div>

              <div className="glass-card" style={{ padding: '20px' }}>
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Audience Reach</span>
                <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-text)', marginTop: '4px' }}>
                  {(user.stats?.total_views || 0).toLocaleString()}
                </div>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px', display: 'block' }}>Total Impressions</span>
              </div>

              <div className="glass-card" style={{ padding: '20px' }}>
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Conversions</span>
                <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-text)', marginTop: '4px' }}>
                  {(user.stats?.total_conversions || 0).toLocaleString()}
                </div>
                <span style={{ fontSize: '11px', color: 'var(--color-success)', marginTop: '2px', display: 'block' }}>${((user.stats?.total_conversions || 0) * 49).toLocaleString()} Est. Value</span>
              </div>

              <div className="glass-card" style={{ padding: '20px' }}>
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>AI Reports</span>
                <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-text)', marginTop: '4px' }}>
                  {user.stats?.total_reports || 0}
                </div>
                <span style={{ fontSize: '11px', color: 'var(--color-secondary)', marginTop: '2px', display: 'block' }}>Synthesized</span>
              </div>
            </div>

            {/* Quick Links & Channel Connections */}
            <div className="glass-card" style={{ padding: '32px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: 'var(--color-text)' }}>
                Connected Monitoring Channels
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                <Link href="/web" style={{ textDecoration: 'none' }}>
                  <div style={{ padding: '16px', borderRadius: '8px', background: 'var(--bg-base)', border: '1px solid var(--border-color)', transition: 'all 0.2s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-success)', fontWeight: 700, marginBottom: '6px' }}>
                      <span>Web & Blog Channel</span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: 0 }}>
                      Manage connected web articles and GA4 signals →
                    </p>
                  </div>
                </Link>

                <Link href="/social" style={{ textDecoration: 'none' }}>
                  <div style={{ padding: '16px', borderRadius: '8px', background: 'var(--bg-base)', border: '1px solid var(--border-color)', transition: 'all 0.2s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-primary)', fontWeight: 700, marginBottom: '6px' }}>
                      <span>Social Media & YouTube</span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: 0 }}>
                      Manage connected social accounts and feeds →
                    </p>
                  </div>
                </Link>

                <Link href="/newsletter" style={{ textDecoration: 'none' }}>
                  <div style={{ padding: '16px', borderRadius: '8px', background: 'var(--bg-base)', border: '1px solid var(--border-color)', transition: 'all 0.2s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-secondary)', fontWeight: 700, marginBottom: '6px' }}>
                      <span>Newsletter Publications</span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: 0 }}>
                      Manage Substack and email publications →
                    </p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Danger Zone: Sign Out */}
            <div className="glass-card" style={{ padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 4px 0' }}>
                  Active Session
                </h4>
                <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: 0 }}>
                  Signing out will terminate your current browser session and return you to the public landing page.
                </p>
              </div>

              <button
                onClick={handleSignOut}
                disabled={signingOut}
                style={{
                  background: 'var(--color-error)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '10px 24px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: signingOut ? 'not-allowed' : 'pointer'
                }}
              >
                {signingOut ? 'Signing out...' : 'Sign Out of ContentPulse'}
              </button>
            </div>

          </div>
        ) : null}

      </div>
    </SidebarLayout>
  );
}
