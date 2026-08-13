'use client';

import React, { useState, useEffect } from 'react';

interface OnboardingWizardProps {
  initialError?: string;
}

export default function OnboardingWizard({ initialError }: OnboardingWizardProps) {
  const [showModal, setShowModal] = useState(false);
  const [contentUrl, setContentUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(initialError || null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [statusLog, setStatusLog] = useState<string | null>(null);
  const [cookiesDismissed, setCookiesDismissed] = useState(false);

  // Read cookies acceptance state on mount
  useEffect(() => {
    const accepted = localStorage.getItem('cookies-accepted');
    if (accepted) {
      setCookiesDismissed(true);
    }
  }, []);

  const handleAcceptCookies = () => {
    localStorage.setItem('cookies-accepted', 'true');
    setCookiesDismissed(true);
  };

  const handleDenyCookies = () => {
    setCookiesDismissed(true);
  };

  const handleOpenImport = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setStatusLog(null);
    setContentUrl('');
    setShowModal(true);
  };

  const handleTriggerDemo = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setShowModal(true);
    setLoading(true);
    setStatusLog('Initializing demo session with high-fidelity datasets...');

    const demoUrl = 'https://blog.google';
    setContentUrl(demoUrl);

    try {
      await runScrape(demoUrl);
    } catch (err: any) {
      setErrorMsg(err?.message || String(err));
      setStatusLog(null);
      setLoading(false);
    }
  };

  const handleScrapeFirstUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contentUrl) return;
    setLoading(true);
    setErrorMsg(null);
    setStatusLog('Connecting to URL crawler...');

    try {
      await runScrape(contentUrl);
    } catch (err: any) {
      setErrorMsg(err?.message || String(err));
      setStatusLog(null);
      setLoading(false);
    }
  };

  const runScrape = async (url: string) => {
    setStatusLog('Fetching page/feed and parsing metadata...');
    const res = await fetch('/api/ingestion/scrape', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    const data = await res.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Scraping failed.');
    }

    const isChannel = data.channelImport;
    const count = data.count || 1;

    if (isChannel) {
      setStatusLog(`Success! Imported channel with ${count} latest items.`);
      setSuccessMsg(`Imported feed successfully!`);
    } else {
      setStatusLog(`Success! Extracted: "${data.content.title}" (${data.content.topic})`);
      setSuccessMsg('Content source scraped successfully!');
    }

    setTimeout(() => {
      setSuccessMsg(null);
      setStatusLog(null);
      setShowModal(false);
      setLoading(false);
      window.location.reload(); // Reload immediately to show live dashboard!
    }, 1500);
  };

  return (
    <div className="landing-page">
      
      {/* 1. Header/Navigation */}
      <header style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '24px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.5px' }}>
            ContentPulse
          </span>
        </div>

        <nav style={{ display: 'flex', gap: '32px' }}>
          <span style={{ fontSize: '14px', color: '#a0aec0', cursor: 'pointer', transition: 'color 0.2s' }} onClick={handleOpenImport}>Dashboard</span>
          <span style={{ fontSize: '14px', color: '#a0aec0', cursor: 'pointer', transition: 'color 0.2s' }} onClick={handleOpenImport}>Reports</span>
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {/* Bell Icon */}
          <button style={{ background: 'transparent', border: 'none', color: '#a0aec0', cursor: 'pointer' }} onClick={handleOpenImport}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
            </svg>
          </button>
          
          {/* Gear Icon */}
          <button style={{ background: 'transparent', border: 'none', color: '#a0aec0', cursor: 'pointer' }} onClick={handleOpenImport}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </button>
          
          {/* CP Profile Avatar */}
          <div 
            onClick={handleOpenImport}
            style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: '50%', 
              background: 'rgba(255,255,255,0.08)', 
              border: '1px solid rgba(255,255,255,0.2)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '12px', 
              fontWeight: 700, 
              color: '#ffffff',
              cursor: 'pointer'
            }}
          >
            CP
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '120px 32px 140px 32px',
        textAlign: 'center',
        position: 'relative'
      }}>
        
        {/* Floating Graphic Background Assets */}
        {/* Blue Circle / Screen Icon (Left of Headline) */}
        <div className="animate-float" style={{
          position: 'absolute',
          left: '12%',
          top: '80px',
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 30% 30%, #3182ce, #1a365d)',
          boxShadow: '0 0 20px rgba(49, 130, 206, 0.5), inset 0 2px 4px rgba(255,255,255,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff'
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="12" rx="2"></rect>
            <path d="M12 15v5"></path>
            <path d="M8 20h8"></path>
            <path d="M9 7l3-3 3 3"></path>
          </svg>
        </div>

        {/* Purple Pill (Below Screen Icon, Left of NEW ERA) */}
        <div className="animate-float-delayed" style={{
          position: 'absolute',
          left: '20%',
          top: '190px',
          width: '32px',
          height: '18px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #22d3ee, #0891b2)',
          transform: 'rotate(-25deg)',
          boxShadow: '0 0 15px rgba(34, 211, 238, 0.4)'
        }}></div>

        {/* Lightbulb Circle (Right of Headline) */}
        <div className="animate-float-delayed" style={{
          position: 'absolute',
          right: '12%',
          top: '110px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 30% 30%, #1e40af, #1e1b4b)',
          boxShadow: '0 0 25px rgba(59, 130, 246, 0.6), inset 0 2px 4px rgba(255,255,255,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#60a5fa'
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A5 5 0 0 0 8 8c0 1 .4 2.5 1.5 3.5.7.8 1.3 1.5 1.5 2.5"></path>
            <path d="M9 18h6"></path>
            <path d="M10 22h4"></path>
          </svg>
        </div>

        {/* Blue Chart Diamond (Lower Left of Hero) */}
        <div className="animate-float-fast" style={{
          position: 'absolute',
          left: '16%',
          bottom: '150px',
          width: '64px',
          height: '64px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #0ea5e9, #2563eb)',
          transform: 'rotate(15deg) skew(-5deg)',
          boxShadow: '0 10px 25px rgba(14, 165, 233, 0.5), inset 0 2px 4px rgba(255,255,255,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff'
        }}>
          <div style={{ transform: 'rotate(-15deg)' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="20" x2="18" y2="10"></line>
              <line x1="12" y1="20" x2="12" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>
          </div>
        </div>

        {/* Yellow Circle Outline (Below Blue Chart Diamond) */}
        <div className="animate-float" style={{
          position: 'absolute',
          left: '28%',
          bottom: '80px',
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          border: '3px solid #fbbf24',
          boxShadow: '0 0 10px rgba(251, 191, 36, 0.4)'
        }}></div>

        {/* Green Diamond Outline (Lower Right of Hero) */}
        <div className="animate-float-fast" style={{
          position: 'absolute',
          right: '20%',
          bottom: '160px',
          width: '28px',
          height: '28px',
          background: '#047857',
          border: '1px solid #34d399',
          transform: 'rotate(45deg)',
          boxShadow: '0 0 20px rgba(52, 211, 153, 0.4)'
        }}></div>

        {/* Red/Pink lightning bolt rotated square (Right of Editorial AI) */}
        <div className="animate-float" style={{
          position: 'absolute',
          right: '14%',
          bottom: '220px',
          width: '68px',
          height: '68px',
          borderRadius: '14px',
          background: 'linear-gradient(135deg, #ec4899, #be185d)',
          transform: 'rotate(-12deg)',
          boxShadow: '0 10px 25px rgba(236, 72, 153, 0.5), inset 0 2px 4px rgba(255,255,255,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff'
        }}>
          <div style={{ transform: 'rotate(12deg)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
            </svg>
          </div>
        </div>

        {/* AI-Powered Insights Badge */}
        <div style={{ display: 'inline-flex', justifyContent: 'center', marginBottom: '32px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(59, 130, 246, 0.35)',
            borderRadius: '30px',
            padding: '6px 16px',
            fontSize: '12px',
            fontWeight: 600,
            color: '#60a5fa',
            letterSpacing: '0.05em',
            boxShadow: '0 0 15px rgba(59, 130, 246, 0.15)'
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3b82f6', display: 'inline-block', boxShadow: '0 0 8px #3b82f6' }}></span>
            AI-Powered Insights
          </div>
        </div>

        {/* Hero Title */}
        <h1 style={{
          fontSize: '92px',
          fontWeight: 900,
          lineHeight: '0.9',
          letterSpacing: '-2px',
          margin: '0 0 36px 0',
          fontFamily: 'var(--font-display)',
          textTransform: 'uppercase'
        }}>
          <div style={{ color: '#ffffff' }}>Join The</div>
          <div className="stroke-text" style={{ margin: '8px 0' }}>New Era Of</div>
          <div style={{ color: '#ffffff' }}>Editorial AI</div>
        </h1>

        {/* Hero Description */}
        <p style={{
          color: '#94a3b8',
          fontSize: '18px',
          maxWidth: '560px',
          margin: '0 auto 48px auto',
          lineHeight: '1.6',
          fontWeight: 400
        }}>
          Connect your metrics to editorial decisions. Transform data into actionable content planning with precision and foresight.
        </p>

        {/* CTA Buttons */}
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', alignItems: 'center' }}>
          <button 
            onClick={handleOpenImport}
            className="glow-btn glow-btn-primary" 
            style={{ 
              padding: '14px 28px', 
              fontSize: '15px', 
              fontWeight: 600, 
              borderRadius: '8px',
              boxShadow: '0 4px 20px rgba(59, 130, 246, 0.3)'
            }}
          >
            Start Free Trial
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
          
          <button 
            onClick={handleTriggerDemo}
            style={{ 
              padding: '14px 28px', 
              fontSize: '15px', 
              fontWeight: 500, 
              borderRadius: '8px',
              background: '#000000',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#ffffff',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#ffffff';
              e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
              e.currentTarget.style.background = '#000000';
            }}
          >
            View Demo
          </button>
        </div>
      </section>

      {/* 3. Intelligence at Scale Section */}
      <section style={{
        maxWidth: '1060px',
        margin: '0 auto',
        padding: '0 32px 140px 32px'
      }}>
        
        {/* Section Heading */}
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#ffffff', marginBottom: '8px', fontFamily: 'var(--font-display)' }}>
            Intelligence at Scale
          </h2>
          <p style={{ color: '#64748b', fontSize: '15px' }}>
            Comprehensive tools for modern editorial teams.
          </p>
        </div>

        {/* Cards Grid Container */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Row 1: Two Columns */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px' }}>
            
            {/* Card 1: Omnichannel Monitoring */}
            <div className="glass-card" style={{ 
              padding: '36px', 
              borderRadius: '12px', 
              background: 'rgba(10, 10, 12, 0.45)', 
              border: '1px solid rgba(255, 255, 255, 0.05)',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px'
            }}>
              {/* Icon Container */}
              <div style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '8px', 
                background: 'rgba(59, 130, 246, 0.08)', 
                border: '1px solid rgba(59, 130, 246, 0.25)', 
                color: '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="2" y1="12" x2="22" y2="12"></line>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                </svg>
              </div>

              {/* Text info */}
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', marginBottom: '10px', fontFamily: 'var(--font-display)' }}>
                  Omnichannel Monitoring
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.6' }}>
                  Track performance across Web, Social, and Newsletter platforms in real-time. Unify your streams into a single cohesive narrative.
                </p>
              </div>
            </div>

            {/* Card 2: Deep Performance Analytics */}
            <div className="glass-card" style={{ 
              padding: '36px', 
              borderRadius: '12px', 
              background: 'rgba(10, 10, 12, 0.45)', 
              border: '1px solid rgba(255, 255, 255, 0.05)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '230px',
              gap: '24px'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Icon Container */}
                <div style={{ 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '8px', 
                  background: 'rgba(59, 130, 246, 0.08)', 
                  border: '1px solid rgba(59, 130, 246, 0.25)', 
                  color: '#3b82f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="20" x2="18" y2="10"></line>
                    <line x1="12" y1="20" x2="12" y2="4"></line>
                    <line x1="6" y1="20" x2="6" y2="14"></line>
                  </svg>
                </div>

                {/* Text info */}
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', marginBottom: '10px', fontFamily: 'var(--font-display)' }}>
                    Deep Performance Analytics
                  </h3>
                  <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.6' }}>
                    Go beyond vanity metrics. Understand user engagement depth, read times, and conversion paths with high-fidelity data visualization.
                  </p>
                </div>
              </div>

              {/* Badges */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <span style={{ 
                  fontSize: '9px', 
                  fontWeight: 700, 
                  letterSpacing: '0.08em', 
                  color: '#94a3b8', 
                  background: 'rgba(255,255,255,0.02)', 
                  border: '1px solid rgba(255,255,255,0.08)',
                  padding: '4px 10px',
                  borderRadius: '4px'
                }}>RETENTION</span>
                <span style={{ 
                  fontSize: '9px', 
                  fontWeight: 700, 
                  letterSpacing: '0.08em', 
                  color: '#94a3b8', 
                  background: 'rgba(255,255,255,0.02)', 
                  border: '1px solid rgba(255,255,255,0.08)',
                  padding: '4px 10px',
                  borderRadius: '4px'
                }}>ENGAGEMENT</span>
              </div>
            </div>

          </div>

          {/* Row 2: Full Width Card */}
          <div className="glass-card" style={{ 
            padding: '36px', 
            borderRadius: '12px', 
            background: 'rgba(10, 10, 12, 0.45)', 
            border: '1px solid rgba(255, 255, 255, 0.05)',
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr',
            gap: '40px',
            alignItems: 'center'
          }}>
            {/* Left side Content */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Icon Container */}
              <div style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '8px', 
                background: 'rgba(59, 130, 246, 0.08)', 
                border: '1px solid rgba(59, 130, 246, 0.25)', 
                color: '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                </svg>
              </div>

              {/* Text Info */}
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', marginBottom: '12px', fontFamily: 'var(--font-display)' }}>
                  AI-Driven Content Recommendations
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.6' }}>
                  Let intelligence guide your editorial calendar. Our models predict trending topics and suggest optimal publishing windows based on historical performance.
                </p>
              </div>

              {/* Link */}
              <div 
                onClick={handleOpenImport}
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  color: '#ffffff', 
                  fontSize: '11px', 
                  fontWeight: 700, 
                  letterSpacing: '0.08em', 
                  cursor: 'pointer',
                  transition: 'opacity 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                EXPLORE MODELS 
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </div>
            </div>

            {/* Right side Monospace Terminal Panel Graphic */}
            <div style={{
              background: 'rgba(5, 7, 15, 0.85)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: '8px',
              padding: '24px',
              fontFamily: 'monospace',
              fontSize: '12px',
              color: '#4f5e80',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 2px rgba(255,255,255,0.05)',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              minHeight: '200px',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden'
            }}>
              
              {/* Monospace Code Lines */}
              <div style={{ color: '#3b82f6', opacity: 0.8, letterSpacing: '0.05em' }}>
                INITIATING NLP PROTOCOL...
              </div>

              {/* Central Glowing Processor Graphic */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', position: 'relative' }}>
                
                {/* Simulated Data flow line */}
                <svg width="100%" height="40" style={{ position: 'absolute', top: '10px', left: 0, zIndex: 0, opacity: 0.3 }}>
                  <line x1="0" y1="20" x2="100%" y2="20" stroke="#4f5e80" strokeWidth="1" strokeDasharray="4 4" />
                  <path d="M 0,20 Q 100,5 200,20 T 400,20" fill="none" stroke="#3b82f6" strokeWidth="1.5" className="animate-draw-flow" />
                </svg>

                {/* Glowing bulb core */}
                <div className="animate-pulse-light" style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'rgba(59, 130, 246, 0.15)',
                  border: '1px solid rgba(59, 130, 246, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#3b82f6',
                  zIndex: 2,
                  boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)'
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A5 5 0 0 0 8 8c0 1 .4 2.5 1.5 3.5.7.8 1.3 1.5 1.5 2.5"></path>
                    <path d="M9 18h6"></path>
                  </svg>
                </div>

                <div style={{ zIndex: 2, color: '#94a3b8', fontSize: '11px', background: 'rgba(5,7,15,0.9)', padding: '4px 10px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)', letterSpacing: '0.05em' }}>
                  PROCESSING DATA STREAMS...
                </div>
              </div>

              <div style={{ color: '#4f5e80', opacity: 0.6, letterSpacing: '0.05em' }}>
                GENERATING INSIGHTS...
              </div>
            </div>

          </div>

        </div>

      </section>

      {/* 4. Footer */}
      <footer style={{
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        background: '#030303',
        padding: '64px 32px 80px 32px',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{
          maxWidth: '1060px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '40px'
        }}>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', marginBottom: '12px' }}>
              ContentPulse
            </div>
            <div style={{ color: '#4f5e80', fontSize: '13px' }}>
              © 2024 ContentPulse AI. Editorial Precision via Intelligence.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '32px' }}>
            <span onClick={handleOpenImport} style={{ fontSize: '13px', color: '#4f5e80', cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = '#4f5e80'}>Privacy</span>
            <span onClick={handleOpenImport} style={{ fontSize: '13px', color: '#4f5e80', cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = '#4f5e80'}>Terms</span>
            <span onClick={handleOpenImport} style={{ fontSize: '13px', color: '#4f5e80', cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = '#4f5e80'}>API Status</span>
            <span onClick={handleOpenImport} style={{ fontSize: '13px', color: '#4f5e80', cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = '#4f5e80'}>Support</span>
          </div>
        </div>
      </footer>

      {/* 5. Cookie Banner Pill */}
      {!cookiesDismissed && (
        <div className="cookie-banner">
          <span>This website uses cookies. </span>
          <span style={{ textDecoration: 'underline', cursor: 'pointer', color: '#38bdf8', marginLeft: '-10px' }} onClick={handleOpenImport}>Learn More</span>
          <button className="cookie-banner-btn" onClick={handleAcceptCookies}>Accept</button>
          <button className="cookie-banner-btn-secondary" onClick={handleDenyCookies}>Deny</button>
        </div>
      )}

      {/* 6. Ingestion Overlay Modal Dialog */}
      {showModal && (
        <div className="modal-overlay" onClick={() => !loading && setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            
            {/* Close Button */}
            {!loading && (
              <button className="modal-close-btn" onClick={() => setShowModal(false)}>×</button>
            )}

            <form onSubmit={handleScrapeFirstUrl} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff', marginBottom: '8px', fontFamily: 'var(--font-display)' }}>
                  Import Your Content
                </h2>
                <p style={{ color: '#94a3b8', fontSize: '13px', lineHeight: '1.6' }}>
                  Paste the URL of your publication, blog, channel, or article below to initialize the intelligence dashboard and analyze performance metrics.
                </p>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                  Content URL
                </label>
                <input 
                  type="url"
                  required
                  disabled={loading}
                  value={contentUrl}
                  onChange={e => setContentUrl(e.target.value)}
                  placeholder="https://example.com/your-content-link"
                  style={{ 
                    width: '100%', 
                    padding: '14px 16px', 
                    borderRadius: '8px', 
                    background: 'rgba(0,0,0,0.3)', 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    color: '#fff', 
                    fontSize: '14px', 
                    outline: 'none',
                    transition: 'all 0.3s ease' 
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = '#3b82f6'}
                  onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
                <span style={{ display: 'block', fontSize: '11px', color: '#4f5e80', marginTop: '8px' }}>
                  Enter any publication, article, feed, or channel link to parse metadata and build the dashboard.
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="glow-btn glow-btn-primary"
                  style={{ padding: '14px', justifyContent: 'center', fontWeight: 600, fontSize: '15px', borderRadius: '8px', width: '100%' }}
                >
                  {loading ? 'Processing Crawler...' : 'Import & Build Dashboard'}
                </button>
                
                {!loading && (
                  <button 
                    type="button"
                    onClick={handleTriggerDemo}
                    style={{ 
                      padding: '14px', 
                      justifyContent: 'center', 
                      fontWeight: 500, 
                      fontSize: '14px', 
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: '#ffffff',
                      cursor: 'pointer',
                      width: '100%',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  >
                    Quick Seed with Google Blog Demo Data
                  </button>
                )}
              </div>
            </form>

            {/* Setup Logs & Status */}
            {statusLog && (
              <div style={{ 
                marginTop: '24px', 
                background: 'rgba(0,0,0,0.4)', 
                border: '1px solid rgba(255,255,255,0.05)', 
                padding: '16px', 
                borderRadius: '8px', 
                fontSize: '12px', 
                fontFamily: 'monospace', 
                color: '#94a3b8', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px' 
              }}>
                <span className="animate-pulse" style={{ width: '8px', height: '8px', background: '#3b82f6', borderRadius: '50%', boxShadow: '0 0 10px #3b82f6' }}></span>
                <span>{statusLog}</span>
              </div>
            )}

            {successMsg && (
              <div style={{ 
                marginTop: '20px', 
                background: 'rgba(16, 185, 129, 0.1)', 
                border: '1px solid #10b981', 
                padding: '14px 16px', 
                borderRadius: '8px', 
                fontSize: '13px', 
                color: '#34d399', 
                fontWeight: 500 
              }}>
                {successMsg}
              </div>
            )}

            {errorMsg && (
              <div style={{ 
                marginTop: '20px', 
                background: 'rgba(239, 68, 68, 0.1)', 
                border: '1px solid #ef4444', 
                padding: '14px 16px', 
                borderRadius: '8px', 
                fontSize: '13px', 
                color: '#f87171' 
              }}>
                <strong style={{ display: 'block', marginBottom: '6px' }}>Import Failed:</strong>
                <pre style={{ margin: 0, fontSize: '11px', whiteSpace: 'pre-wrap', fontFamily: 'monospace', opacity: 0.9 }}>{errorMsg}</pre>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
