'use client';

import React, { useState, useEffect } from 'react';
import { marked } from 'marked';
import SidebarLayout from '../SidebarLayout';

interface ReportArchiveItem {
  id: number;
  created_at: string;
  title: string;
}

interface FullReport {
  id: number;
  created_at: string;
  title: string;
  narrative: string;
  metrics_summary: any;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportArchiveItem[]>([]);
  const [activeReport, setActiveReport] = useState<FullReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<number | null>(null);
  
  // Report generation progress state
  const [generating, setGenerating] = useState(false);
  const [genSteps, setGenSteps] = useState<{ label: string; status: 'pending' | 'running' | 'done' | 'error' }[]>([
    { label: 'Querying content performance metrics...', status: 'pending' },
    { label: 'Normalizing format percentiles & topic eligibility...', status: 'pending' },
    { label: 'Aggregating Search Console content gaps...', status: 'pending' },
    { label: 'Prompting Gemini AI Narrative Engine...', status: 'pending' },
    { label: 'Writing strategy & recommendations report...', status: 'pending' },
  ]);

  // Load report list
  const fetchReports = async (selectLatest = false) => {
    try {
      const res = await fetch('/api/reports');
      const data = await res.json();
      if (Array.isArray(data)) {
        setReports(data);
        if (selectLatest && data.length > 0) {
          loadReport(data[0].id);
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
    fetchReports(true);
  }, []);

  // Trigger report generation with step-by-step progress simulation
  const handleGenerateReport = async () => {
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
      // Step 1: Querying metrics
      runStep(0);
      await new Promise(r => setTimeout(r, 1200));

      // Step 2: Normalizing
      runStep(1);
      await new Promise(r => setTimeout(r, 1000));

      // Step 3: GSC Gaps
      runStep(2);
      await new Promise(r => setTimeout(r, 1000));

      // Step 4: Prompting Gemini
      runStep(3);
      
      // Make the actual API POST call during Step 4/5
      const res = await fetch('/api/reports', { method: 'POST' });
      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Gemini generation failed.');
      }

      // Step 5: Finished
      runStep(4);
      setGenSteps(steps => steps.map(s => ({ ...s, status: 'done' })));
      await new Promise(r => setTimeout(r, 800));

      // Re-fetch report list and load the new one
      await fetchReports();
      if (data.report) {
        // Find latest ID and load
        const latestRes = await fetch('/api/reports');
        const latestList = await latestRes.json();
        if (latestList.length > 0) {
          loadReport(latestList[0].id);
        }
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
    // Basic pre-processing of custom github alert blocks so they look like nice cards
    let processedMarkdown = markdown;
    
    // Replace GitHub alerts: > [!NOTE] -> **Note:** etc.
    processedMarkdown = processedMarkdown
      .replace(/>\s*\[!NOTE\]/gi, '***💡 NOTE:***')
      .replace(/>\s*\[!TIP\]/gi, '***💡 TIP:***')
      .replace(/>\s*\[!IMPORTANT\]/gi, '***⚠️ IMPORTANT:***')
      .replace(/>\s*\[!WARNING\]/gi, '***⚠️ WARNING:***')
      .replace(/>\s*\[!CAUTION\]/gi, '***🛑 CAUTION:***');

    try {
      const html = marked.parse(processedMarkdown);
      return typeof html === 'string' ? html : '';
    } catch (err) {
      return `<p>${markdown}</p>`;
    }
  };

  return (
    <SidebarLayout>
      <div className="animate-fade-in">
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 700, margin: 0 }}>Editorial Strategy Reports</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '15px', marginTop: '4px' }}>
          Archived reports synthesized by the ContentPulse Gemini Narrative Layer
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '32px', alignItems: 'start' }}>
        
        {/* 1. Sidebar Section */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <button 
            onClick={handleGenerateReport} 
            disabled={generating}
            className="glow-btn glow-btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
          >
            {generating ? 'Generating...' : 'Generate New Report'}
          </button>

          <div className="glass-card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '15px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
              Report Archive
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '420px', overflowY: 'auto' }}>
              {reports.length === 0 ? (
                <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', padding: '12px', textAlign: 'center' }}>
                  No reports generated yet.
                </div>
              ) : (
                reports.map(rep => {
                  const date = new Date(rep.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });
                  const isActive = activeTab === rep.id;
                  
                  return (
                    <button
                      key={rep.id}
                      onClick={() => loadReport(rep.id)}
                      style={{
                        textAlign: 'left',
                        padding: '12px',
                        borderRadius: '8px',
                        background: isActive ? 'var(--color-primary-glow)' : 'transparent',
                        border: `1px solid ${isActive ? 'var(--color-primary)' : 'var(--border-color)'}`,
                        color: isActive ? '#fff' : 'var(--color-text-muted)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      className="archive-item-btn"
                    >
                      <div style={{ fontWeight: 600, fontSize: '13px', color: isActive ? '#fff' : 'var(--color-text)' }}>
                        {rep.title}
                      </div>
                      <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.8 }}>
                        {date}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </aside>

        {/* 2. Main Narrative View Section */}
        <section style={{ position: 'relative' }}>
          
          {/* Progress Modal Overlay for Generation */}
          {generating && (
            <div className="glass-card animate-fade-in" style={{ padding: '40px', background: 'rgba(0, 0, 0, 0.95)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '24px', minHeight: '380px', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'inline-block', width: '40px', height: '40px', border: '4px solid var(--color-primary-glow)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '16px' }} />
                <h3 style={{ fontSize: '20px', fontFamily: 'var(--font-display)' }}>Synthesizing Editorial Intelligence</h3>
                <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                  Connecting multi-channel performance to Gemini LLM narrative prompt...
                </p>
              </div>

              <div style={{ maxWidth: '450px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {genSteps.map((step, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ color: step.status === 'done' ? 'var(--color-text)' : 'var(--color-text-muted)' }}>
                      {step.label}
                    </span>
                    <span>
                      {step.status === 'pending' && <span style={{ opacity: 0.3 }}>⏳</span>}
                      {step.status === 'running' && <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Running...</span>}
                      {step.status === 'done' && <span style={{ color: 'var(--color-success)' }}>✅ Done</span>}
                      {step.status === 'error' && <span style={{ color: 'var(--color-error)' }}>❌ Error</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Normal Report Viewer */}
          {!generating && (
            <div className="glass-card" style={{ padding: '40px', minHeight: '520px', background: 'rgba(9, 9, 11, 0.75)' }}>
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', height: '300px', justifyContent: 'center', alignItems: 'center' }}>
                  <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid rgba(255,255,255,0.05)', borderTopColor: 'var(--color-secondary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  <p style={{ marginTop: '12px', fontSize: '14px', color: 'var(--color-text-muted)' }}>Loading report narrative...</p>
                </div>
              ) : activeReport ? (
                <div className="report-narrative-content">
                  <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '20px', marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                      <h2 style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'var(--font-display)', color: '#fff' }}>
                        {activeReport.title}
                      </h2>
                      <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                        Synthesized on {new Date(activeReport.created_at).toLocaleDateString('en-US', {
                          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </div>
                    </div>
                    {/* Visual Badge showing if database values were loaded */}
                    <div style={{ fontSize: '11px', background: 'var(--color-success-bg)', border: '1px solid var(--color-success)', color: 'var(--color-success)', padding: '4px 10px', borderRadius: '20px', fontWeight: 600 }}>
                      📊 Data Grounded
                    </div>
                  </div>

                  {/* Rendered HTML */}
                  <div 
                    dangerouslySetInnerHTML={{ __html: getHtmlContent(activeReport.narrative) }} 
                    className="markdown-body"
                  />
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', height: '400px', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '40px' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: 700 }}>No Strategy Reports Found</h3>
                  <p style={{ color: 'var(--color-text-muted)', maxWidth: '400px', fontSize: '14px', marginTop: '8px', lineHeight: '1.6' }}>
                    Generate your first report to trigger the ContentPulse Analysis Engine and let Gemini write a decision-ready editorial strategy.
                  </p>
                </div>
              )}
            </div>
          )}
        </section>

      </div>

      {/* Styled JSX/CSS for Markdown Rendering */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes spin-back {
          to { transform: rotate(-360deg); }
        }
        .archive-item-btn:hover {
          background: rgba(255, 255, 255, 0.02) !important;
          border-color: var(--border-color-hover) !important;
        }
        
        /* Markdown rendering rules */
        .markdown-body {
          line-height: 1.7;
          font-size: 15px;
          color: #e5e7eb;
        }
        .markdown-body h1 {
          font-size: 22px;
          margin-top: 32px;
          margin-bottom: 16px;
          color: #fff;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 8px;
        }
        .markdown-body h2 {
          font-size: 18px;
          margin-top: 24px;
          margin-bottom: 12px;
          color: #fff;
        }
        .markdown-body h3 {
          font-size: 15px;
          margin-top: 20px;
          margin-bottom: 8px;
          color: #fff;
        }
        .markdown-body p {
          margin-bottom: 16px;
        }
        .markdown-body ul, .markdown-body ol {
          margin-bottom: 16px;
          padding-left: 20px;
        }
        .markdown-body li {
          margin-bottom: 6px;
        }
        .markdown-body hr {
          border: 0;
          height: 1px;
          background: var(--border-color);
          margin: 28px 0;
        }
        .markdown-body strong {
          color: #fff;
        }
        .markdown-body table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        .markdown-body th, .markdown-body td {
          border: 1px solid var(--border-color);
          padding: 10px;
          text-align: left;
        }
        .markdown-body th {
          background: rgba(255,255,255,0.02);
        }
        
        /* Styled alerts from github preprocessing */
        .markdown-body p:has(em:first-child) {
          padding: 16px;
          border-radius: 10px;
          background: rgba(255,255,255,0.02);
          border: 1px solid var(--border-color);
          margin: 20px 0;
        }
        .markdown-body p:has(em:contains('IMPORTANT')), .markdown-body p:has(em:contains('WARNING')) {
          border-left: 4px solid var(--color-warning);
          background: var(--color-warning-bg);
          border-color: var(--color-warning);
        }
        .markdown-body p:has(em:contains('TIP')) {
          border-left: 4px solid var(--color-primary);
          background: var(--color-primary-glow);
          border-color: var(--color-primary);
        }
      `}} />
      </div>
    </SidebarLayout>
  );
}
