'use client';

import React, { useState } from 'react';
import { StructuredAnalysisResult } from '../lib/analysis/analysis';
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

  // Helper to format views (e.g. 45218 -> 45.2k)
  const formatK = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toLocaleString();
  };

  // Sort topics by views for the trajectory resonance chart
  const sortedTopics = [...data.topics].sort((a, b) => b.totalViews - a.totalViews);
  const topTopics = sortedTopics.slice(0, 7);
  const maxTopicViews = topTopics.length > 0 ? Math.max(...topTopics.map(t => t.totalViews), 1) : 1;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* 1. Sync Status notification */}
      {syncStatus && (
        <div style={{ background: 'var(--color-primary-glow)', border: '1px solid var(--border-color)', padding: '12px 16px', borderRadius: '8px', fontSize: '13px' }}>
          {syncStatus}
        </div>
      )}

      {/* 2. Top Filter Bar & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 900, letterSpacing: '-0.5px', color: '#ffffff', margin: 0, fontFamily: 'var(--font-display)' }}>
          PERFORMANCE
        </h1>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Sync Button */}
          <button 
            onClick={handleSync} 
            disabled={syncing}
            style={{ 
              background: '#09090b', 
              border: '1px solid rgba(255,255,255,0.08)', 
              borderRadius: '20px', 
              padding: '6px 16px', 
              fontSize: '13px', 
              color: '#ffffff', 
              cursor: 'pointer',
              fontWeight: 600,
              transition: 'all 0.2s' 
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
          >
            {syncing ? 'Syncing...' : 'Sync Data'}
          </button>

          {/* Date Selector Pill */}
          <div style={{ background: '#09090b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '6px 16px', fontSize: '13px', color: '#a0aec0', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <span>Date: This Week</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>

          {/* Channel Selector Pill */}
          <div style={{ background: '#09090b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '6px 16px', fontSize: '13px', color: '#a0aec0', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <span>Channel: All</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>

          {/* Filter tuning Settings Icon */}
          <button style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#09090b', border: '1px solid rgba(255,255,255,0.08)', color: '#a0aec0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
            </svg>
          </button>
        </div>
      </div>

      {/* 3. PERFORMANCE LAYOUT GRID */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px' }}>
        
        {/* Left Column: Engagement Overview + Conversion/Search Stack */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Card 1: Engagement Overview */}
          <div style={{ 
            background: '#09090b', 
            border: '1px solid rgba(255, 255, 255, 0.08)', 
            borderRadius: '16px', 
            padding: '24px', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '20px',
            position: 'relative'
          }}>
            {/* Header / Context options */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.05em', color: '#718096' }}>
                ENGAGEMENT OVERVIEW
              </span>
              <span style={{ color: '#718096', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold' }}>•••</span>
            </div>

            {/* Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ display: 'inline-block', transform: 'rotate(-45deg)' }}>↑</span> Total Views
                </span>
                <div style={{ fontSize: '36px', fontWeight: 800, color: '#ffffff', marginTop: '4px', letterSpacing: '-0.5px' }}>
                  {formatK(totalViews)}
                </div>
                <span style={{ fontSize: '11px', color: '#4f5e80', marginTop: '2px', display: 'block' }}>Web Surfing</span>
              </div>
              
              <div>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ display: 'inline-block', transform: 'rotate(135deg)' }}>↓</span> Engagement Rate
                </span>
                <div style={{ fontSize: '36px', fontWeight: 800, color: '#ffffff', marginTop: '4px', letterSpacing: '-0.5px' }}>
                  4.8%
                </div>
                <span style={{ fontSize: '11px', color: '#4f5e80', marginTop: '2px', display: 'block' }}>Radio Station</span>
              </div>
            </div>

            {/* Overlapping Line Chart SVG */}
            <div style={{ height: '80px', width: '100%', marginTop: '10px' }}>
              <svg viewBox="0 0 350 80" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                {/* Chart Paths */}
                {/* Green Line */}
                <path 
                  d="M 10 55 Q 60 25, 110 50 T 210 65 T 290 35 T 340 55" 
                  fill="none" 
                  stroke="#34d399" 
                  strokeWidth="2.5" 
                  strokeLinecap="round"
                />
                
                {/* Orange Line */}
                <path 
                  d="M 10 65 Q 70 45, 120 30 T 200 60 T 280 40 T 340 30" 
                  fill="none" 
                  stroke="#fbbf24" 
                  strokeWidth="2.5" 
                  strokeLinecap="round"
                />
              </svg>
            </div>

          </div>

          {/* Card 2: Conversion & Search */}
          <div style={{ 
            background: '#09090b', 
            border: '1px solid rgba(255, 255, 255, 0.08)', 
            borderRadius: '16px', 
            padding: '24px', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '20px'
          }}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.05em', color: '#718096' }}>
                CONVERSION & SEARCH
              </span>
              <span style={{ color: '#718096', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold' }}>•••</span>
            </div>

            {/* Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ display: 'inline-block', transform: 'rotate(-45deg)' }}>↑</span> Conversion Rate
                </span>
                <div style={{ fontSize: '36px', fontWeight: 800, color: '#ffffff', marginTop: '4px', letterSpacing: '-0.5px' }}>
                  {avgConversionRate.toFixed(1)}%
                </div>
                <span style={{ fontSize: '11px', color: '#4f5e80', marginTop: '2px', display: 'block' }}>Partners</span>
              </div>
              
              <div>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ display: 'inline-block', transform: 'rotate(135deg)' }}>↓</span> Search Ranking Chg
                </span>
                <div style={{ fontSize: '36px', fontWeight: 800, color: '#ffffff', marginTop: '4px', letterSpacing: '-0.5px' }}>
                  -3.2%
                </div>
                <span style={{ fontSize: '11px', color: '#4f5e80', marginTop: '2px', display: 'block' }}>Owners</span>
              </div>
            </div>

            {/* Dots Matrix */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
              {/* Row 1 */}
              <div style={{ display: 'flex', gap: '6px' }}>
                {[1,2,3,4,5,6,7,8,9,10,11,12].map(i => {
                  let color = '#34d399'; // green
                  if (i === 4 || i === 8) color = '#fbbf24'; // orange
                  if (i === 11 || i === 12) color = '#3f4e66'; // grey
                  return (
                    <span key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: color }} />
                  );
                })}
              </div>
              
              {/* Row 2 */}
              <div style={{ display: 'flex', gap: '6px' }}>
                {[1,2,3,4,5,6,7,8,9,10].map(i => {
                  let color = '#fbbf24'; // orange
                  if (i < 4) color = '#34d399'; // green
                  if (i === 8) color = '#3f4e66'; // grey
                  if (i > 8) color = '#ef4444'; // red
                  return (
                    <span key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: color }} />
                  );
                })}
              </div>
            </div>

          </div>

        </div>

        {/* Right Column: Web Trajectory & Topic Resonance */}
        <div style={{ 
          background: '#09090b', 
          border: '1px solid rgba(255, 255, 255, 0.08)', 
          borderRadius: '16px', 
          padding: '24px', 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'space-between',
          minHeight: '440px'
        }}>
          
          {/* Card Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.05em', color: '#718096' }}>
              WEB TRAJECTORY & TOPIC RESONANCE
            </span>
            <span style={{ color: '#718096', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold' }}>•••</span>
          </div>

          {/* List of resonance bars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
            
            {topTopics.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#718096', padding: '40px 0', fontSize: '14px' }}>
                No topic data imported yet. Use Sync Data or sync a URL in settings to see resonance metrics.
              </div>
            ) : (
              topTopics.map((topic, i) => {
                const widthPercent = maxTopicViews > 0 ? (topic.totalViews / maxTopicViews) * 90 : 50;
                
                // Determine Resonance Category and Gradient Colors
                let category: 'High' | 'Medium' | 'Low' = 'Low';
                let barBg = 'linear-gradient(90deg, #f3f4f6, #d1d5db)'; // White/grey for Low
                let textColor = '#1f2937';
                let tagBg = '#ffffff';

                if (topic.totalViews >= 10000) {
                  category = 'High';
                  barBg = 'linear-gradient(90deg, #a7f3d0, #34d399)'; // Light green for High
                  textColor = '#065f46';
                  tagBg = '#34d399';
                } else if (topic.totalViews >= 2000) {
                  category = 'Medium';
                  barBg = 'linear-gradient(90deg, #fef3c7, #fbbf24)'; // Orange for Medium
                  textColor = '#92400e';
                  tagBg = '#fbbf24';
                }

                // Render vector inline icon inside progress bar depending on topic/index
                const renderInlineIcon = (idx: number) => {
                  switch (idx % 4) {
                    case 0: // Document icon
                      return (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                          <polyline points="14 2 14 8 20 8"></polyline>
                        </svg>
                      );
                    case 1: // Close/X icon
                      return (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      );
                    case 2: // Signal/Broadcast icon
                      return (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <circle cx="12" cy="12" r="2"></circle>
                          <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"></path>
                        </svg>
                      );
                    default: // Chat/Message icon
                      return (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                      );
                  }
                };

                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', height: '32px' }}>
                    {/* Left label: Topic name */}
                    <div style={{ width: '110px', fontSize: '12px', fontWeight: 600, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: '12px' }}>
                      {topic.topic}
                    </div>

                    {/* Progress Bar Container */}
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                      <div style={{ 
                        height: '24px', 
                        width: `${Math.max(widthPercent, 25)}%`, 
                        background: barBg, 
                        borderRadius: '20px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        padding: '0 8px 0 10px',
                        boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.1)'
                      }}>
                        {/* Inline Icon */}
                        <div style={{ display: 'flex', alignItems: 'center', color: textColor }}>
                          {renderInlineIcon(i)}
                        </div>

                        {/* Pill badge showing category */}
                        <div style={{ 
                          fontSize: '9px', 
                          fontWeight: 800, 
                          color: textColor,
                          letterSpacing: '0.02em'
                        }}>
                          {category}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

          </div>

          {/* Bottom legend block */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            borderTop: '1px solid rgba(255, 255, 255, 0.05)', 
            paddingTop: '18px',
            marginTop: '16px',
            fontSize: '11px',
            color: '#718096'
          }}>
            {/* Legend indicators */}
            <div style={{ display: 'flex', gap: '14px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399' }}></span>
                High Resonance
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fbbf24' }}></span>
                Medium Resonance
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ffffff' }}></span>
                Low Resonance
              </span>
            </div>

            {/* Total Topics */}
            <div>
              Total Topics: {data.topics.length}
            </div>
          </div>

        </div>

      </section>

      {/* 4. EDITORIAL ACTION MATRIX (STAYS FUNCTIONAL AT BOTTOM) */}
      <h3 style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.2px', color: '#ffffff', marginTop: '16px', fontFamily: 'var(--font-display)' }}>
        AI Editorial Strategy Recommendations
      </h3>
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        {/* Continue Cards */}
        <div style={{ background: '#09090b', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', borderLeft: '4px solid var(--color-success)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-success)', fontWeight: 700, fontFamily: 'var(--font-display)', fontSize: '15px' }}>
            CONTINUE & AMPLIFY
          </div>
          {data.recommendations.filter(r => r.action === 'CONTINUE').length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '16px', lineHeight: '1.5' }}>
              No high-performing topic clusters identified yet. Keep importing content to find your top converting topics!
            </p>
          ) : (
            data.recommendations.filter(r => r.action === 'CONTINUE').map((rec, i) => (
              <div key={i} style={{ marginTop: '16px' }}>
                <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>{rec.target}</h4>
                <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '6px', lineHeight: '1.5' }}>
                  {rec.reason}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Stop Cards */}
        <div style={{ background: '#09090b', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', borderLeft: '4px solid var(--color-error)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-error)', fontWeight: 700, fontFamily: 'var(--font-display)', fontSize: '15px' }}>
            STOP & REALLOCATE
          </div>
          {data.recommendations.filter(r => r.action === 'STOP').length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '16px', lineHeight: '1.5' }}>
              All formats and topics are performing above underperformance thresholds. Keep up the good work!
            </p>
          ) : (
            data.recommendations.filter(r => r.action === 'STOP').map((rec, i) => (
              <div key={i} style={{ marginTop: '16px' }}>
                <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>{rec.target}</h4>
                <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '6px', lineHeight: '1.5' }}>
                  {rec.reason}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Create Cards */}
        <div style={{ background: '#09090b', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', borderLeft: '4px solid var(--color-primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary)', fontWeight: 700, fontFamily: 'var(--font-display)', fontSize: '15px' }}>
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
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>{rec.target}</h4>
                  <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px', lineHeight: '1.4' }}>
                    {rec.reason}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 5. GSC CONTENT GAPS & FORMAT PERFORMANCE TABLES */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px' }}>
        
        {/* Organic Search Content Gaps */}
        <div style={{ background: '#09090b', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '24px', overflowX: 'auto' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', marginBottom: '4px', fontFamily: 'var(--font-display)' }}>Organic Search Content Gaps</h3>
          <p style={{ fontSize: '12px', color: '#718096', marginBottom: '20px' }}>
            GSC queries pulling impressions but yielding near-zero CTR due to missing articles
          </p>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: '#718096' }}>
                <th style={{ padding: '12px 8px' }}>Search Query</th>
                <th style={{ padding: '12px 8px' }}>Impressions</th>
                <th style={{ padding: '12px 8px' }}>CTR</th>
                <th style={{ padding: '12px 8px', textAlign: 'right' }}>Priority Score</th>
              </tr>
            </thead>
            <tbody>
              {data.contentGaps.slice(0, 5).map((gap, i) => {
                const maxPriority = Math.max(...data.contentGaps.map(g => g.priorityScore), 1);
                const scorePct = (gap.priorityScore / maxPriority) * 100;
                
                return (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '14px 8px', fontWeight: 600, color: '#fff' }}>
                      &ldquo;{gap.query}&rdquo;
                    </td>
                    <td style={{ padding: '14px 8px', fontFamily: 'monospace' }}>{gap.impressions.toLocaleString()}</td>
                    <td style={{ padding: '14px 8px', fontFamily: 'monospace', color: 'var(--color-error)' }}>{gap.ctr.toFixed(2)}%</td>
                    <td style={{ padding: '14px 8px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: 600 }}>{gap.priorityScore}</span>
                        <div style={{ width: '50px', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
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
        <div style={{ background: '#09090b', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', marginBottom: '4px', fontFamily: 'var(--font-display)' }}>Format Performance Index</h3>
          <p style={{ fontSize: '12px', color: '#718096', marginBottom: '24px' }}>
            Percentile ranks comparing content success within respective channels
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {data.formats.map((f, i) => {
              const getPlatformDetails = (format: string) => {
                switch (format.toLowerCase()) {
                  case 'video':
                    return { label: 'YouTube Video Sync', platform: 'YouTube Integration' };
                  case 'article':
                    return { label: 'Web Pages (GA4)', platform: 'Google Analytics 4' };
                  case 'newsletter':
                    return { label: 'Email Newsletter', platform: 'Substack / Medium' };
                  default:
                    return { label: format.replace('_', ' '), platform: 'Direct Import' };
                }
              };
              
              const platform = getPlatformDetails(f.format);
              
              return (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>
                      {platform.label}
                    </h4>
                    <span style={{ fontSize: '11px', color: '#718096', display: 'block', marginTop: '2px' }}>
                      {f.piecesCount} pieces • {f.totalViews.toLocaleString()} views
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-secondary)' }}>
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
