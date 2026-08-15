'use client';

import React from 'react';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#000000', color: '#ffffff', fontFamily: 'var(--font-body)', overflowX: 'hidden' }}>
      
      {/* 1. TOP HEADER */}
      <header style={{
        height: '72px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        background: 'rgba(9, 9, 11, 0.8)',
        backdropFilter: 'blur(16px)',
        padding: '0 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '16px',
            color: '#fff'
          }}>
            ⚡
          </div>
          <span style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.5px' }}>
            ContentPulse
          </span>
        </div>

        <nav style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link href="/auth?mode=signin" style={{ textDecoration: 'none' }}>
            <button style={{
              background: 'transparent',
              border: 'none',
              color: '#e2e8f0',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
              padding: '8px 16px'
            }}>
              Sign In
            </button>
          </Link>

          <Link href="/auth?mode=signup" style={{ textDecoration: 'none' }}>
            <button className="glow-btn glow-btn-primary" style={{ padding: '10px 20px', fontSize: '13px', fontWeight: 700 }}>
              Get Started Free →
            </button>
          </Link>
        </nav>
      </header>

      {/* 2. HERO SECTION */}
      <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '100px 24px 80px 24px', textAlign: 'center' }}>
        
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 16px',
          borderRadius: '24px',
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          color: '#60a5fa',
          fontSize: '13px',
          fontWeight: 600,
          marginBottom: '24px'
        }}>
          <span>✨</span>
          <span>Next-Gen Multi-Channel Content Intelligence</span>
        </div>

        <h1 style={{
          fontSize: 'clamp(40px, 6vw, 68px)',
          fontWeight: 800,
          lineHeight: '1.08',
          letterSpacing: '-1.5px',
          margin: '0 auto 24px auto',
          maxWidth: '900px',
          background: 'linear-gradient(180deg, #ffffff 30%, #a1a1aa 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Turn Content Publishing into Predictable Revenue
        </h1>

        <p style={{
          fontSize: 'clamp(16px, 2vw, 20px)',
          color: 'var(--color-text-muted)',
          maxWidth: '720px',
          margin: '0 auto 40px auto',
          lineHeight: '1.6'
        }}>
          Ingest and monitor Web, Social, Newsletter, and YouTube channels. Discover optimal word counts, uncaptured Google search queries, and AI editorial strategy reports.
        </p>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/auth?mode=signup" style={{ textDecoration: 'none' }}>
            <button className="glow-btn glow-btn-primary" style={{ padding: '14px 32px', fontSize: '15px', fontWeight: 700 }}>
              Start Free Trial →
            </button>
          </Link>
          <Link href="/auth?mode=signin" style={{ textDecoration: 'none' }}>
            <button style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#ffffff',
              padding: '14px 28px',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer'
            }}>
              Sign In to Dashboard
            </button>
          </Link>
        </div>

        {/* Channels Badge Row */}
        <div style={{ marginTop: '56px', display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {[
            { icon: '🌐', name: 'Web Blogs & Docs', count: 'GA4 Tracking' },
            { icon: '🎬', name: 'YouTube Video & Shorts', count: 'Watch Time' },
            { icon: '💬', name: 'X / LinkedIn / Social', count: 'Virality' },
            { icon: '✉️', name: 'Substack & Newsletters', count: 'Readership' }
          ].map((c, i) => (
            <div key={i} style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              padding: '10px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{ fontSize: '18px' }}>{c.icon}</span>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>{c.name}</div>
                <div style={{ fontSize: '11px', color: '#718096' }}>{c.count}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. CORE FEATURES GRID */}
      <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '60px 24px 100px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.5px' }}>
            Built for Modern Multi-Platform Creators & Editors
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '15px', marginTop: '8px' }}>
            A unified analytical layer that bridges the gap between scattered channel silos
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          
          <div className="glass-card" style={{ padding: '32px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', marginBottom: '16px' }}>
              📊
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px', color: '#ffffff' }}>
              Channel-Filtered Analytics
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', lineHeight: '1.6', margin: 0 }}>
              Seamlessly switch between Web, Social, Newsletter, and YouTube dashboards with tailored metrics, resonance scores, and format indices.
            </p>
          </div>

          <div className="glass-card" style={{ padding: '32px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(52, 211, 153, 0.15)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', marginBottom: '16px' }}>
              🔍
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px', color: '#ffffff' }}>
              Organic Search Gaps
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', lineHeight: '1.6', margin: 0 }}>
              Detect Google Search Console queries receiving high impressions but lacking matching dedicated content, automatically prioritized by ROI score.
            </p>
          </div>

          <div className="glass-card" style={{ padding: '32px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(167, 139, 250, 0.15)', color: '#a78bfa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', marginBottom: '16px' }}>
              🤖
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px', color: '#ffffff' }}>
              Gemini Strategy Engine
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', lineHeight: '1.6', margin: 0 }}>
              Generate comprehensive editorial strategy reports customized for each channel—analyzing topic reallocation, word count sweet spots, and funnel conversions.
            </p>
          </div>

        </div>
      </section>

      {/* 4. BOTTOM CTA BANNER */}
      <section style={{ maxWidth: '1100px', margin: '0 auto 80px auto', padding: '0 24px' }}>
        <div className="glass-card" style={{ padding: '60px 40px', textAlign: 'center', background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.4) 0%, rgba(9, 9, 11, 0.9) 100%)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 800, margin: '0 0 12px 0', letterSpacing: '-0.5px' }}>
            Ready to Supercharge Your Editorial Decisions?
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--color-text-muted)', maxWidth: '500px', margin: '0 auto 32px auto' }}>
            Create your account in 30 seconds and connect your first content stream.
          </p>
          <Link href="/auth?mode=signup" style={{ textDecoration: 'none' }}>
            <button className="glow-btn glow-btn-primary" style={{ padding: '14px 36px', fontSize: '15px', fontWeight: 700 }}>
              Create Account Now →
            </button>
          </Link>
        </div>
      </section>

      {/* 5. FOOTER */}
      <footer style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', padding: '32px', textAlign: 'center', fontSize: '13px', color: '#718096' }}>
        ContentPulse © 2026. Built with Next.js, PostgreSQL, and Google Gemini AI.
      </footer>

    </div>
  );
}
