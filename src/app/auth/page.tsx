'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function AuthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'signin';

  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  
  // Sign In state
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signInLoading, setSignInLoading] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);

  // Sign Up state
  const [signUpStep, setSignUpStep] = useState<1 | 2>(1);
  const [signUpName, setSignUpName] = useState('');
  const [signUpCompany, setSignUpCompany] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');
  const [signUpLoading, setSignUpLoading] = useState(false);
  const [signUpError, setSignUpError] = useState<string | null>(null);

  // First Ingestion state (Step 2)
  const [ingestChannel, setIngestChannel] = useState<'web' | 'social' | 'newsletter'>('web');
  const [ingestUrl, setIngestUrl] = useState('');
  const [ingestLoading, setIngestLoading] = useState(false);
  const [ingestLogs, setIngestLogs] = useState<string | null>(null);
  const [ingestError, setIngestError] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get('mode') === 'signup') {
      setMode('signup');
    }
  }, [searchParams]);

  // Handle Sign In Submission
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignInError(null);
    setSignInLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'signin',
          email: signInEmail,
          password: signInPassword
        })
      });

      const data = await res.json();
      if (!data.success) {
        setSignInError(data.error || 'Failed to sign in. Please check your credentials.');
      } else {
        // Redirect straight to dashboard
        router.push('/');
        router.refresh();
      }
    } catch (err: any) {
      setSignInError(err?.message || 'Network error occurred.');
    } finally {
      setSignInLoading(false);
    }
  };

  // Handle Sign Up Step 1 Submission
  const handleSignUpStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignUpError(null);

    if (signUpPassword !== signUpConfirmPassword) {
      setSignUpError('Passwords do not match. Please verify your confirm password.');
      return;
    }

    if (signUpPassword.length < 6) {
      setSignUpError('Password must be at least 6 characters.');
      return;
    }

    setSignUpLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'signup',
          name: signUpName,
          company: signUpCompany,
          email: signUpEmail,
          password: signUpPassword,
          confirmPassword: signUpConfirmPassword
        })
      });

      const data = await res.json();
      if (!data.success) {
        setSignUpError(data.error || 'Failed to create account.');
      } else {
        // Move to Step 2: First Channel Ingestion
        setSignUpStep(2);
      }
    } catch (err: any) {
      setSignUpError(err?.message || 'Network error occurred.');
    } finally {
      setSignUpLoading(false);
    }
  };

  // Handle Step 2: First Ingestion Submission
  const handleFirstIngestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingestUrl.trim()) {
      setIngestError('Please enter a valid URL or handle.');
      return;
    }

    setIngestError(null);
    setIngestLoading(true);
    setIngestLogs(`Connecting crawler to ${ingestUrl}...`);

    try {
      setIngestLogs(prev => prev + '\nFetching page metadata, calculating word count & indexing metrics...');
      const res = await fetch('/api/ingestion/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: ingestUrl.trim(),
          channel: ingestChannel
        })
      });

      const data = await res.json();
      if (!data.success) {
        setIngestLogs(prev => prev + `\n\n${data.error}`);
        setIngestError(data.error || 'Ingestion failed.');
      } else {
        setIngestLogs(prev => prev + `\n\nSUCCESS: Connected "${data.content?.title}"! Preparing your dashboard...`);
        await new Promise(r => setTimeout(r, 1200));
        router.push('/');
        router.refresh();
      }
    } catch (err: any) {
      setIngestError(err?.message || 'Failed to ingest content.');
      setIngestLogs(prev => prev + `\n\n${err?.message}`);
    } finally {
      setIngestLoading(false);
    }
  };

  const getChannelPlaceholder = () => {
    if (ingestChannel === 'web') return 'https://mycompany.com/blog/scaling-nextjs';
    if (ingestChannel === 'social') return '@mrbeast or https://youtube.com/@username';
    return 'https://mybrand.substack.com/p/first-issue';
  };

  return (
    <div style={{ minHeight: '100vh', background: '#000000', color: '#ffffff', display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-body)' }}>
      
      {/* Top Navbar */}
      <header style={{ height: '64px', borderBottom: '1px solid rgba(255,255,255,0.08)', background: '#09090b', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/" style={{ textDecoration: 'none', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.5px' }}>
            ContentPulse
          </span>
          <span style={{ fontSize: '10px', background: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
            AI ENGINE
          </span>
        </Link>

        <Link href="/" style={{ fontSize: '13px', color: '#a0aec0', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
          ← Back to Landing Page
        </Link>
      </header>

      {/* Main Form Container */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div className="glass-card" style={{ width: '100%', maxWidth: '480px', padding: '36px', background: 'linear-gradient(180deg, rgba(24,24,27,0.9) 0%, rgba(9,9,11,0.95) 100%)' }}>
          
          {/* Tab Switcher (Only in Step 1) */}
          {signUpStep === 1 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '4px', marginBottom: '28px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <button
                type="button"
                onClick={() => { setMode('signin'); setSignInError(null); }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  background: mode === 'signin' ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color: mode === 'signin' ? '#ffffff' : '#a0aec0',
                  fontWeight: mode === 'signin' ? 700 : 500,
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setMode('signup'); setSignUpError(null); }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  background: mode === 'signup' ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color: mode === 'signup' ? '#ffffff' : '#a0aec0',
                  fontWeight: mode === 'signup' ? 700 : 500,
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Create Account
              </button>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SIGN IN FORM */}
          {/* ========================================================================= */}
          {mode === 'signin' && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 6px 0', letterSpacing: '-0.5px' }}>
                  Welcome Back
                </h1>
                <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: 0 }}>
                  Enter your email and password to access your ContentPulse dashboard
                </p>
              </div>

              {signInError && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '12px 16px', color: '#fca5a5', fontSize: '13px', marginBottom: '20px' }}>
                  {signInError}
                </div>
              )}

              <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#a0aec0', marginBottom: '6px' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={signInEmail}
                    onChange={e => setSignInEmail(e.target.value)}
                    placeholder="name@company.com"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      background: 'rgba(0,0,0,0.5)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: '#ffffff',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#a0aec0', marginBottom: '6px' }}>
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={signInPassword}
                    onChange={e => setSignInPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      background: 'rgba(0,0,0,0.5)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: '#ffffff',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={signInLoading}
                  className="glow-btn glow-btn-primary"
                  style={{
                    padding: '12px',
                    fontSize: '14px',
                    fontWeight: 700,
                    marginTop: '8px',
                    opacity: signInLoading ? 0.6 : 1,
                    cursor: signInLoading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {signInLoading ? 'Signing in...' : 'Sign In to Dashboard →'}
                </button>
              </form>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SIGN UP WIZARD */}
          {/* ========================================================================= */}
          {mode === 'signup' && (
            <div>
              {/* Step 1: Profile Details + Password Creation */}
              {signUpStep === 1 && (
                <div>
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '10px', background: 'rgba(52,211,153,0.15)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                        STEP 1 OF 2
                      </span>
                    </div>
                    <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 6px 0', letterSpacing: '-0.5px' }}>
                      Create Your Profile
                    </h1>
                    <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: 0 }}>
                      Set up your credentials and brand identity
                    </p>
                  </div>

                  {signUpError && (
                    <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '12px 16px', color: '#fca5a5', fontSize: '13px', marginBottom: '20px' }}>
                      {signUpError}
                    </div>
                  )}

                  <form onSubmit={handleSignUpStep1} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#a0aec0', marginBottom: '6px' }}>
                          Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={signUpName}
                          onChange={e => setSignUpName(e.target.value)}
                          placeholder="Sarah Chen"
                          style={{
                            width: '100%',
                            padding: '11px 12px',
                            borderRadius: '8px',
                            background: 'rgba(0,0,0,0.5)',
                            border: '1px solid rgba(255,255,255,0.12)',
                            color: '#ffffff',
                            fontSize: '13px',
                            outline: 'none'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#a0aec0', marginBottom: '6px' }}>
                          Company / Brand
                        </label>
                        <input
                          type="text"
                          value={signUpCompany}
                          onChange={e => setSignUpCompany(e.target.value)}
                          placeholder="Acme Media"
                          style={{
                            width: '100%',
                            padding: '11px 12px',
                            borderRadius: '8px',
                            background: 'rgba(0,0,0,0.5)',
                            border: '1px solid rgba(255,255,255,0.12)',
                            color: '#ffffff',
                            fontSize: '13px',
                            outline: 'none'
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#a0aec0', marginBottom: '6px' }}>
                        Work Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={signUpEmail}
                        onChange={e => setSignUpEmail(e.target.value)}
                        placeholder="sarah@company.com"
                        style={{
                          width: '100%',
                          padding: '11px 14px',
                          borderRadius: '8px',
                          background: 'rgba(0,0,0,0.5)',
                          border: '1px solid rgba(255,255,255,0.12)',
                          color: '#ffffff',
                          fontSize: '13px',
                          outline: 'none'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#a0aec0', marginBottom: '6px' }}>
                        Create Password *
                      </label>
                      <input
                        type="password"
                        required
                        value={signUpPassword}
                        onChange={e => setSignUpPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        style={{
                          width: '100%',
                          padding: '11px 14px',
                          borderRadius: '8px',
                          background: 'rgba(0,0,0,0.5)',
                          border: '1px solid rgba(255,255,255,0.12)',
                          color: '#ffffff',
                          fontSize: '13px',
                          outline: 'none'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#a0aec0', marginBottom: '6px' }}>
                        Confirm Password *
                      </label>
                      <input
                        type="password"
                        required
                        value={signUpConfirmPassword}
                        onChange={e => setSignUpConfirmPassword(e.target.value)}
                        placeholder="Re-type password"
                        style={{
                          width: '100%',
                          padding: '11px 14px',
                          borderRadius: '8px',
                          background: 'rgba(0,0,0,0.5)',
                          border: `1px solid ${signUpConfirmPassword && signUpPassword !== signUpConfirmPassword ? '#ef4444' : 'rgba(255,255,255,0.12)'}`,
                          color: '#ffffff',
                          fontSize: '13px',
                          outline: 'none'
                        }}
                      />
                      {signUpConfirmPassword && signUpPassword !== signUpConfirmPassword && (
                        <span style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px', display: 'block' }}>
                          Passwords do not match
                        </span>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={signUpLoading || (signUpConfirmPassword.length > 0 && signUpPassword !== signUpConfirmPassword)}
                      className="glow-btn glow-btn-primary"
                      style={{
                        padding: '12px',
                        fontSize: '14px',
                        fontWeight: 700,
                        marginTop: '8px',
                        opacity: signUpLoading ? 0.6 : 1,
                        cursor: signUpLoading ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {signUpLoading ? 'Creating Profile...' : 'Continue to First Ingestion →'}
                    </button>
                  </form>
                </div>
              )}

              {/* Step 2: First Channel Ingestion Setup */}
              {signUpStep === 2 && (
                <div>
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '10px', background: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                        STEP 2 OF 2: FIRST INGESTION
                      </span>
                    </div>
                    <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 6px 0', letterSpacing: '-0.5px' }}>
                      Connect First Channel
                    </h1>
                    <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: 0 }}>
                      Add your first content URL or handle to seed your analytics dashboard
                    </p>
                  </div>

                  {ingestError && (
                    <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '12px 16px', color: '#fca5a5', fontSize: '13px', marginBottom: '16px' }}>
                      {ingestError}
                    </div>
                  )}

                  {/* Channel Selector */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '18px' }}>
                    {[
                      { key: 'web' as const, label: 'Web / Blog' },
                      { key: 'social' as const, label: 'Social / YT' },
                      { key: 'newsletter' as const, label: 'Newsletter' }
                    ].map(ch => (
                      <button
                        key={ch.key}
                        type="button"
                        onClick={() => { setIngestChannel(ch.key); setIngestUrl(''); }}
                        style={{
                          padding: '10px 6px',
                          borderRadius: '8px',
                          border: `1px solid ${ingestChannel === ch.key ? '#3b82f6' : 'rgba(255,255,255,0.08)'}`,
                          background: ingestChannel === ch.key ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.02)',
                          color: ingestChannel === ch.key ? '#ffffff' : '#a0aec0',
                          fontSize: '12px',
                          fontWeight: ingestChannel === ch.key ? 700 : 500,
                          cursor: 'pointer'
                        }}
                      >
                        {ch.label}
                      </button>
                    ))}
                  </div>

                  <form onSubmit={handleFirstIngestion} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#a0aec0', marginBottom: '6px' }}>
                        {ingestChannel === 'web' ? 'Web Article / Blog URL' : (ingestChannel === 'social' ? 'YouTube Channel or Social Handle' : 'Newsletter Publication URL')}
                      </label>
                      <input
                        type="text"
                        required
                        value={ingestUrl}
                        onChange={e => setIngestUrl(e.target.value)}
                        placeholder={getChannelPlaceholder()}
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          borderRadius: '8px',
                          background: 'rgba(0,0,0,0.5)',
                          border: '1px solid rgba(255,255,255,0.12)',
                          color: '#ffffff',
                          fontSize: '13px',
                          outline: 'none'
                        }}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={ingestLoading || !ingestUrl}
                      className="glow-btn glow-btn-primary"
                      style={{
                        padding: '12px',
                        fontSize: '14px',
                        fontWeight: 700,
                        opacity: ingestLoading || !ingestUrl ? 0.6 : 1,
                        cursor: ingestLoading || !ingestUrl ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {ingestLoading ? 'Ingesting Content...' : 'Ingest & Open Dashboard'}
                    </button>

                    <button
                      type="button"
                      onClick={() => { router.push('/'); router.refresh(); }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#718096',
                        fontSize: '12px',
                        cursor: 'pointer',
                        textAlign: 'center',
                        textDecoration: 'underline'
                      }}
                    >
                      Skip for now & go to Dashboard →
                    </button>
                  </form>

                  {ingestLogs && (
                    <div style={{ marginTop: '16px' }}>
                      <pre style={{
                        background: 'rgba(0,0,0,0.6)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '8px',
                        padding: '12px',
                        fontSize: '11px',
                        whiteSpace: 'pre-wrap',
                        color: '#e5e7eb',
                        fontFamily: 'monospace',
                        lineHeight: '1.5'
                      }}>
                        {ingestLogs}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      </main>

    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#000000', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Loading authentication...
      </div>
    }>
      <AuthPageContent />
    </Suspense>
  );
}
