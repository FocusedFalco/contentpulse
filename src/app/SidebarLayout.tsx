'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Helper to check active nav
  const isDashboard = pathname === '/';
  const isWeb = pathname === '/web';
  const isSocial = pathname === '/social';
  const isNewsletter = pathname === '/newsletter';
  const isReports = pathname === '/reports';
  const isSettings = pathname === '/settings';

  return (
    <div style={{ background: '#000000', minHeight: '100vh', display: 'flex', flexDirection: 'column', color: '#ffffff', fontFamily: 'var(--font-body)' }}>
      
      {/* 1. TOP HEADER BAR */}
      <header style={{
        height: '64px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        background: '#09090b',
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
          <Link href="/" style={{ textDecoration: 'none', color: '#ffffff' }}>
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
            color: isDashboard ? '#ffffff' : '#a0aec0',
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
                background: '#ffffff',
                borderRadius: '2px'
              }}></span>
            )}
          </Link>

          <Link href="/reports" style={{
            fontSize: '14px',
            fontWeight: 600,
            color: isReports ? '#ffffff' : '#a0aec0',
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
                background: '#ffffff',
                borderRadius: '2px'
              }}></span>
            )}
          </Link>
        </nav>

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          
          {/* Search bar */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <span style={{ position: 'absolute', left: '12px', color: '#718096', display: 'flex', alignItems: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </span>
            <input 
              type="text" 
              placeholder="Search..." 
              style={{
                background: '#18181b',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '20px',
                padding: '6px 12px 6px 34px',
                fontSize: '13px',
                color: '#ffffff',
                outline: 'none',
                width: '180px',
                transition: 'all 0.2s'
              }}
              onFocus={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'}
              onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
            />
          </div>

          {/* Bell Icon */}
          <button style={{ background: 'transparent', border: 'none', color: '#a0aec0', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
            </svg>
          </button>
          
          {/* Gear settings Icon */}
          <Link href="/settings" style={{ color: '#a0aec0', display: 'flex', alignItems: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </Link>
          
          {/* Avatar Profile image */}
          <div style={{
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
            border: '1px solid rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer'
          }}>
            CP
          </div>

        </div>
      </header>

      {/* 2. BODY LAYOUT CONTAINER */}
      <div style={{ display: 'flex', flex: 1, minHeight: 'calc(100vh - 64px)' }}>
        
        {/* 2a. LEFT SIDEBAR */}
        <aside style={{
          width: '240px',
          background: '#09090b',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
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
            
            {/* Active Monitoring Label */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '8px', padding: '10px 12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="10" rx="2"></rect>
                  <path d="M12 2v9"></path>
                  <path d="M8 5h8"></path>
                </svg>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>Channels</span>
                <span style={{ fontSize: '10px', color: '#718096' }}>Active Monitoring</span>
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
                color: isWeb ? '#ffffff' : '#a0aec0',
                background: isWeb ? 'rgba(255,255,255,0.08)' : 'transparent',
                textDecoration: 'none',
                fontWeight: isWeb ? 600 : 500,
                fontSize: '14px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => { if (!isWeb) e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { if (!isWeb) e.currentTarget.style.color = '#a0aec0'; }}
              >
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
                color: isSocial ? '#ffffff' : '#a0aec0',
                background: isSocial ? 'rgba(255,255,255,0.08)' : 'transparent',
                textDecoration: 'none',
                fontWeight: isSocial ? 600 : 500,
                fontSize: '14px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => { if (!isSocial) e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { if (!isSocial) e.currentTarget.style.color = '#a0aec0'; }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                </svg>
                Social
              </Link>

              <Link href="/newsletter" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: '8px',
                color: isNewsletter ? '#ffffff' : '#a0aec0',
                background: isNewsletter ? 'rgba(255,255,255,0.08)' : 'transparent',
                textDecoration: 'none',
                fontWeight: isNewsletter ? 600 : 500,
                fontSize: '14px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => { if (!isNewsletter) e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { if (!isNewsletter) e.currentTarget.style.color = '#a0aec0'; }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                Newsletter
              </Link>
            </nav>

          </div>

          {/* Bottom actions of sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* New Analysis button */}
            <Link href="/settings" style={{ textDecoration: 'none' }}>
              <button style={{
                width: '100%',
                background: '#ffffff',
                color: '#000000',
                border: 'none',
                borderRadius: '8px',
                padding: '10px',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                <span>+</span> New Analysis
              </button>
            </Link>

            {/* Help & Docs Links */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '16px' }}>
              
              <Link href="/settings" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '13px',
                color: '#718096',
                textDecoration: 'none',
                transition: 'color 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#fff'}
              onMouseLeave={e => e.currentTarget.style.color = '#718096'}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                Help
              </Link>

              <Link href="/settings" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '13px',
                color: '#718096',
                textDecoration: 'none',
                transition: 'color 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#fff'}
              onMouseLeave={e => e.currentTarget.style.color = '#718096'}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
                Docs
              </Link>

            </div>

          </div>
        </aside>

        {/* 2b. MAIN CONTENT WINDOW */}
        <main style={{ flex: 1, padding: '40px', background: '#000000', overflowY: 'auto' }}>
          {children}
        </main>

      </div>
    </div>
  );
}
