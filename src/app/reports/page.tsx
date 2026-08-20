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
  { key: 'all', label: 'All Reports' },
  { key: 'web', label: 'Web' },
  { key: 'social', label: 'Social & Video' },
  { key: 'newsletter', label: 'Newsletter' }
];

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportArchiveItem[]>([]);
  const [activeReport, setActiveReport] = useState<FullReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<number | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  const [generateChannel, setGenerateChannel] = useState<string>('all');
  const [aiEngine, setAiEngine] = useState<string>('auto');
  
  // Report generation progress state
  const [generating, setGenerating] = useState(false);
  const [genSteps, setGenSteps] = useState<{ label: string; status: 'pending' | 'running' | 'done' | 'error' }[]>([
    { label: 'Querying channel metrics & content items...', status: 'pending' },
    { label: 'Normalizing format percentiles & topic eligibility...', status: 'pending' },
    { label: 'Synthesizing channel opportunity gaps...', status: 'pending' },
    { label: 'Prompting Bytez AI / Gemini Strategy Engine...', status: 'pending' },
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

    let provider = 'auto';
    let model = 'Qwen/Qwen2.5-72B-Instruct';

    if (aiEngine === 'bytez-qwen') {
      provider = 'bytez';
      model = 'Qwen/Qwen2.5-72B-Instruct';
    } else if (aiEngine === 'bytez-deepseek') {
      provider = 'bytez';
      model = 'deepseek-ai/DeepSeek-V3';
    } else if (aiEngine === 'gemini') {
      provider = 'gemini';
    }

    try {
      // Step 1
      setGenSteps(s => s.map((step, i) => i === 0 ? { ...step, status: 'running' } : step));
      await new Promise(r => setTimeout(r, 600));
      setGenSteps(s => s.map((step, i) => i === 0 ? { ...step, status: 'done' } : (i === 1 ? { ...step, status: 'running' } : step)));

      // Step 2
      await new Promise(r => setTimeout(r, 600));
      setGenSteps(s => s.map((step, i) => i === 1 ? { ...step, status: 'done' } : (i === 2 ? { ...step, status: 'running' } : step)));

      // Step 3
      setGenSteps(s => s.map((step, i) => i === 2 ? { ...step, status: 'done' } : (i === 3 ? { ...step, status: 'running', label: `Synthesizing strategy with ${aiEngine === 'gemini' ? 'Google Gemini' : (aiEngine.includes('bytez') ? 'Bytez AI' : 'Bytez AI / Gemini')}...` } : step)));

      // Step 4: Actual API Call with payload
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: targetChannel,
          provider,
          model
        })
      });
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate editorial report.');
      }

      setGenSteps(s => s.map((step, i) => i === 3 ? { ...step, status: 'done' } : (i === 4 ? { ...step, status: 'running' } : step)));
      await new Promise(r => setTimeout(r, 500));
      setGenSteps(s => s.map(step => ({ ...step, status: 'done' })));

      // Reload archive and view the freshly generated report
      await fetchReports(targetChannel, true);
      if (data.report && data.report.id) {
        await loadReport(data.report.id);
      }
    } catch (err: any) {
      console.error('Report generation error:', err);
      setGenSteps(s => s.map(step => step.status === 'running' ? { ...step, status: 'error' } : step));
      alert(`Report Generation Failed: ${err?.message || String(err)}`);
    } finally {
      setTimeout(() => {
        setGenerating(false);
      }, 1200);
    }
  };

  const getHtmlContent = (markdownText: string) => {
    try {
      return marked.parse(markdownText);
    } catch (e) {
      return markdownText;
    }
  };

  const getChannelBadge = (ch?: string) => {
    switch ((ch || 'all').toLowerCase()) {
      case 'web':
        return { label: 'Web', color: 'var(--color-success)', bg: 'var(--color-success-bg)', border: 'rgba(52, 211, 153, 0.3)' };
      case 'social':
        return { label: 'Social', color: 'var(--color-primary)', bg: 'var(--color-primary-glow)', border: 'rgba(59, 130, 246, 0.3)' };
      case 'newsletter':
        return { label: 'Newsletter', color: 'var(--color-secondary)', bg: 'var(--color-secondary-glow)', border: 'rgba(6, 182, 212, 0.3)' };
      case 'youtube':
        return { label: 'YouTube', color: '#f87171', bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.3)' };
      default:
        return { label: 'Unified', color: '#a78bfa', bg: 'rgba(167, 139, 250, 0.1)', border: 'rgba(167, 139, 250, 0.3)' };
    }
  };

  return (
    <SidebarLayout>
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', color: 'var(--color-text)' }}>
        
        {/* Header Bar with Channel Report Generator */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: 800, margin: 0, letterSpacing: '-0.5px', color: 'var(--color-text)' }}>
              Editorial Strategy Reports
            </h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '15px', marginTop: '4px' }}>
              Decision-ready, high-signal editorial directives synthesized by Bytez AI (Qwen / DeepSeek) & Gemini
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* AI Engine Select */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 600 }}>AI Engine:</span>
              <select
                value={aiEngine}
                onChange={e => setAiEngine(e.target.value)}
                disabled={generating}
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  color: 'var(--color-text)',
                  padding: '8px 12px',
                  fontSize: '13px',
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="auto">Auto (Bytez AI / Gemini)</option>
                <option value="bytez-qwen">Bytez AI (Qwen 2.5 72B)</option>
                <option value="bytez-deepseek">Bytez AI (DeepSeek V3)</option>
                <option value="gemini">Google Gemini (Flash)</option>
              </select>
            </div>

            {/* Target Channel Select */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Channel:</span>
              <select
                value={generateChannel}
                onChange={e => setGenerateChannel(e.target.value)}
                disabled={generating}
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  color: 'var(--color-text)',
                  padding: '8px 12px',
                  fontSize: '13px',
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="all">Unified (All Channels)</option>
                <option value="web">Web Channel</option>
                <option value="social">Social & Video Channel</option>
                <option value="newsletter">Newsletter Channel</option>
              </select>
            </div>

            {/* Generate Button */}
            <button
              onClick={() => handleGenerateReport(generateChannel)}
              disabled={generating}
              className="glow-btn glow-btn-primary"
              style={{ padding: '10px 20px', fontSize: '13px', borderRadius: '8px' }}
            >
              {generating ? (
                <>
                  <span className="spinner" style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 1s linear infinite' }}></span>
                  Generating Report...
                </>
              ) : (
                <span>Generate {generateChannel.toUpperCase()} Report</span>
              )}
            </button>
          </div>
        </header>

        {/* Channel Filter Tab Bar */}
        <div className="glass-card" style={{
          borderRadius: '12px',
          padding: '6px',
          display: 'flex',
          gap: '6px',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', padding: '0 10px', textTransform: 'uppercase' }}>
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
                  background: active ? 'var(--color-primary-glow)' : 'transparent',
                  border: active ? '1px solid var(--color-primary)' : '1px solid transparent',
                  color: active ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  fontWeight: active ? 700 : 500,
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <span>{ch.label}</span>
              </button>
            );
          })}
        </div>

        {/* Generation Progress Overlay Card */}
        {generating && (
          <div className="glass-card" style={{ padding: '24px', borderLeft: '4px solid var(--color-primary)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text)' }}>
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
                    color: step.status === 'running' ? 'var(--color-text)' : (step.status === 'done' ? 'var(--color-text)' : 'var(--color-text-muted)'),
                    fontWeight: step.status === 'running' ? 700 : 400
                  }}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Content Area: Split List & Document */}
        <div className="mobile-stack-grid" style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px', alignItems: 'start' }}>
          
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
                      background: activeTab === rep.id ? 'var(--color-primary-glow)' : 'var(--bg-base)',
                      border: `1px solid ${activeTab === rep.id ? 'var(--color-primary)' : 'var(--border-color)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      borderLeft: activeTab === rep.id ? `3px solid ${badge.color}` : '1px solid var(--border-color)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{
                        fontSize: '10px',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        background: badge.bg,
                        color: badge.color,
                        fontWeight: 700,
                        border: `1px solid ${badge.border}`
                      }}>
                        {badge.label}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                        {new Date(rep.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', margin: 0, lineHeight: '1.4' }}>
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
                    <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                      Generated {new Date(activeReport.created_at).toLocaleString()}
                    </span>
                  </div>

                  <h2 style={{ fontSize: '28px', fontWeight: 800, margin: 0, letterSpacing: '-0.5px', color: 'var(--color-text)' }}>
                    {activeReport.title}
                  </h2>
                </div>

                {/* Document Body (Markdown Rendered) */}
                <div 
                  className="markdown-content"
                  style={{ fontSize: '15px', lineHeight: '1.75', color: 'var(--color-text)' }}
                  dangerouslySetInnerHTML={{ __html: getHtmlContent(activeReport.narrative) }}
                />
              </article>
            ) : (
              <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--color-text-muted)' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '6px' }}>
                  No Strategy Report Selected
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', maxWidth: '400px', margin: '0 auto 20px auto' }}>
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
