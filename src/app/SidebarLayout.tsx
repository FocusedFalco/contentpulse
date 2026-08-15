'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Helper to check active nav
  const isDashboard = pathname === '/';
  const isWeb = pathname === '/web';
  const isSocial = pathname === '/social';
  const isNewsletter = pathname === '/newsletter';
  const isReports = pathname === '/reports';
  const isSettings = pathname === '/settings';
  const isProfile = pathname === '/profile';

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('cp_theme');
    if (savedTheme === 'light') {
      document.documentElement.classList.add('light-theme');
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.classList.remove('light-theme');
      document.documentElement.setAttribute('data-theme', 'dark');
    }

    const savedDensity = localStorage.getItem('cp_density');
    if (savedDensity === 'compact') {
      document.documentElement.classList.add('compact-density');
    } else {
      document.documentElement.classList.remove('compact-density');
    }
  }, []);

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh', display: 'flex', flexDirection: 'column', color: 'var(--color-text)', fontFamily: 'var(--font-body)' }}>
      
      {/* 1. TOP HEADER BAR */}
      <header className="app-header" style={{
        height: '60px',
        borderBottom: '1px solid var(--border-color)',
        background: 'var(--bg-surface)',
        padding: '0 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        {/* Left: Mobile Hamburger + Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Hamburger button on Mobile */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="mobile-only-btn"
            aria-label="Toggle Navigation Menu"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-text)',
              cursor: 'pointer',
              display: 'none',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px',
              borderRadius: '6px'
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              {mobileMenuOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </>
              ) : (
                <>
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </>
              )}
            </svg>
          </button>

          <Link href="/" style={{ textDecoration: 'none', color: 'var(--color-text)' }}>
            <span style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.5px' }}>
              ContentPulse
            </span>
          </Link>
        </div>

        {/* Middle: Desktop Navigation Links */}
        <nav className="desktop-nav-links" style={{ display: 'flex', gap: '24px', height: '100%', alignItems: 'center' }}>
          <Link href="/" style={{
            fontSize: '14px',
            fontWeight: 600,
            color: isDashboard ? 'var(--color-text)' : 'var(--color-text-muted)',
            textDecoration: 'none',
            position: 'relative',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            transition: 'color 0.2s'
          }}>
            Dashboard
            {isDashboard && (
              <span style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '2px',
                background: 'var(--color-primary)',
                borderRadius: '2px'
              }}></span>
            )}
          </Link>

          <Link href="/reports" style={{
            fontSize: '14px',
            fontWeight: 600,
            color: isReports ? 'var(--color-text)' : 'var(--color-text-muted)',
            textDecoration: 'none',
            position: 'relative',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            transition: 'color 0.2s'
          }}>
            Reports
            {isReports && (
              <span style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '2px',
                background: 'var(--color-primary)',
                borderRadius: '2px'
              }}></span>
            )}
          </Link>
        </nav>

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Settings Icon */}
          <Link href="/settings" title="Settings" style={{ color: isSettings ? 'var(--color-primary)' : 'var(--color-text-muted)', display: 'flex', alignItems: 'center', padding: '6px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </Link>
          
          {/* Avatar Profile image */}
          <Link href="/profile" title="Account Profile" style={{ textDecoration: 'none' }}>
            <div style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
              border: `2px solid ${isProfile ? '#3b82f6' : 'var(--border-color)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 800,
              color: '#ffffff',
              cursor: 'pointer'
            }}>
              CP
            </div>
          </Link>
        </div>
      </header>

      {/* MOBILE DRAWER OVERLAY & MENU */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 90
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '280px',
              maxWidth: '80vw',
              height: '100%',
              background: 'var(--bg-surface)',
              borderRight: '1px solid var(--border-color)',
              padding: '24px 16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '4px 0 20px rgba(0,0,0,0.4)',
              animation: 'slideIn 0.2s ease-out'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '18px', fontWeight: 800 }}>Navigation</span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '4px' }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Link href="/" style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  background: isDashboard ? 'rgba(59, 130, 246, 0.12)' : 'transparent',
                  color: isDashboard ? 'var(--color-primary)' : 'var(--color-text)',
                  fontWeight: isDashboard ? 700 : 500,
                  textDecoration: 'none',
                  fontSize: '15px'
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7"></rect>
                    <rect x="14" y="3" width="7" height="7"></rect>
                    <rect x="14" y="14" width="7" height="7"></rect>
                    <rect x="3" y="14" width="7" height="7"></rect>
                  </svg>
                  Dashboard
                </Link>

                <Link href="/reports" style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  background: isReports ? 'rgba(59, 130, 246, 0.12)' : 'transparent',
                  color: isReports ? 'var(--color-primary)' : 'var(--color-text)',
                  fontWeight: isReports ? 700 : 500,
                  textDecoration: 'none',
                  fontSize: '15px'
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                  </svg>
                  Reports
                </Link>

                <div style={{ margin: '8px 0', borderTop: '1px solid var(--border-color)' }}></div>
                <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', paddingLeft: '14px', letterSpacing: '0.05em' }}>
                  Channels
                </span>

                <Link href="/web" style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: isWeb ? 'rgba(59, 130, 246, 0.12)' : 'transparent',
                  color: isWeb ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  textDecoration: 'none',
                  fontSize: '14px'
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="2" y1="12" x2="22" y2="12"></line>
                  </svg>
                  Web
                </Link>

                <Link href="/social" style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: isSocial ? 'rgba(59, 130, 246, 0.12)' : 'transparent',
                  color: isSocial ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  textDecoration: 'none',
                  fontSize: '14px'
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
                  </svg>
                  Social & Video
                </Link>

                <Link href="/newsletter" style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: isNewsletter ? 'rgba(59, 130, 246, 0.12)' : 'transparent',
                  color: isNewsletter ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  textDecoration: 'none',
                  fontSize: '14px'
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                  Newsletter
                </Link>
              </nav>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <Link href="/settings" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '14px',
                color: isSettings ? 'var(--color-primary)' : 'var(--color-text)',
                textDecoration: 'none'
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
                Settings
              </Link>
              <Link href="/profile" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '14px',
                color: isProfile ? 'var(--color-primary)' : 'var(--color-text)',
                textDecoration: 'none'
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                Profile
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 2. BODY LAYOUT CONTAINER */}
      <div style={{ display: 'flex', flex: 1, minHeight: 'calc(100vh - 60px)', position: 'relative' }}>
        
        {/* 2a. DESKTOP LEFT SIDEBAR */}
        <aside className="sidebar-nav desktop-sidebar" style={{
          width: '230px',
          background: 'var(--bg-surface)',
          borderRight: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '24px 16px',
          position: 'sticky',
          top: '60px',
          height: 'calc(100vh - 60px)',
          zIndex: 40,
          flexShrink: 0
        }}>
          {/* Top section of sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            
            {/* Channels Label */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-base)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px 12px' }}>
              <div style={{ width: '30px', height: '30px', borderRadius: '6px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="10" rx="2"></rect>
                  <path d="M12 2v9"></path>
                  <path d="M8 5h8"></path>
                </svg>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text)' }}>Channels</span>
              </div>
            </div>

            {/* Sidebar Navigation */}
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              
              <Link href="/web" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: '8px',
                color: isWeb ? 'var(--color-primary)' : 'var(--color-text-muted)',
                background: isWeb ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                textDecoration: 'none',
                fontWeight: isWeb ? 700 : 500,
                fontSize: '14px',
                transition: 'all 0.2s'
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="2" y1="12" x2="22" y2="12"></line>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                </svg>
                Web
              </Link>

              <Link href="/social" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: '8px',
                color: isSocial ? 'var(--color-primary)' : 'var(--color-text-muted)',
                background: isSocial ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                textDecoration: 'none',
                fontWeight: isSocial ? 700 : 500,
                fontSize: '14px',
                transition: 'all 0.2s'
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
                </svg>
                Social & Video
              </Link>

              <Link href="/newsletter" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: '8px',
                color: isNewsletter ? 'var(--color-primary)' : 'var(--color-text-muted)',
                background: isNewsletter ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                textDecoration: 'none',
                fontWeight: isNewsletter ? 700 : 500,
                fontSize: '14px',
                transition: 'all 0.2s'
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                Newsletter
              </Link>

            </nav>

          </div>

          {/* Bottom section of sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* New Analysis Button */}
            <Link href="/" style={{ textDecoration: 'none' }}>
              <button 
                className="glow-btn glow-btn-primary" 
                style={{ 
                  width: '100%', 
                  justifyContent: 'center', 
                  padding: '10px 14px',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '13px'
                }}
              >
                <span>+</span> New Analysis
              </button>
            </Link>

            {/* Help & Account Links */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              
              <Link href="/settings" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '13px',
                color: isSettings ? 'var(--color-text)' : 'var(--color-text-muted)',
                textDecoration: 'none',
                fontWeight: isSettings ? 600 : 400,
                transition: 'color 0.2s'
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
                Settings
              </Link>

              <Link href="/profile" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '13px',
                color: isProfile ? 'var(--color-text)' : 'var(--color-text-muted)',
                fontWeight: isProfile ? 600 : 400,
                textDecoration: 'none',
                transition: 'color 0.2s'
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                Account Profile
              </Link>
            </div>

          </div>
        </aside>

        {/* 2b. MAIN CONTENT WINDOW */}
        <main className="app-main-content" style={{ flex: 1, padding: '32px', background: 'var(--bg-base)', overflowY: 'auto', minWidth: 0 }}>
          {children}
        </main>

      </div>

      {/* 3. MOBILE BOTTOM NAVIGATION BAR (Visible on screens <= 768px) */}
      <div className="mobile-bottom-nav" style={{
        display: 'none',
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '60px',
        background: 'var(--bg-surface)',
        borderTop: '1px solid var(--border-color)',
        zIndex: 50,
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: '0 8px'
      }}>
        <Link href="/" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          textDecoration: 'none',
          color: isDashboard ? 'var(--color-primary)' : 'var(--color-text-muted)',
          fontSize: '11px',
          fontWeight: isDashboard ? 700 : 500
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
          Dashboard
        </Link>

        <Link href="/reports" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          textDecoration: 'none',
          color: isReports ? 'var(--color-primary)' : 'var(--color-text-muted)',
          fontSize: '11px',
          fontWeight: isReports ? 700 : 500
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
          </svg>
          Reports
        </Link>

        <Link href="/social" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          textDecoration: 'none',
          color: (isWeb || isSocial || isNewsletter) ? 'var(--color-primary)' : 'var(--color-text-muted)',
          fontSize: '11px',
          fontWeight: (isWeb || isSocial || isNewsletter) ? 700 : 500
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="10" rx="2"></rect>
            <path d="M12 2v9"></path>
            <path d="M8 5h8"></path>
          </svg>
          Channels
        </Link>

        <Link href="/settings" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          textDecoration: 'none',
          color: isSettings ? 'var(--color-primary)' : 'var(--color-text-muted)',
          fontSize: '11px',
          fontWeight: isSettings ? 700 : 500
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
          Settings
        </Link>
      </div>
    </div>
  );
}
