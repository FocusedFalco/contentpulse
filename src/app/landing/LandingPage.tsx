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
    transform: direction === 'left' ? 'translateX(-40px)' : direction === 'right' ? 'translateX(40px)' : direction === 'scale' ? 'scale(0.95)' : 'translateY(40px)',
    transition: 'transform 0.32s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.32s ease-out',
    willChange: 'transform, opacity'
  });

  useEffect(() => {
    let ticking = false;

    const calculateMotion = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const isMobile = window.innerWidth <= 768;

      // Center-anchored distance calculation
      const elementCenter = rect.top + rect.height / 2;
      const screenCenter = windowHeight / 2;
      const distFromCenter = elementCenter - screenCenter;

      // Plateau: middle 28% of viewport is fully docked
      const plateau = windowHeight * 0.16;
      
      let factor = 0;
      if (Math.abs(distFromCenter) > plateau) {
        const excess = Math.abs(distFromCenter) - plateau;
        const maxTravel = windowHeight * (isMobile ? 0.58 : 0.52);
        factor = Math.min(1, excess / maxTravel);
      }

      const isBelow = distFromCenter > 0;
      const opacity = Math.max(0.06, 1 - factor * 0.94);

      // On mobile screens, use gentler shift distances to prevent viewport overflow
      const maxHorizontalShift = isMobile ? 40 : 110;
      const maxVerticalShift = isMobile ? 35 : 65;

      let transform = 'translate(0, 0) scale(1)';
      if (factor > 0) {
        if (direction === 'left') {
          const shift = isBelow ? -factor * maxHorizontalShift : -factor * (maxHorizontalShift * 0.8);
          transform = `translateX(${shift}px)`;
        } else if (direction === 'right') {
          const shift = isBelow ? factor * maxHorizontalShift : factor * (maxHorizontalShift * 0.8);
          transform = `translateX(${shift}px)`;
        } else if (direction === 'scale') {
          const scale = 1 - factor * (isMobile ? 0.06 : 0.10);
          const shiftY = isBelow ? factor * (maxVerticalShift * 0.6) : -factor * (maxVerticalShift * 0.5);
          transform = `scale(${scale}) translateY(${shiftY}px)`;
        } else {
          const shiftY = isBelow ? factor * maxVerticalShift : -factor * (maxVerticalShift * 0.8);
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
    <div className="landing-page" style={{ minHeight: '100vh', background: '#000000', color: '#cccccc', fontFamily: 'var(--font-sui)', position: 'relative', overflowX: 'hidden' }}>
      
      {/* 1. ThoughtLab Three-Zone Header (Height: 72px, Fluid padding) */}
      <header style={{
        maxWidth: '1400px',
        margin: '0 auto',
        minHeight: '72px',
        padding: '0 clamp(18px, 4vw, 36px)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'relative',
        zIndex: 50
      }}>
        {/* Brand Wordmark with Crimson Dot */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontSize: 'clamp(15px, 4vw, 17px)',
            fontWeight: 700,
            color: '#ffffff',
            letterSpacing: '-0.02em',
            textTransform: 'uppercase',
            fontFamily: 'var(--font-sui)'
          }}>
            CONTENTPULSE
          </span>
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '9999px',
            background: '#fc1c46',
            display: 'inline-block'
          }} />
        </div>

        {/* Quiet Tagline Center (Desktop only) */}
        <div style={{
          fontSize: '13px',
          color: '#4c4c4c',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          fontWeight: 400,
          display: 'none'
        }} className="desktop-nav-links">
          EDITORIAL INTELLIGENCE ARCHITECTURE
        </div>

        {/* Actions Tier: Ghost Link + Crimson Signal Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(12px, 3vw, 24px)' }}>
          <Link href="/auth?mode=signin" style={{
            color: '#ffffff',
            fontSize: 'clamp(13px, 3.5vw, 14px)',
            fontWeight: 400,
            textDecoration: 'none',
            letterSpacing: '-0.01em',
            transition: 'opacity 0.2s',
            whiteSpace: 'nowrap'
          }}
          onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
          onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
          >
            Sign In
          </Link>

          <Link href="/auth?mode=signup" style={{ textDecoration: 'none' }}>
            <button style={{
              background: '#fc1c46',
              color: '#ffffff',
              border: 'none',
              borderRadius: '9999px',
              padding: 'clamp(10px, 2.5vw, 12px) clamp(18px, 4vw, 30px)',
              fontSize: 'clamp(12px, 3vw, 14px)',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '-0.02em',
              cursor: 'pointer',
              boxShadow: 'none',
              transition: 'opacity 0.2s',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              Get Started
            </button>
          </Link>
        </div>
      </header>

      {/* 2. HERO SECTION (198px Monumental Display, Obsidian 3D Form) */}
      <section style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: 'clamp(50px, 10vw, 110px) clamp(18px, 4vw, 36px) clamp(70px, 12vw, 140px) clamp(18px, 4vw, 36px)',
        position: 'relative',
        zIndex: 10
      }}>
        
        {/* Obsidian Liquid 3D Sphere Graphic */}
        <div style={{
          position: 'absolute',
          right: 'clamp(-20px, 3vw, 5%)',
          top: '20px',
          width: 'clamp(160px, 40vw, 480px)',
          height: 'clamp(160px, 40vw, 480px)',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 30%, #1e1e24 0%, #0d0d10 40%, #000000 75%)',
          boxShadow: 'inset 0 0 60px rgba(255, 255, 255, 0.08), inset -20px -20px 80px rgba(0, 0, 0, 0.9), 0 0 100px rgba(252, 28, 70, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          pointerEvents: 'none',
          zIndex: 1,
          opacity: 0.65
        }}>
          <div style={{
            position: 'absolute',
            top: '15%',
            left: '20%',
            width: '40%',
            height: '25%',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse at center, rgba(255, 255, 255, 0.15) 0%, transparent 80%)',
            transform: 'rotate(-25deg)',
            filter: 'blur(4px)'
          }} />
        </div>

        {/* Category Eyebrow */}
        <ScrollSlide direction="up">
          <div style={{
            fontSize: 'clamp(12px, 3vw, 15px)',
            color: '#4c4c4c',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 'clamp(16px, 4vw, 28px)',
            fontWeight: 500
          }}>
            [ 00 / EDITORIAL REASONING SYSTEM ]
          </div>
        </ScrollSlide>

        {/* 198px Monumental Hero Display Heading */}
        <ScrollSlide direction="up">
          <h1 style={{
            fontSize: 'clamp(38px, 10.5vw, 178px)',
            fontWeight: 700,
            lineHeight: '0.94',
            letterSpacing: '-0.04em',
            margin: '0 0 clamp(24px, 5vw, 40px) 0',
            fontFamily: 'var(--font-sui)',
            textTransform: 'uppercase',
            color: '#ffffff',
            maxWidth: '1180px',
            position: 'relative',
            zIndex: 2,
            wordBreak: 'break-word'
          }}>
            EDITORIAL AI AT ARCHITECTURAL SCALE.
          </h1>
        </ScrollSlide>

        {/* Body Lead */}
        <ScrollSlide direction="up">
          <p style={{
            color: '#cccccc',
            fontSize: 'clamp(15px, 3.8vw, 18px)',
            maxWidth: '620px',
            margin: '0 0 clamp(32px, 6vw, 48px) 0',
            lineHeight: '1.2',
            fontWeight: 400,
            letterSpacing: '-0.01em',
            position: 'relative',
            zIndex: 2
          }}>
            Connect multi-channel telemetry to high-conviction publishing decisions. Real-time NLP topic resonance, cross-catalog percentile scoring, and autonomous editorial directives.
          </p>
        </ScrollSlide>

        {/* Hero Actions: Crimson Pill + Secondary Ghost */}
        <ScrollSlide direction="scale">
          <div style={{ display: 'flex', gap: 'clamp(16px, 4vw, 28px)', alignItems: 'center', flexWrap: 'wrap', position: 'relative', zIndex: 2 }}>
            <Link href="/auth?mode=signup" style={{ textDecoration: 'none' }}>
              <button style={{
                background: '#fc1c46',
                color: '#ffffff',
                border: 'none',
                borderRadius: '9999px',
                padding: 'clamp(14px, 3vw, 16px) clamp(28px, 5vw, 36px)',
                fontSize: 'clamp(13px, 3.5vw, 15px)',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '-0.02em',
                cursor: 'pointer',
                boxShadow: 'none',
                transition: 'opacity 0.2s',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                Get Started
              </button>
            </Link>
            
            <Link href="/auth?mode=signin" style={{
              color: '#cccccc',
              fontSize: 'clamp(14px, 3.5vw, 15px)',
              fontWeight: 400,
              textDecoration: 'none',
              letterSpacing: '-0.01em',
              transition: 'color 0.2s',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#ffffff'}
            onMouseLeave={e => e.currentTarget.style.color = '#cccccc'}
            >
              Sign In →
            </Link>
          </div>
        </ScrollSlide>

      </section>

      {/* ========================================================================= */}
      {/* 3. SECTION 01: MULTI-CHANNEL INGESTION (Transparent, Hairline Rules) */}
      {/* ========================================================================= */}
      <section style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: 'clamp(60px, 10vw, 100px) clamp(18px, 4vw, 36px) clamp(80px, 12vw, 140px) clamp(18px, 4vw, 36px)',
        borderTop: '1px solid #1a1a1a'
      }}>
        <ScrollSlide direction="left">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: 'clamp(36px, 6vw, 64px)', alignItems: 'start' }}>
            
            {/* Left: Section Header & Lead */}
            <div>
              <div style={{ fontSize: 'clamp(12px, 3vw, 15px)', color: '#4c4c4c', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px', fontWeight: 500 }}>
                01 / OMNICHANNEL INGESTION
              </div>
              <h2 style={{
                fontSize: 'clamp(30px, 7vw, 84px)',
                fontWeight: 700,
                color: '#ffffff',
                letterSpacing: '-0.035em',
                lineHeight: '0.94',
                textTransform: 'uppercase',
                marginBottom: '20px',
                fontFamily: 'var(--font-sui)',
                wordBreak: 'break-word'
              }}>
                FOUR STREAMS. ONE REASONING ENGINE.
              </h2>
              <p style={{ color: '#cccccc', fontSize: 'clamp(15px, 3.8vw, 18px)', lineHeight: '1.25', fontWeight: 400, maxWidth: '480px' }}>
                Continuous ingestion under 1.5 seconds. Web articles, YouTube channels, Substack newsletters, and search queries synchronized into an achromatic data foundation.
              </p>
            </div>

            {/* Right: Transparent Telemetry Rows with Hairline Rules */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {[
                { channel: 'WEB', title: 'Technical Deep Dive: Next.js Architecture', metric: '4,820 READS', conv: '+4.20% CONV', sub: 'GA4' },
                { channel: 'YOUTUBE', title: 'AI Engineering Masterclass', metric: '48,500 VIEWS', conv: '+8.60% CONV', sub: 'YouTube API' },
                { channel: 'NEWSLETTER', title: 'Issue #42: The Future of Compute', metric: '2,900 OPENS', conv: '+5.10% CONV', sub: 'Substack' },
                { channel: 'SEARCH', title: 'Intent Gap: Local AI Tooling', metric: '18,400 IMPR', conv: '+3.40% CTR', sub: 'Search Console' }
              ].map((item, idx) => (
                <div key={idx} style={{
                  padding: 'clamp(16px, 3vw, 24px) 0',
                  borderBottom: '1px solid #1a1a1a',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '16px'
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '10px', color: '#4c4c4c', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>
                      {item.channel} — {item.sub}
                    </div>
                    <div style={{ fontSize: 'clamp(14px, 3.5vw, 17px)', color: '#ffffff', fontWeight: 500, letterSpacing: '-0.01em', wordBreak: 'break-word' }}>
                      {item.title}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 'clamp(13px, 3.2vw, 15px)', color: '#ffffff', fontWeight: 700, letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
                      {item.metric}
                    </div>
                    <div style={{ fontSize: '11px', color: '#cccccc', marginTop: '2px', whiteSpace: 'nowrap' }}>
                      {item.conv}
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </ScrollSlide>
      </section>

      {/* ========================================================================= */}
      {/* 4. SECTION 02: AI TAXONOMY & RESONANCE (Achromatic Gauge Rows) */}
      {/* ========================================================================= */}
      <section style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: 'clamp(60px, 10vw, 100px) clamp(18px, 4vw, 36px) clamp(80px, 12vw, 140px) clamp(18px, 4vw, 36px)',
        borderTop: '1px solid #1a1a1a'
      }}>
        <ScrollSlide direction="right">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: 'clamp(36px, 6vw, 64px)', alignItems: 'start' }}>
            
            {/* Left: Geometric Topic Cluster Rows */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {[
                { name: 'AI ENGINEERING & MODELS', count: '142.5K VIEWS', score: '94 / 100', width: '94%' },
                { name: 'FULL-STACK ARCHITECTURE', count: '68.2K VIEWS', score: '78 / 100', width: '78%' },
                { name: 'GAMING & TECH HARDWARE', count: '32.1K VIEWS', score: '56 / 100', width: '56%' },
                { name: 'GENERIC SAAS MARKETING', count: '8.4K VIEWS', score: '22 / 100', width: '22%' }
              ].map((topic, i) => (
                <div key={i} style={{ padding: 'clamp(16px, 3vw, 22px) 0', borderBottom: '1px solid #1a1a1a' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                    <span style={{ fontSize: 'clamp(13px, 3.5vw, 15px)', color: '#ffffff', fontWeight: 500, letterSpacing: '-0.01em' }}>
                      {topic.name}
                    </span>
                    <span style={{ fontSize: '12px', color: '#4c4c4c', letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>
                      {topic.count} • {topic.score}
                    </span>
                  </div>
                  {/* Hairline geometric meter */}
                  <div style={{ width: '100%', height: '2px', background: '#1a1a1a', position: 'relative' }}>
                    <div style={{ width: topic.width, height: '100%', background: '#ffffff' }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Right: Section Copy */}
            <div>
              <div style={{ fontSize: 'clamp(12px, 3vw, 15px)', color: '#4c4c4c', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px', fontWeight: 500 }}>
                02 / AI-POWERED TAXONOMY
              </div>
              <h2 style={{
                fontSize: 'clamp(30px, 7vw, 84px)',
                fontWeight: 700,
                color: '#ffffff',
                letterSpacing: '-0.035em',
                lineHeight: '0.94',
                textTransform: 'uppercase',
                marginBottom: '20px',
                fontFamily: 'var(--font-sui)',
                wordBreak: 'break-word'
              }}>
                POWERED BY GEMINI 1.5 FLASH.
              </h2>
              <p style={{ color: '#cccccc', fontSize: 'clamp(15px, 3.8vw, 18px)', lineHeight: '1.25', fontWeight: 400, maxWidth: '480px' }}>
                Every content piece is mapped to an expanded master taxonomy (Technology, Gaming, Entertainment, Charity, Science, Drama). Zero manual tagging. Uncover true conversion affinity across your catalog.
              </p>
            </div>

          </div>
        </ScrollSlide>
      </section>

      {/* ========================================================================= */}
      {/* 5. SECTION 03: THE EDITORIAL DECISION MATRIX (Zero-fill columns) */}
      {/* ========================================================================= */}
      <section style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: 'clamp(60px, 10vw, 100px) clamp(18px, 4vw, 36px) clamp(80px, 12vw, 140px) clamp(18px, 4vw, 36px)',
        borderTop: '1px solid #1a1a1a'
      }}>
        <ScrollSlide direction="up">
          <div style={{ marginBottom: 'clamp(32px, 6vw, 56px)' }}>
            <div style={{ fontSize: 'clamp(12px, 3vw, 15px)', color: '#4c4c4c', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px', fontWeight: 500 }}>
              03 / EDITORIAL DECISION MATRIX
            </div>
            <h2 style={{
              fontSize: 'clamp(30px, 7vw, 84px)',
              fontWeight: 700,
              color: '#ffffff',
              letterSpacing: '-0.035em',
              lineHeight: '0.94',
              textTransform: 'uppercase',
              fontFamily: 'var(--font-sui)',
              wordBreak: 'break-word'
            }}>
              CONTINUE. STOP. CREATE.
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 'clamp(24px, 4vw, 36px)' }}>
            
            {/* Directive 1: CONTINUE */}
            <div style={{
              borderTop: '1px solid #ffffff',
              paddingTop: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ fontSize: '11px', color: '#4c4c4c', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>
                [ ACTION: CONTINUE ]
              </div>
              <div style={{ fontSize: 'clamp(18px, 4.5vw, 24px)', color: '#ffffff', fontWeight: 700, letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
                AI ENGINEERING
              </div>
              <p style={{ color: '#cccccc', fontSize: '13px', lineHeight: '1.3', margin: 0 }}>
                High statistical conversion rate (2.80%) across video masterclasses and technical blogs. Reallocate top production bandwidth here.
              </p>
            </div>

            {/* Directive 2: STOP */}
            <div style={{
              borderTop: '1px solid #4c4c4c',
              paddingTop: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ fontSize: '11px', color: '#4c4c4c', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>
                [ ACTION: STOP ]
              </div>
              <div style={{ fontSize: 'clamp(18px, 4.5vw, 24px)', color: '#ffffff', fontWeight: 700, letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
                GENERIC SAAS MARKETING
              </div>
              <p style={{ color: '#cccccc', fontSize: '13px', lineHeight: '1.3', margin: 0 }}>
                Sub-baseline 0.20% conversion efficiency. Terminate editorial hours spent on unindexed, low-intent generic content.
              </p>
            </div>

            {/* Directive 3: CREATE */}
            <div style={{
              borderTop: '1px solid #ffffff',
              paddingTop: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ fontSize: '11px', color: '#4c4c4c', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>
                [ ACTION: CREATE ]
              </div>
              <div style={{ fontSize: 'clamp(18px, 4.5vw, 24px)', color: '#ffffff', fontWeight: 700, letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
                HIGH-INTENT SEARCH GAPS
              </div>
              <p style={{ color: '#cccccc', fontSize: '13px', lineHeight: '1.3', margin: 0 }}>
                Uncovers high-impression search query clusters where your domain is unranked. Generates ready-to-produce outlines.
              </p>
            </div>

          </div>
        </ScrollSlide>
      </section>

      {/* ========================================================================= */}
      {/* 6. SECTION 04: STATISTICAL FAIRNESS (Hairline Formula Architecture) */}
      {/* ========================================================================= */}
      <section style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: 'clamp(60px, 10vw, 100px) clamp(18px, 4vw, 36px) clamp(80px, 12vw, 140px) clamp(18px, 4vw, 36px)',
        borderTop: '1px solid #1a1a1a'
      }}>
        <ScrollSlide direction="right">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: 'clamp(36px, 6vw, 64px)', alignItems: 'start' }}>
            
            {/* Left: Copy */}
            <div>
              <div style={{ fontSize: 'clamp(12px, 3vw, 15px)', color: '#4c4c4c', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px', fontWeight: 500 }}>
                04 / STATISTICAL FAIRNESS
              </div>
              <h2 style={{
                fontSize: 'clamp(30px, 7vw, 84px)',
                fontWeight: 700,
                color: '#ffffff',
                letterSpacing: '-0.035em',
                lineHeight: '0.94',
                textTransform: 'uppercase',
                marginBottom: '20px',
                fontFamily: 'var(--font-sui)',
                wordBreak: 'break-word'
              }}>
                CROSS-CATALOG PERCENTILE SCORING.
              </h2>
              <p style={{ color: '#cccccc', fontSize: 'clamp(15px, 3.8vw, 18px)', lineHeight: '1.25', fontWeight: 400, maxWidth: '480px' }}>
                A YouTube video reaches 100,000 views while a high-intent newsletter reaches 2,000 readers. We compute SQL window percentiles to benchmark formats with mathematical fairness.
              </p>
            </div>

            {/* Right: Hairline Formula Box */}
            <div style={{ border: '1px solid #1a1a1a', padding: 'clamp(20px, 4vw, 36px)', background: 'transparent', width: '100%', overflowX: 'auto' }}>
              <div style={{ fontSize: '10px', color: '#4c4c4c', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '16px' }}>
                MATHEMATICAL FORMULATION
              </div>

              <div style={{
                fontSize: 'clamp(11px, 3vw, 14px)',
                color: '#ffffff',
                fontFamily: 'monospace',
                lineHeight: '1.6',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                wordBreak: 'break-all'
              }}>
                <div>PIECE_SCORE = (PERCENT_RANK(VIEWS) + PERCENT_RANK(CONV)) / 2</div>
                <div style={{ color: '#cccccc' }}>TOPIC_INDEX = AVG(PIECE_SCORE) × 100</div>
              </div>

              <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #1a1a1a', fontSize: '12px', color: '#4c4c4c' }}>
                Normalizes vanity scale bias to surface true editorial alpha.
              </div>
            </div>

          </div>
        </ScrollSlide>
      </section>

      {/* ========================================================================= */}
      {/* 7. SECTION 05: MONUMENTAL CTA (Spread Edge-to-Edge with Crimson Signal Pill) */}
      {/* ========================================================================= */}
      <section style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: 'clamp(70px, 12vw, 120px) clamp(18px, 4vw, 36px) clamp(100px, 15vw, 180px) clamp(18px, 4vw, 36px)',
        borderTop: '1px solid #1a1a1a',
        textAlign: 'center'
      }}>
        <ScrollSlide direction="scale">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(28px, 6vw, 48px)' }}>
            
            <div style={{ fontSize: 'clamp(12px, 3vw, 15px)', color: '#4c4c4c', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500 }}>
              [ 05 / DEPLOYMENT ]
            </div>

            <h2 style={{
              fontSize: 'clamp(36px, 10vw, 178px)',
              fontWeight: 700,
              lineHeight: '0.92',
              letterSpacing: '-0.04em',
              color: '#ffffff',
              margin: 0,
              fontFamily: 'var(--font-sui)',
              textTransform: 'uppercase',
              maxWidth: '1300px',
              wordBreak: 'break-word'
            }}>
              READY TO LOCK IN.
            </h2>

            <Link href="/auth?mode=signup" style={{ textDecoration: 'none' }}>
              <button style={{
                background: '#fc1c46',
                color: '#ffffff',
                border: 'none',
                borderRadius: '9999px',
                padding: 'clamp(14px, 3vw, 18px) clamp(32px, 6vw, 48px)',
                fontSize: 'clamp(14px, 3.5vw, 16px)',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '-0.02em',
                cursor: 'pointer',
                boxShadow: 'none',
                transition: 'opacity 0.2s',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                Get Started
              </button>
            </Link>
          </div>
        </ScrollSlide>
      </section>

      {/* 8. ThoughtLab Minimalist Footer (Single Quiet Line, Responsive Flex) */}
      <footer style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '28px clamp(18px, 4vw, 36px) 48px clamp(18px, 4vw, 36px)',
        borderTop: '1px solid #1a1a1a',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ fontSize: 'clamp(11px, 3vw, 13px)', color: '#4c4c4c', letterSpacing: '0.02em' }}>
          © 2026 CONTENTPULSE AI — EDITORIAL PRECISION VIA INTELLIGENCE.
        </div>

        <div style={{ display: 'flex', gap: '20px' }}>
          <Link href="/auth?mode=signin" style={{ fontSize: '12px', color: '#4c4c4c', textDecoration: 'none' }}>SIGN IN</Link>
          <Link href="/auth?mode=signup" style={{ fontSize: '12px', color: '#4c4c4c', textDecoration: 'none' }}>CREATE ACCOUNT</Link>
        </div>
      </footer>

    </div>
  );
}
