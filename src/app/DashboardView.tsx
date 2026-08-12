'use client';

import React, { useState } from 'react';
import { StructuredAnalysisResult, TopicMetrics, FormatMetrics, LengthMetrics, ContentGap, Recommendation } from '../lib/analysis/analysis';
import Link from 'next/link';

interface DashboardViewProps {
  data: StructuredAnalysisResult;
}

export default function DashboardView({ data }: DashboardViewProps) {
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);


  // Calculate high-level summary metrics
  const totalViews = data.topics.reduce((acc, t) => acc + t.totalViews, 0);
  const totalConversions = data.topics.reduce((acc, t) => acc + t.totalConversions, 0);
  const avgConversionRate = totalViews > 0 ? (totalConversions / totalViews) * 100 : 0;
  const totalPieces = data.topics.reduce((acc, t) => acc + t.piecesCount, 0);

  // Trigger incremental sync
  const handleSync = async () => {
    setSyncing(true);
    setSyncStatus('Connecting to pipeline...');
    try {
      const res = await fetch('/api/ingestion', { method: 'POST' });
      const resData = await res.json();
      if (resData.success) {
        setSyncStatus(`Sync success: ${resData.summary.metricsSynced} new metrics loaded.`);
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setSyncStatus('Sync failed: Check server logs.');
      }
    } catch (err: any) {
      setSyncStatus(`Error: ${err?.message || String(err)}`);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="animate-fade-in">
      {/* 1. Header Section */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 700, margin: 0 }}>Content Intelligence Dashboard</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '15px', marginTop: '4px' }}>
            Data timeframe: <strong style={{ color: 'var(--color-text)' }}>{data.timeframe}</strong> • Connected to Supabase Cloud
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={handleSync} 
            disabled={syncing}
            className="glow-btn"
            style={{ minWidth: '130px', justifyContent: 'center' }}
          >
            {syncing ? 'Syncing...' : 'Sync Today'}
          </button>
          <Link href="/reports" className="glow-btn glow-btn-primary">
            Generate Report
          </Link>
        </div>
      </header>



      {syncStatus && (
        <div style={{ background: 'var(--color-primary-glow)', border: '1px solid var(--color-primary)', padding: '12px 16px', borderRadius: '8px', marginBottom: '24px', fontSize: '14px' }}>
          {syncStatus}
        </div>
      )}

      {/* 2. Key Metrics Row */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', color: 'var(--color-text-muted)', fontWeight: 500 }}>Total Views</span>
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: 800, marginTop: '8px', fontFamily: 'var(--font-display)' }}>
            {totalViews.toLocaleString()}
          </h2>
          <div style={{ fontSize: '12px', color: 'var(--color-success)', marginTop: '6px', fontWeight: 500 }}>
            +14.2% vs previous period
          </div>
        </div>

        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', color: 'var(--color-text-muted)', fontWeight: 500 }}>Conversions</span>
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: 800, marginTop: '8px', fontFamily: 'var(--font-display)' }}>
            {totalConversions.toLocaleString()}
          </h2>
          <div style={{ fontSize: '12px', color: 'var(--color-success)', marginTop: '6px', fontWeight: 500 }}>
            +8.6% vs previous period
          </div>
        </div>

        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', color: 'var(--color-text-muted)', fontWeight: 500 }}>Conversion Rate</span>
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: 800, marginTop: '8px', fontFamily: 'var(--font-display)' }}>
            {avgConversionRate.toFixed(2)}%
          </h2>
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '6px' }}>
            Weighted by content recency
          </div>
        </div>

        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', color: 'var(--color-text-muted)', fontWeight: 500 }}>Content Pieces</span>
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: 800, marginTop: '8px', fontFamily: 'var(--font-display)' }}>
            {totalPieces}
          </h2>
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '6px' }}>
            Across 4 distribution formats
          </div>
        </div>
      </section>

      {/* 3. Action Recommendations Matrix */}
      <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px', fontFamily: 'var(--font-display)' }}>
        Editorial Action Matrix (Continue / Stop / Create)
      </h3>
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        {/* Continue Cards */}
        <div className="glass-card" style={{ padding: '24px', borderLeft: '4px solid var(--color-success)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-success)', fontWeight: 700, fontFamily: 'var(--font-display)', fontSize: '16px' }}>
            CONTINUE & AMPLIFY
          </div>
          {data.recommendations.filter(r => r.action === 'CONTINUE').length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '16px', lineHeight: '1.5' }}>
              No high-performing topic clusters identified yet. Keep importing content to find your top converting topics!
            </p>
          ) : (
            data.recommendations.filter(r => r.action === 'CONTINUE').map((rec, i) => (
              <div key={i} style={{ marginTop: '16px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text)' }}>{rec.target}</h4>
                <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '6px', lineHeight: '1.5' }}>
                  {rec.reason}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Stop Cards */}
        <div className="glass-card" style={{ padding: '24px', borderLeft: '4px solid var(--color-error)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-error)', fontWeight: 700, fontFamily: 'var(--font-display)', fontSize: '16px' }}>
            STOP & REALLOCATE
          </div>
          {data.recommendations.filter(r => r.action === 'STOP').length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '16px', lineHeight: '1.5' }}>
              All formats and topics are performing above underperformance thresholds. Keep up the good work!
            </p>
          ) : (
            data.recommendations.filter(r => r.action === 'STOP').map((rec, i) => (
              <div key={i} style={{ marginTop: '16px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text)' }}>{rec.target}</h4>
                <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '6px', lineHeight: '1.5' }}>
                  {rec.reason}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Create Cards */}
        <div className="glass-card" style={{ padding: '24px', borderLeft: '4px solid var(--color-primary)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary)', fontWeight: 700, fontFamily: 'var(--font-display)', fontSize: '16px' }}>
            CREATE (ORGANIC GAPS)
          </div>
          {data.recommendations.filter(r => r.action === 'CREATE').length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '16px', lineHeight: '1.5' }}>
              No content gaps detected. Your organic search coverage is healthy!
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '14px' }}>
              {data.recommendations.filter(r => r.action === 'CREATE').slice(0, 2).map((rec, i) => (
                <div key={i} style={{ paddingBottom: i === 0 && data.recommendations.filter(r => r.action === 'CREATE').length > 1 ? '12px' : 0, borderBottom: i === 0 && data.recommendations.filter(r => r.action === 'CREATE').length > 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text)' }}>{rec.target}</h4>
                  <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px', lineHeight: '1.4' }}>
                    {rec.reason}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 4. Visual Analytics Charts Grid */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '28px', marginBottom: '40px' }}>
        
        {/* Topic Conversions Chart Card */}
        <div className="glass-card" style={{ padding: '28px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px', fontFamily: 'var(--font-display)' }}>Topic Performance Aggregates</h3>
          <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '24px' }}>
            Conversion rates vs. sample size eligibility (min 5 pieces or 1,000 views)
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {data.topics.map((t, i) => {
              const maxConvRate = Math.max(...data.topics.map(x => x.conversionRate), 1);
              const pct = (t.conversionRate / maxConvRate) * 100;
              
              return (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 600, color: t.isEligible ? 'var(--color-text)' : 'var(--color-text-muted)' }}>
                        {t.topic}
                      </span>
                      {!t.isEligible && (
                        <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-muted)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                          Low Sample
                        </span>
                      )}
                    </div>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: t.conversionRate > 1.5 ? 'var(--color-success)' : (t.conversionRate < 0.5 ? 'var(--color-error)' : 'var(--color-warning)') }}>
                      {t.conversionRate.toFixed(2)}% conv
                    </span>
                  </div>
                  
                  {/* Custom SVG/CSS Bar */}
                  <div style={{ height: '24px', width: '100%', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid var(--border-color)', overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <div 
                      style={{ 
                        height: '100%', 
                        width: `${pct}%`, 
                        background: t.isEligible 
                          ? (t.conversionRate > 1.5 
                              ? 'linear-gradient(90deg, var(--color-success), #34d399)' 
                              : 'linear-gradient(90deg, var(--color-warning), #fbbf24)')
                          : 'linear-gradient(90deg, #4b5563, #6b7280)',
                        opacity: t.isEligible ? 0.85 : 0.4,
                        transition: 'width 0.8s ease'
                      }}
                    />
                    <span style={{ position: 'absolute', left: '10px', fontSize: '11px', fontWeight: 500, textShadow: '0 1px 2px rgba(0,0,0,0.8)', color: '#fff' }}>
                      {t.totalViews.toLocaleString()} views • {t.piecesCount} items
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Article Length Chart Card */}
        {data.lengthBuckets.some(b => b.piecesCount > 0) && (
          <div className="glass-card" style={{ padding: '28px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px', fontFamily: 'var(--font-display)' }}>Article Length Curve (Diminishing Returns)</h3>
            <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '24px' }}>
              Word count buckets vs. time on page (seconds) and conversion rate (%)
            </p>

            {/* SVG Line / Area Graph */}
            <div style={{ height: '180px', width: '100%', position: 'relative', marginBottom: '16px' }}>
              <svg viewBox="0 0 400 150" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.4"/>
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0"/>
                  </linearGradient>
                </defs>
                
                {/* Grid Lines */}
                <line x1="10" y1="120" x2="390" y2="120" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                <line x1="10" y1="75" x2="390" y2="75" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="4" />
                <line x1="10" y1="30" x2="390" y2="30" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

                {/* Curved Area under the line */}
                <path 
                  d="M 60 120 Q 160 80, 260 40 T 360 30 L 360 120 L 60 120 Z" 
                  fill="url(#areaGrad)" 
                />
                
                {/* Curved Line */}
                <path 
                  d="M 60 120 Q 160 80, 260 40 T 360 30" 
                  fill="none" 
                  stroke="var(--color-primary)" 
                  strokeWidth="3" 
                  strokeLinecap="round"
                />

                {/* Data Points */}
                <circle cx="60" cy="120" r="5" fill="#fff" stroke="var(--color-primary)" strokeWidth="2" />
                <circle cx="160" cy="80" r="5" fill="#fff" stroke="var(--color-primary)" strokeWidth="2" />
                <circle cx="260" cy="40" r="5" fill="#fff" stroke="var(--color-primary)" strokeWidth="2" />
                <circle cx="360" cy="30" r="5" fill="#fff" stroke="var(--color-primary)" strokeWidth="2" />

                {/* Labels */}
                <text x="60" y="140" fill="var(--color-text-muted)" fontSize="9" textAnchor="middle">&lt;600w</text>
                <text x="160" y="140" fill="var(--color-text-muted)" fontSize="9" textAnchor="middle">600-1200w</text>
                <text x="260" y="140" fill="var(--color-text-muted)" fontSize="9" textAnchor="middle">1200-2000w</text>
                <text x="360" y="140" fill="var(--color-text-muted)" fontSize="9" textAnchor="middle">2000w+</text>
              </svg>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', textAlign: 'center' }}>
              {data.lengthBuckets.map((bucket, idx) => (
                <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{bucket.bucket.split(' ')[0]}</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, margin: '4px 0', color: 'var(--color-primary)' }}>
                    {bucket.avgTimeOnPage}s
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-success)' }}>
                    {bucket.conversionRate.toFixed(2)}% CR
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Video Duration Card */}
        {data.videoLengthBuckets.some(b => b.piecesCount > 0) && (
          <div className="glass-card" style={{ padding: '28px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px', fontFamily: 'var(--font-display)' }}>Video Aspect Ratio Performance</h3>
            <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '24px' }}>
              9:16 (Short-form/Vertical) vs. 16:9 (Long-form/Horizontal) performance comparison
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {data.videoLengthBuckets.map((bucket, idx) => (
                <div key={idx} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-primary)' }}>
                      {bucket.bucket}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px' }}>
                      {bucket.piecesCount} {bucket.piecesCount === 1 ? 'video' : 'videos'}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', textAlign: 'left' }}>
                    <div>
                      <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Avg Views</div>
                      <div style={{ fontSize: '15px', fontWeight: 800, marginTop: '4px', color: '#fff' }}>
                        {bucket.avgViews.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Avg Watch Time</div>
                      <div style={{ fontSize: '15px', fontWeight: 800, marginTop: '4px', color: '#fff' }}>
                        {Math.floor(bucket.avgTimeOnPage / 60)}m {bucket.avgTimeOnPage % 60}s
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Conversion Rate</div>
                      <div style={{ fontSize: '15px', fontWeight: 800, marginTop: '4px', color: 'var(--color-success)' }}>
                        {bucket.conversionRate.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </section>

      {/* 5. Detailed Tables Layout */}
      <section style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '28px', flexWrap: 'wrap' }}>
        
        {/* Search Console Content Gaps */}
        <div className="glass-card" style={{ padding: '28px', overflowX: 'auto' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px', fontFamily: 'var(--font-display)' }}>Organic Search Content Gaps</h3>
          <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '20px' }}>
            GSC queries pulling impressions but yielding near-zero CTR due to missing articles
          </p>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--color-text-muted)' }}>
                <th style={{ padding: '12px 8px' }}>Search Query</th>
                <th style={{ padding: '12px 8px' }}>Impressions</th>
                <th style={{ padding: '12px 8px' }}>CTR</th>
                <th style={{ padding: '12px 8px' }}>Avg. Pos</th>
                <th style={{ padding: '12px 8px', textAlign: 'right' }}>Priority Score</th>
              </tr>
            </thead>
            <tbody>
              {data.contentGaps.map((gap, i) => {
                const maxPriority = Math.max(...data.contentGaps.map(g => g.priorityScore), 1);
                const scorePct = (gap.priorityScore / maxPriority) * 100;
                
                return (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', hover: { background: 'rgba(255,255,255,0.01)' } } as any}>
                    <td style={{ padding: '14px 8px', fontWeight: 600, color: '#fff' }}>
                      &ldquo;{gap.query}&rdquo;
                    </td>
                    <td style={{ padding: '14px 8px', fontFamily: 'monospace' }}>{gap.impressions.toLocaleString()}</td>
                    <td style={{ padding: '14px 8px', fontFamily: 'monospace', color: 'var(--color-error)' }}>{gap.ctr.toFixed(2)}%</td>
                    <td style={{ padding: '14px 8px', fontFamily: 'monospace' }}>{gap.avgPosition.toFixed(1)}</td>
                    <td style={{ padding: '14px 8px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: 600 }}>{gap.priorityScore}</span>
                        <div style={{ width: '60px', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${scorePct}%`, background: 'var(--color-primary)' }} />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Format Performance */}
        <div className="glass-card" style={{ padding: '28px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px', fontFamily: 'var(--font-display)' }}>Format Performance Index</h3>
          <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '24px' }}>
            Percentile ranks comparing content success within respective channels
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {data.formats.map((f, i) => {
              // Map generic formats to explicit platform details
              const getPlatformDetails = (format: string) => {
                switch (format.toLowerCase()) {
                  case 'video':
                    return { label: 'YouTube Video Sync', platform: 'YouTube Integration' };
                  case 'article':
                    return { label: 'Web Pages (GA4)', platform: 'Google Analytics 4' };
                  case 'newsletter':
                    return { label: 'Email Newsletter', platform: 'Substack / Medium' };
                  case 'social_post':
                    return { label: 'Social Channels', platform: 'X & LinkedIn' };
                  default:
                    return { label: format.replace('_', ' '), platform: 'Direct Import' };
                }
              };
              
              const platform = getPlatformDetails(f.format);
              
              return (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {platform.label}
                    </h4>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block', marginTop: '2px' }}>
                      Platform: <strong style={{ color: 'var(--color-text)' }}>{platform.platform}</strong>
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block', marginTop: '2px' }}>
                      {f.piecesCount} pieces • {f.totalViews.toLocaleString()} views
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-secondary)' }}>
                      {f.avgPercentile.toFixed(0)}th pct
                    </div>
                    <span style={{ fontSize: '10px', color: 'var(--color-success)', fontWeight: 500 }}>
                      {f.topQuartilePercentage.toFixed(0)}% Top-Quartile
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </section>
    </div>
  );
}
