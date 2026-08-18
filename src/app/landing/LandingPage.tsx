'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

interface ScrollSlideProps {
  direction?: 'left' | 'right' | 'up' | 'scale';
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

function ScrollSlide({ direction = 'up', children, style = {}, className = '' }: ScrollSlideProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [animStyle, setAnimStyle] = useState<React.CSSProperties>({
    opacity: 0.1,
    transform: direction === 'left' ? 'translateX(-80px)' : direction === 'right' ? 'translateX(80px)' : direction === 'scale' ? 'scale(0.9)' : 'translateY(60px)',
    transition: 'transform 0.32s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.32s ease-out',
    willChange: 'transform, opacity'
  });

  useEffect(() => {
    let ticking = false;

    const calculateMotion = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Center-anchored distance calculation
      const elementCenter = rect.top + rect.height / 2;
      const screenCenter = windowHeight / 2;
      const distFromCenter = elementCenter - screenCenter;

      // Plateau: inside middle 25% of viewport, the slide is 100% docked and centered
      const plateau = windowHeight * 0.15;
      
      let factor = 0;
      if (Math.abs(distFromCenter) > plateau) {
        const excess = Math.abs(distFromCenter) - plateau;
        const maxTravel = windowHeight * 0.54;
        factor = Math.min(1, excess / maxTravel);
      }

      const isBelow = distFromCenter > 0;
      const opacity = Math.max(0.08, 1 - factor * 0.92);

      let transform = 'translate(0, 0) scale(1)';
      if (factor > 0) {
        if (direction === 'left') {
          const shift = isBelow ? -factor * 120 : -factor * 100;
          transform = `translateX(${shift}px)`;
        } else if (direction === 'right') {
          const shift = isBelow ? factor * 120 : factor * 100;
          transform = `translateX(${shift}px)`;
        } else if (direction === 'scale') {
          const scale = 1 - factor * 0.12;
          const shiftY = isBelow ? factor * 50 : -factor * 45;
          transform = `scale(${scale}) translateY(${shiftY}px)`;
        } else {
          const shiftY = isBelow ? factor * 70 : -factor * 55;
          transform = `translateY(${shiftY}px)`;
        }
      }

      setAnimStyle({
        opacity,
        transform,
        transition: 'transform 0.32s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.32s ease-out',
        willChange: 'transform, opacity'
      });

      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(calculateMotion);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    
    // Initial call
    calculateMotion();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [direction]);

  return (
    <div ref={ref} className={className} style={{ ...style, ...animStyle }}>
      {children}
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="landing-page" style={{ minHeight: '100vh', background: '#000000', color: '#ffffff', fontFamily: 'var(--font-body)', position: 'relative', overflowX: 'hidden' }}>
      
      {/* Ambient background glow */}
      <div style={{
        position: 'fixed',
        top: '-150px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '800px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.12) 0%, rgba(6, 182, 212, 0.05) 50%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* 1. Header Navigation */}
      <header style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '24px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'relative',
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '22px', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.5px' }}>
            ContentPulse
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
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
            <button className="glow-btn glow-btn-primary" style={{ padding: '10px 22px', fontSize: '13px', fontWeight: 700, borderRadius: '8px' }}>
              Sign Up →
            </button>
          </Link>
        </div>
      </header>

      {/* 2. SLIDE 1: HERO SECTION */}
      <section style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '90px 32px 140px 32px',
        textAlign: 'center',
        position: 'relative',
        zIndex: 10
      }}>
        
        {/* Floating Ambient 3D Shapes */}
        <div className="animate-float" style={{
          position: 'absolute',
          left: '10%',
          top: '60px',
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

        <div className="animate-float-delayed" style={{
          position: 'absolute',
          right: '10%',
          top: '90px',
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

        {/* Hero Title */}
        <ScrollSlide direction="up">
          <h1 style={{
            fontSize: 'clamp(52px, 8vw, 92px)',
            fontWeight: 900,
            lineHeight: '0.92',
            letterSpacing: '-2px',
            margin: '0 0 32px 0',
            fontFamily: 'var(--font-display)',
            textTransform: 'uppercase'
          }}>
            <div style={{ color: '#ffffff' }}>Join The</div>
            <div className="stroke-text" style={{ margin: '8px 0' }}>New Era Of</div>
            <div style={{ color: '#ffffff' }}>Editorial AI</div>
          </h1>
        </ScrollSlide>

        {/* Hero Description */}
        <ScrollSlide direction="up">
          <p style={{
            color: '#94a3b8',
            fontSize: '18px',
            maxWidth: '580px',
            margin: '0 auto 40px auto',
            lineHeight: '1.6',
            fontWeight: 400
          }}>
            Connect fragmented multi-channel metrics to high-conviction publishing decisions. Scroll down to see how ContentPulse powers your editorial strategy.
          </p>
        </ScrollSlide>

        {/* CTA Buttons */}
        <ScrollSlide direction="scale">
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
            <Link href="/auth?mode=signup" style={{ textDecoration: 'none' }}>
              <button 
                className="glow-btn glow-btn-primary" 
                style={{ 
                  padding: '14px 32px', 
                  fontSize: '15px', 
                  fontWeight: 700, 
                  borderRadius: '8px',
                  boxShadow: '0 4px 20px rgba(59, 130, 246, 0.3)'
                }}
              >
                Get Started Now
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '8px', display: 'inline-block', verticalAlign: 'middle' }}>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>
            </Link>
            
            <Link href="/auth?mode=signin" style={{ textDecoration: 'none' }}>
              <button 
                style={{ 
                  padding: '14px 28px', 
                  fontSize: '15px', 
                  fontWeight: 600, 
                  borderRadius: '8px',
                  background: '#000000',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Sign In
              </button>
            </Link>
          </div>
        </ScrollSlide>

        {/* Scroll indicator prompt */}
        <div style={{ marginTop: '70px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', opacity: 0.6 }}>
          <span style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b' }}>
            Scroll down & up to experience real-time slides
          </span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" className="animate-bounce" style={{ animationDuration: '2s' }}>
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SLIDE 2: UNIFIED OMNICHANNEL INGESTION (Slides In from Left) */}
      {/* ========================================================================= */}
      <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '90px 32px 140px 32px', position: 'relative' }}>
        <ScrollSlide direction="left">
          <div className="glass-card" style={{
            padding: '48px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.6) 0%, rgba(9, 9, 11, 0.8) 100%)',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '40px', alignItems: 'center' }}>
              
              {/* Left Description */}
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', borderRadius: '20px', background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '16px' }}>
                  01 / MULTI-CHANNEL INGESTION
                </div>
                <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.5px', marginBottom: '16px', lineHeight: '1.2', fontFamily: 'var(--font-display)' }}>
                  Stop hopping between 5 different analytics tabs.
                </h2>
                <p style={{ color: '#94a3b8', fontSize: '15px', lineHeight: '1.7', marginBottom: '24px' }}>
                  ContentPulse continuously monitors and ingests your feeds in under 1.5 seconds. Web articles, YouTube channels, Substack newsletters, and social feeds are all normalized into a single database.
                </p>

                {/* Supported Badges */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {['Google Analytics 4', 'YouTube Data API', 'Substack & Beehiiv', 'Search Console', 'Social Streams'].map((item, idx) => (
                    <span key={idx} style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '4px 10px',
                      borderRadius: '6px',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: '#e2e8f0'
                    }}>
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              {/* Right Visual Card Stack */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{
                  background: 'rgba(0,0,0,0.6)',
                  border: '1px solid rgba(52, 211, 153, 0.3)',
                  borderRadius: '10px',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'rgba(52, 211, 153, 0.15)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '11px' }}>
                      WEB
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>Technical Deep Dive: Next.js 15</div>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>GA4 • 4,820 Reads • 180s Read Time</span>
                    </div>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#34d399' }}>+4.2% Conv</span>
                </div>

                <div style={{
                  background: 'rgba(0,0,0,0.6)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '10px',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '11px' }}>
                      YT
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>AI Engineering Masterclass</div>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>YouTube • 48,500 Views • 68% Retention</span>
                    </div>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#f87171' }}>+8.6% Conv</span>
                </div>

                <div style={{
                  background: 'rgba(0,0,0,0.6)',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                  borderRadius: '10px',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '11px' }}>
                      NL
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>Issue #42: The Future of Compute</div>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>Substack • 2,900 Opens • 52% CTR</span>
                    </div>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#06b6d4' }}>+5.1% Conv</span>
                </div>
              </div>

            </div>
          </div>
        </ScrollSlide>
      </section>

      {/* ========================================================================= */}
      {/* SLIDE 3: AI TAXONOMY & RESONANCE CLUSTERING (Slides In from Right) */}
      {/* ========================================================================= */}
      <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '90px 32px 140px 32px', position: 'relative' }}>
        <ScrollSlide direction="right">
          <div className="glass-card" style={{
            padding: '48px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(24, 24, 27, 0.6) 0%, rgba(9, 9, 11, 0.8) 100%)',
            border: '1px solid rgba(6, 182, 212, 0.25)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '40px', alignItems: 'center' }}>
              
              {/* Left: Dynamic Topic Clusters Graphic */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {[
                  { name: 'AI Engineering & Models', views: '142.5K Views', rate: 'High Resonance', bg: 'linear-gradient(90deg, #34d399, #10b981)', color: '#065f46', width: '92%' },
                  { name: 'Full-Stack Architecture', views: '68.2K Views', rate: 'High Resonance', bg: 'linear-gradient(90deg, #38bdf8, #0ea5e9)', color: '#0c4a6e', width: '74%' },
                  { name: 'Gaming & Tech Hardware', views: '32.1K Views', rate: 'Medium Resonance', bg: 'linear-gradient(90deg, #fbbf24, #f59e0b)', color: '#78350f', width: '52%' },
                  { name: 'Generic Marketing Guides', views: '8.4K Views', rate: 'Low Resonance', bg: 'linear-gradient(90deg, #94a3b8, #64748b)', color: '#1e293b', width: '28%' }
                ].map((topic, i) => (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, color: '#e2e8f0', marginBottom: '6px' }}>
                      <span>{topic.name}</span>
                      <span style={{ color: '#94a3b8' }}>{topic.views}</span>
                    </div>
                    <div style={{ width: '100%', height: '22px', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', overflow: 'hidden', padding: '2px' }}>
                      <div style={{
                        width: topic.width,
                        height: '100%',
                        background: topic.bg,
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        paddingLeft: '10px'
                      }}>
                        <span style={{ fontSize: '10px', fontWeight: 800, color: topic.color }}>{topic.rate}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Right: Explanatory Content */}
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', borderRadius: '20px', background: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '16px' }}>
                  02 / AI-POWERED TAXONOMY
                </div>
                <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.5px', marginBottom: '16px', lineHeight: '1.2', fontFamily: 'var(--font-display)' }}>
                  Powered by Gemini 1.5 Flash.
                </h2>
                <p style={{ color: '#94a3b8', fontSize: '15px', lineHeight: '1.7', marginBottom: '20px' }}>
                  Every piece of content is automatically classified into an expanded master taxonomy (Technology, Entertainment, Gaming, Charity, Sports, Science, Drama) to uncover your true audience resonance clusters.
                </p>
                <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.6' }}>
                  No manual tagging required. The model reads headers, reading depth, and engagement rates to map your highest-converting editorial pillars.
                </p>
              </div>

            </div>
          </div>
        </ScrollSlide>
      </section>

      {/* ========================================================================= */}
      {/* SLIDE 4: THE EDITORIAL DECISION MATRIX (Slides In from Left) */}
      {/* ========================================================================= */}
      <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '90px 32px 140px 32px', position: 'relative' }}>
        <ScrollSlide direction="left">
          <div className="glass-card" style={{
            padding: '48px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.5) 0%, rgba(9, 9, 11, 0.8) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
          }}>
            <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 48px auto' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', borderRadius: '20px', background: 'rgba(52, 211, 153, 0.15)', color: '#34d399', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '16px' }}>
                03 / EDITORIAL DECISION DIRECTIVES
              </div>
              <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.5px', marginBottom: '14px', fontFamily: 'var(--font-display)' }}>
                Never guess what to publish next.
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '15px', lineHeight: '1.6' }}>
                ContentPulse distills your catalog into 3 unambiguous, high-conviction editorial directives:
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '20px' }}>
              
              {/* Directive 1: CONTINUE */}
              <div className="glass-card" style={{
                padding: '28px',
                borderRadius: '12px',
                borderLeft: '4px solid #34d399',
                background: 'rgba(0,0,0,0.5)'
              }}>
                <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', color: '#34d399' }}>
                  CONTINUE & AMPLIFY
                </span>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', margin: '10px 0 8px 0' }}>
                  AI Engineering
                </h3>
                <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.6', margin: 0 }}>
                  High statistical conversion rate (2.80%) across YouTube and technical blogs. Allocate more production resources here.
                </p>
              </div>

              {/* Directive 2: STOP */}
              <div className="glass-card" style={{
                padding: '28px',
                borderRadius: '12px',
                borderLeft: '4px solid #f87171',
                background: 'rgba(0,0,0,0.5)'
              }}>
                <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', color: '#f87171' }}>
                  STOP & REALLOCATE
                </span>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', margin: '10px 0 8px 0' }}>
                  Generic SaaS Marketing
                </h3>
                <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.6', margin: 0 }}>
                  Severely underperforming with 0.20% conversion efficiency. Stop spending time writing unindexed fluff.
                </p>
              </div>

              {/* Directive 3: CREATE */}
              <div className="glass-card" style={{
                padding: '28px',
                borderRadius: '12px',
                borderLeft: '4px solid #38bdf8',
                background: 'rgba(0,0,0,0.5)'
              }}>
                <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', color: '#38bdf8' }}>
                  CREATE (SEARCH GAPS)
                </span>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', margin: '10px 0 8px 0' }}>
                  High-Intent Search Gaps
                </h3>
                <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.6', margin: 0 }}>
                  Uncovers high-impression search queries where your brand is currently not ranking on Google.
                </p>
              </div>

            </div>
          </div>
        </ScrollSlide>
      </section>

      {/* ========================================================================= */}
      {/* SLIDE 5: STATISTICAL NORMALIZATION (Slides In from Right) */}
      {/* ========================================================================= */}
      <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '90px 32px 140px 32px', position: 'relative' }}>
        <ScrollSlide direction="right">
          <div className="glass-card" style={{
            padding: '48px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(20, 20, 25, 0.6) 0%, rgba(9, 9, 11, 0.8) 100%)',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '40px', alignItems: 'center' }}>
              
              {/* Left: Explanation */}
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', borderRadius: '20px', background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '16px' }}>
                  04 / STATISTICAL FAIRNESS
                </div>
                <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.5px', marginBottom: '16px', lineHeight: '1.2', fontFamily: 'var(--font-display)' }}>
                  Cross-Catalog Percentile Normalization
                </h2>
                <p style={{ color: '#94a3b8', fontSize: '15px', lineHeight: '1.7', marginBottom: '20px' }}>
                  A YouTube video might get 100,000 views while a high-intent newsletter gets 2,000 opens. Raw vanity counts distort true resonance.
                </p>
                <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.6' }}>
                  ContentPulse computes SQL <code style={{ color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>PERCENT_RANK()</code> window functions to benchmark formats fairly across different scale dynamics.
                </p>
              </div>

              {/* Right: Formula Display Box */}
              <div style={{
                background: 'rgba(0,0,0,0.7)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '12px',
                padding: '32px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
              }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#60a5fa', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '16px' }}>
                  NORMALIZED PERFORMANCE FORMULA
                </div>

                <div style={{
                  fontFamily: 'monospace',
                  fontSize: '13px',
                  color: '#e2e8f0',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '8px',
                  padding: '16px',
                  lineHeight: '1.8'
                }}>
                  <div>Piece Percentile = (Views Pct + Conv Pct) / 2</div>
                  <div style={{ color: '#38bdf8', marginTop: '6px' }}>Avg Topic Index = AVG(Piece Percentile) × 100</div>
                </div>

                <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34d399' }}></span>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>Eliminates vanity bias & reveals high-conversion outliers</span>
                </div>
              </div>

            </div>
          </div>
        </ScrollSlide>
      </section>

      {/* ========================================================================= */}
      {/* SLIDE 6: FINAL CALL TO ACTION (Slides Up with Neon Glow) */}
      {/* ========================================================================= */}
      <section style={{
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '90px 32px 140px 32px',
        textAlign: 'center',
        position: 'relative'
      }}>
        <ScrollSlide direction="scale">
          <div className="glass-card" style={{
            padding: '64px 32px',
            borderRadius: '20px',
            background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.8) 0%, rgba(9, 9, 11, 0.95) 100%)',
            border: '1px solid rgba(59, 130, 246, 0.35)',
            boxShadow: '0 0 50px rgba(59, 130, 246, 0.15)'
          }}>
            <h2 style={{
              fontSize: 'clamp(36px, 6vw, 56px)',
              fontWeight: 900,
              letterSpacing: '-1.5px',
              color: '#ffffff',
              marginBottom: '20px',
              fontFamily: 'var(--font-display)',
              textTransform: 'uppercase'
            }}>
              Ready to Lock In?
            </h2>
            <p style={{
              color: '#94a3b8',
              fontSize: '17px',
              maxWidth: '520px',
              margin: '0 auto 36px auto',
              lineHeight: '1.6'
            }}>
              Stop creating blindly. Start building with data-backed editorial conviction across all your media channels.
            </p>

            <Link href="/auth?mode=signup" style={{ textDecoration: 'none' }}>
              <button 
                className="glow-btn glow-btn-primary" 
                style={{ 
                  padding: '16px 40px', 
                  fontSize: '16px', 
                  fontWeight: 800, 
                  borderRadius: '10px',
                  boxShadow: '0 8px 30px rgba(59, 130, 246, 0.4)',
                  cursor: 'pointer'
                }}
              >
                Get Started Free →
              </button>
            </Link>
          </div>
        </ScrollSlide>
      </section>

      {/* 4. Footer */}
      <footer style={{
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        background: '#030303',
        padding: '40px 32px',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{
          maxWidth: '1060px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', marginBottom: '4px' }}>
              ContentPulse
            </div>
            <div style={{ color: '#4f5e80', fontSize: '13px' }}>
              © 2026 ContentPulse AI. Editorial Precision via Intelligence.
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
