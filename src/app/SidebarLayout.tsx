'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  // Helper to check active nav
  const isDashboard = pathname === '/';
  const isWeb = pathname === '/web';
  const isSocial = pathname === '/social';
  const isNewsletter = pathname === '/newsletter';
  const isReports = pathname === '/reports';
  const isSettings = pathname === '/settings';
  const isProfile = pathname === '/profile';

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
        height: '64px',
        borderBottom: '1px solid var(--border-color)',
        background: 'var(--bg-surface)',
        padding: '0 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        {/* Left: Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link href="/" style={{ textDecoration: 'none', color: 'var(--color-text)' }}>
            <span style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.5px' }}>
              ContentPulse
            </span>
          </Link>
        </div>

        {/* Middle: Navigation Links */}
        <nav style={{ display: 'flex', gap: '24px', height: '100%', alignItems: 'center' }}>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          
          {/* Search bar */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <span style={{ position: 'absolute', left: '12px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </span>
            <input 
              type="text" 
              placeholder="Search..." 
              style={{
                background: 'var(--bg-base)',
                border: '1px solid var(--border-color)',
                borderRadius: '20px',
                padding: '6px 12px 6px 34px',
                fontSize: '13px',
                color: 'var(--color-text)',
                outline: 'none',
                width: '180px',
                transition: 'all 0.2s'
              }}
              onFocus={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
            />
          </div>

          {/* Bell Icon */}
          <button style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
            </svg>
          </button>
          
          {/* Gear settings Icon */}
          <Link href="/settings" style={{ color: isSettings ? 'var(--color-primary)' : 'var(--color-text-muted)', display: 'flex', alignItems: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </Link>
          
          {/* Avatar Profile image */}
          <Link href="/profile" title="Account Profile" style={{ textDecoration: 'none' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
              border: `2px solid ${isProfile ? '#3b82f6' : 'var(--border-color)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 800,
              color: '#ffffff',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}>
              CP
            </div>
          </Link>

        </div>
      </header>

      {/* 2. BODY LAYOUT CONTAINER */}
      <div style={{ display: 'flex', flex: 1, minHeight: 'calc(100vh - 64px)' }}>
        
        {/* 2a. LEFT SIDEBAR */}
        <aside className="sidebar-nav" style={{
          width: '240px',
          background: 'var(--bg-surface)',
          borderRight: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '24px 16px',
          position: 'sticky',
          top: '64px',
          height: 'calc(100vh - 64px)',
          zIndex: 40
        }}>
          {/* Top section of sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            
            {/* Channels Label */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-base)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px 12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                Social
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
        <main style={{ flex: 1, padding: '40px', background: 'var(--bg-base)', overflowY: 'auto' }}>
          {children}
        </main>

      </div>
    </div>
  );
}
