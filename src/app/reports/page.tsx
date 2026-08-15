'use client';

import React, { useState, useEffect } from 'react';
import { marked } from 'marked';
import SidebarLayout from '../SidebarLayout';
import Link from 'next/link';

interface ReportArchiveItem {
  id: number;
  created_at: string;
  title: string;
  channel?: string;
}

interface FullReport {
  id: number;
  created_at: string;
  title: string;
  channel?: string;
  narrative: string;
  metrics_summary: any;
}

const REPORT_CHANNELS = [
  { key: 'all', label: 'All Reports', icon: '📊' },
  { key: 'web', label: 'Web', icon: '🌐' },
  { key: 'social', label: 'Social', icon: '💬' },
  { key: 'newsletter', label: 'Newsletter', icon: '✉️' },
  { key: 'youtube', label: 'YouTube', icon: '🎬' }
];

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportArchiveItem[]>([]);
  const [activeReport, setActiveReport] = useState<FullReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<number | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  const [generateChannel, setGenerateChannel] = useState<string>('all');
  
  // Report generation progress state
  const [generating, setGenerating] = useState(false);
  const [genSteps, setGenSteps] = useState<{ label: string; status: 'pending' | 'running' | 'done' | 'error' }[]>([
    { label: 'Querying channel metrics & content items...', status: 'pending' },
    { label: 'Normalizing format percentiles & topic eligibility...', status: 'pending' },
    { label: 'Synthesizing channel opportunity gaps...', status: 'pending' },
    { label: 'Prompting Gemini AI Strategy Engine...', status: 'pending' },
    { label: 'Composing decision-ready markdown report...', status: 'pending' },
  ]);

  // Load report list filtered by channel
  const fetchReports = async (channelKey = selectedChannel, selectLatest = false) => {
    try {
      const url = channelKey === 'all' ? '/api/reports' : `/api/reports?channel=${channelKey}`;
      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data)) {
        setReports(data);
        if (selectLatest && data.length > 0) {
          loadReport(data[0].id);
        } else if (data.length === 0) {
          setActiveReport(null);
          setActiveTab(null);
        }
      }
    } catch (err) {
      console.error('Failed to load reports:', err);
    }
  };

  // Load single full report
  const loadReport = async (id: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?id=${id}`);
      const data = await res.json();
      if (data && !data.error) {
        setActiveReport(data);
        setActiveTab(id);
      }
    } catch (err) {
      console.error('Failed to load report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports('all', true);
  }, []);

  const handleChannelFilterChange = (ch: string) => {
    setSelectedChannel(ch);
    setGenerateChannel(ch);
    fetchReports(ch, true);
  };

  // Trigger report generation with step-by-step progress simulation
  const handleGenerateReport = async (targetChannel: string = generateChannel) => {
    setGenerating(true);
    setGenSteps(steps => steps.map(s => ({ ...s, status: 'pending' })));

    const runStep = (idx: number) => {
      setGenSteps(steps => steps.map((s, i) => {
        if (i === idx) return { ...s, status: 'running' };
        if (i < idx) return { ...s, status: 'done' };
        return s;
      }));
    };

    try {
      runStep(0);
      await new Promise(r => setTimeout(r, 900));

      runStep(1);
      await new Promise(r => setTimeout(r, 800));

      runStep(2);
      await new Promise(r => setTimeout(r, 800));

      runStep(3);
      
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: targetChannel })
      });
      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Gemini generation failed.');
      }

      runStep(4);
      setGenSteps(steps => steps.map(s => ({ ...s, status: 'done' })));
      await new Promise(r => setTimeout(r, 600));

      // Refresh reports for current channel filter
      await fetchReports(selectedChannel);
      
      // Load the newly generated report
      const latestRes = await fetch(`/api/reports?channel=${targetChannel}`);
      const latestList = await latestRes.json();
      if (latestList && latestList.length > 0) {
        loadReport(latestList[0].id);
      }
    } catch (err: any) {
      console.error('Failed generating report:', err);
      setGenSteps(steps => steps.map(s => s.status === 'running' ? { ...s, status: 'error' } : s));
      alert(`Report Generation Failed: ${err?.message || String(err)}`);
    } finally {
      setGenerating(false);
    }
  };

  // Convert markdown to HTML using marked.js
  const getHtmlContent = (markdown: string) => {
    let processedMarkdown = markdown;
    
    processedMarkdown = processedMarkdown
      .replace(/>\s*\[!NOTE\]/gi, '***💡 NOTE:***')
      .replace(/>\s*\[!TIP\]/gi, '***💡 TIP:***')
      .replace(/>\s*\[!IMPORTANT\]/gi, '***⚠️ IMPORTANT:***')
      .replace(/>\s*\[!WARNING\]/gi, '***⚠️ WARNING:***')
      .replace(/>\s*\[!CAUTION\]/gi, '***🛑 CAUTION:***');

    try {
      const html = marked.parse(processedMarkdown);
      return typeof html === 'string' ? html : '';
    } catch (e) {
      return `<pre style="white-space: pre-wrap;">${markdown}</pre>`;
    }
  };

  const getChannelBadge = (ch?: string) => {
    switch (ch?.toLowerCase()) {
      case 'social':
        return { label: 'SOCIAL', color: '#60a5fa', bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.3)' };
      case 'newsletter':
        return { label: 'NEWSLETTER', color: '#22d3ee', bg: 'rgba(6, 182, 212, 0.15)', border: 'rgba(6, 182, 212, 0.3)' };
      case 'web':
        return { label: 'WEB', color: '#34d399', bg: 'rgba(52, 211, 153, 0.15)', border: 'rgba(52, 211, 153, 0.3)' };
      case 'youtube':
        return { label: 'YOUTUBE', color: '#f87171', bg: 'rgba(248, 113, 113, 0.15)', border: 'rgba(248, 113, 113, 0.3)' };
      default:
        return { label: 'UNIFIED', color: '#a78bfa', bg: 'rgba(167, 139, 250, 0.15)', border: 'rgba(167, 139, 250, 0.3)' };
    }
  };

  return (
    <SidebarLayout>
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Page Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: 700, margin: 0, letterSpacing: '-0.5px' }}>
              Editorial Strategy Reports
            </h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '15px', marginTop: '4px' }}>
              AI strategy and recommendations synthesized separately for each channel by the ContentPulse Gemini Narrative Layer
            </p>
          </div>

          {/* Generator Controls */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              value={generateChannel}
              onChange={e => setGenerateChannel(e.target.value)}
              disabled={generating}
              style={{
                background: '#09090b',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="all">📊 Unified Portfolio</option>
              <option value="web">🌐 Web Channel</option>
              <option value="social">💬 Social Channel</option>
              <option value="newsletter">✉️ Newsletter Channel</option>
              <option value="youtube">🎬 YouTube Channel</option>
            </select>

            <button 
              onClick={() => handleGenerateReport(generateChannel)}
              disabled={generating}
              className="glow-btn glow-btn-primary"
              style={{ 
                padding: '10px 20px', 
                fontSize: '13px', 
                fontWeight: 600,
                opacity: generating ? 0.6 : 1,
                cursor: generating ? 'not-allowed' : 'pointer'
              }}
            >
              {generating ? 'Synthesizing Report...' : `✨ Generate ${generateChannel.toUpperCase()} Report`}
            </button>
          </div>
        </header>

        {/* Channel Filter Tab Bar */}
        <div style={{
          background: '#09090b',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '6px',
          display: 'flex',
          gap: '6px',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#718096', padding: '0 10px', textTransform: 'uppercase' }}>
            Filter Archive:
          </span>
          {REPORT_CHANNELS.map(ch => {
            const active = selectedChannel === ch.key;
            return (
              <button
                key={ch.key}
                type="button"
                onClick={() => handleChannelFilterChange(ch.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  background: active ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  border: active ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid transparent',
                  color: active ? '#ffffff' : '#a0aec0',
                  fontWeight: active ? 600 : 400,
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <span>{ch.icon}</span>
                <span>{ch.label}</span>
              </button>
            );
          })}
        </div>

        {/* Generation Progress Overlay Card */}
        {generating && (
          <div className="glass-card" style={{ padding: '24px', borderLeft: '4px solid var(--color-primary)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="spinner" style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.2)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', display: 'inline-block', animation: 'spin 1s linear infinite' }}></span>
              Synthesizing {generateChannel.toUpperCase()} Editorial Strategy Report...
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {genSteps.map((step, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px' }}>
                  <div style={{ width: '18px', textAlign: 'center' }}>
                    {step.status === 'done' && <span style={{ color: 'var(--color-success)' }}>✓</span>}
                    {step.status === 'running' && <span style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>●</span>}
                    {step.status === 'pending' && <span style={{ color: 'var(--color-text-muted)' }}>○</span>}
                    {step.status === 'error' && <span style={{ color: 'var(--color-error)' }}>✕</span>}
                  </div>
                  <span style={{ 
                    color: step.status === 'running' ? '#fff' : (step.status === 'done' ? '#e5e7eb' : 'var(--color-text-muted)'),
                    fontWeight: step.status === 'running' ? 600 : 400
                  }}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Content Area: Split List & Document */}
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px', alignItems: 'start' }}>
          
          {/* Left: Report Archive List */}
          <aside className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {selectedChannel.toUpperCase()} REPORTS ({reports.length})
              </span>
            </div>

            {reports.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--color-text-muted)', fontSize: '13px' }}>
                No {selectedChannel === 'all' ? '' : selectedChannel} reports generated yet. Click Generate above to create one!
              </div>
            ) : (
              reports.map(rep => {
                const badge = getChannelBadge(rep.channel);
                return (
                  <div 
                    key={rep.id}
                    onClick={() => loadReport(rep.id)}
                    style={{
                      padding: '14px 16px',
                      borderRadius: '8px',
                      background: activeTab === rep.id ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${activeTab === rep.id ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.04)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      borderLeft: activeTab === rep.id ? `3px solid ${badge.color}` : '1px solid rgba(255,255,255,0.04)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{
                        fontSize: '9px',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: badge.bg,
                        color: badge.color,
                        border: `1px solid ${badge.border}`
                      }}>
                        {badge.label}
                      </span>
                      <span style={{ fontSize: '11px', color: '#718096' }}>
                        {new Date(rep.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    <h4 style={{ fontSize: '13px', fontWeight: 600, color: activeTab === rep.id ? '#ffffff' : '#e2e8f0', margin: 0, lineHeight: '1.4' }}>
                      {rep.title}
                    </h4>
                  </div>
                );
              })
            )}
          </aside>

          {/* Right: Active Document Reader */}
          <main className="glass-card" style={{ padding: '40px', minHeight: '600px' }}>
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', color: 'var(--color-text-muted)' }}>
                Loading report narrative...
              </div>
            ) : activeReport ? (
              <article style={{ maxWidth: '800px' }}>
                {/* Document Header */}
                <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '24px', marginBottom: '32px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
                    {(() => {
                      const badge = getChannelBadge(activeReport.channel);
                      return (
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          background: badge.bg,
                          color: badge.color,
                          border: `1px solid ${badge.border}`
                        }}>
                          {badge.label} CHANNEL STRATEGY
                        </span>
                      );
                    })()}
                    <span style={{ fontSize: '12px', color: '#718096' }}>
                      Generated {new Date(activeReport.created_at).toLocaleString()}
                    </span>
                  </div>

                  <h2 style={{ fontSize: '28px', fontWeight: 800, margin: 0, letterSpacing: '-0.5px', color: '#ffffff' }}>
                    {activeReport.title}
                  </h2>
                </div>

                {/* Document Body (Markdown Rendered) */}
                <div 
                  className="markdown-content"
                  style={{ fontSize: '15px', lineHeight: '1.75', color: '#e5e7eb' }}
                  dangerouslySetInnerHTML={{ __html: getHtmlContent(activeReport.narrative) }}
                />
              </article>
            ) : (
              <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--color-text-muted)' }}>
                <div style={{ fontSize: '40px', marginBottom: '16px' }}>📄</div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#ffffff', marginBottom: '6px' }}>
                  No Strategy Report Selected
                </h3>
                <p style={{ fontSize: '13px', color: '#718096', maxWidth: '400px', margin: '0 auto 20px auto' }}>
                  Select a report from the archive on the left or generate a new channel-specific report.
                </p>
                <button
                  onClick={() => handleGenerateReport(selectedChannel)}
                  className="glow-btn glow-btn-primary"
                  style={{ fontSize: '13px', padding: '8px 18px' }}
                >
                  Generate {selectedChannel.toUpperCase()} Report
                </button>
              </div>
            )}
          </main>

        </div>

      </div>
    </SidebarLayout>
  );
}
