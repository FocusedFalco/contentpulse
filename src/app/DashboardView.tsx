'use client';

import React, { useState, useEffect } from 'react';
import { StructuredAnalysisResult } from '../lib/analysis/analysis';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

interface DashboardViewProps {
  initialData: StructuredAnalysisResult;
  initialChannel?: string;
}

export default function DashboardView({ initialData, initialChannel = 'all' }: DashboardViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [data, setData] = useState<StructuredAnalysisResult>(initialData);
  const [activeChannel, setActiveChannel] = useState<string>(initialChannel || searchParams.get('channel') || 'all');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // Sync state if props change
  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  // Channel switch handler
  const handleSwitchChannel = async (channelKey: string) => {
    setActiveChannel(channelKey);
    setLoading(true);
    try {
      // Update URL query string smoothly
      const url = new URL(window.location.href);
      if (channelKey === 'all') {
        url.searchParams.delete('channel');
      } else {
        url.searchParams.set('channel', channelKey);
      }
      window.history.pushState({}, '', url.toString());

      // Fetch updated analytical data for the selected channel
      const res = await fetch(`/api/analysis?channel=${channelKey}`);
      const newData = await res.json();
      if (newData && !newData.error) {
        setData(newData);
      }
    } catch (err) {
      console.error('Failed to switch channel:', err);
    } finally {
      setLoading(false);
    }
  };

  // Trigger incremental sync
  const handleSync = async () => {
    setSyncing(true);
    setSyncStatus('Connecting to pipeline...');
    try {
      const res = await fetch('/api/ingestion', { method: 'POST' });
      const resData = await res.json();
      if (resData.success) {
        setSyncStatus(`Sync success: ${resData.summary.metricsSynced} new metrics loaded.`);
        // Reload channel data
        handleSwitchChannel(activeChannel);
      } else {
        setSyncStatus('Sync failed: Check server logs.');
      }
    } catch (err: any) {
      setSyncStatus(`Error: ${err?.message || String(err)}`);
    } finally {
      setSyncing(false);
    }
  };

  // Helper to format numbers (e.g. 45218 -> 45.2k)
  const formatK = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toLocaleString();
  };

  // Channels definition for tab bar
  const channelTabs = [
    { key: 'all', label: 'All Channels', icon: '📊', description: 'Unified Portfolio' },
    { key: 'web', label: 'Web', icon: '🌐', description: 'GA4 & Articles' },
    { key: 'social', label: 'Social', icon: '💬', description: 'X, LinkedIn, IG' },
    { key: 'newsletter', label: 'Newsletter', icon: '✉️', description: 'Substack & Beehiiv' },
    { key: 'youtube', label: 'YouTube', icon: '🎬', description: 'Video & Shorts' }
  ];

  // Channel titles and descriptions
  const getChannelHeaderInfo = (ch: string) => {
    switch (ch) {
      case 'web':
        return {
          title: 'WEB CHANNEL DASHBOARD',
          subtitle: 'Google Analytics 4 pageviews, reading depth, keyword rankings & conversion paths',
          badge: '🌐 Web Pages & Blog',
          syncLink: '/settings'
        };
      case 'social':
        return {
          title: 'SOCIAL MEDIA DASHBOARD',
          subtitle: 'Post virality, engagement rate, impressions & follower conversion across social streams',
          badge: '💬 Social Posts & Feeds',
          syncLink: '/social'
        };
      case 'newsletter':
        return {
          title: 'NEWSLETTER CHANNEL DASHBOARD',
          subtitle: 'Substack, Beehiiv & Medium readership, word count impact & subscriber conversions',
          badge: '✉️ Email Newsletters',
          syncLink: '/newsletter'
        };
      case 'youtube':
        return {
          title: 'YOUTUBE VIDEO DASHBOARD',
          subtitle: 'Video watch time, audience retention, Shorts vs Long-form duration analysis',
          badge: '🎬 YouTube Video Sync',
          syncLink: '/settings'
        };
      default:
        return {
          title: 'UNIFIED CONTENT PERFORMANCE',
          subtitle: 'Cross-platform resonance, topic conversion efficiency & format index across all channels',
          badge: '📊 Multi-Channel Portfolio',
          syncLink: '/settings'
        };
    }
  };

  const channelHeader = getChannelHeaderInfo(activeChannel);

  // Summary Metrics from data
  const summary = data.channelSummary || {
    totalViews: data.topics.reduce((acc, t) => acc + t.totalViews, 0),
    totalConversions: data.topics.reduce((acc, t) => acc + t.totalConversions, 0),
    conversionRate: 0,
    piecesCount: data.topItems?.length || 0,
    avgEngagement: 0.048,
    avgTime: 180,
    searchImpressions: 0,
    searchClicks: 0
  };

  const totalViews = summary.totalViews;
  const totalConversions = summary.totalConversions;
  const avgConversionRate = summary.conversionRate || (totalViews > 0 ? (totalConversions / totalViews) * 100 : 0);
  const totalPieces = summary.piecesCount || data.topics.reduce((acc, t) => acc + t.piecesCount, 0);

  // Sort topics by views for the trajectory resonance chart
  const sortedTopics = [...data.topics].sort((a, b) => b.totalViews - a.totalViews);
  const topTopics = sortedTopics.slice(0, 7);
  const maxTopicViews = topTopics.length > 0 ? Math.max(...topTopics.map(t => t.totalViews), 1) : 1;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* 1. Sync Status notification */}
      {syncStatus && (
        <div style={{ background: 'var(--color-primary-glow)', border: '1px solid var(--border-color)', padding: '12px 16px', borderRadius: '8px', fontSize: '13px' }}>
          {syncStatus}
        </div>
      )}

      {/* 2. Top Channel Switcher Bar */}
      <div style={{
        background: '#09090b',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '12px',
        padding: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        {/* Left: Channel Tabs */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#718096', padding: '0 10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Channel:
          </span>
          {channelTabs.map(tab => {
            const isSelected = activeChannel === tab.key;
            // Find count for this channel
            const matchingChan = data.availableChannels?.find(c => c.channel === tab.key);
            const countBadge = tab.key === 'all' 
              ? data.availableChannels?.reduce((acc, c) => acc + c.count, 0)
              : matchingChan?.count;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleSwitchChannel(tab.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  background: isSelected ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                  border: isSelected ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid transparent',
                  color: isSelected ? '#ffffff' : '#a0aec0',
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                    e.currentTarget.style.color = '#ffffff';
                  }
                }}
                onMouseLeave={e => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#a0aec0';
                  }
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {countBadge !== undefined && countBadge > 0 && (
                  <span style={{
                    fontSize: '10px',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    background: isSelected ? 'rgba(255,255,255,0.2)' : 'rgba(255, 255, 255, 0.06)',
                    color: isSelected ? '#ffffff' : '#718096',
                    fontWeight: 600
                  }}>
                    {countBadge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right: Actions */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button 
            onClick={handleSync} 
            disabled={syncing}
            style={{ 
              background: 'rgba(255,255,255,0.05)', 
              border: '1px solid rgba(255,255,255,0.1)', 
              borderRadius: '8px', 
              padding: '6px 14px', 
              fontSize: '12px', 
              color: '#ffffff', 
              cursor: 'pointer',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s' 
            }}
          >
            <span>{syncing ? '⟳' : '↻'}</span>
            <span>{syncing ? 'Syncing...' : 'Sync Data'}</span>
          </button>

          <Link href={channelHeader.syncLink} style={{ textDecoration: 'none' }}>
            <button
              style={{
                background: '#ffffff',
                color: '#000000',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span>+</span>
              <span>Add {activeChannel === 'all' ? 'Content' : activeChannel.toUpperCase()}</span>
            </button>
          </Link>
        </div>
      </div>

      {/* 3. Header Title & Context */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '3px 10px', borderRadius: '20px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#60a5fa', fontSize: '11px', fontWeight: 600, marginBottom: '8px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#60a5fa' }}></span>
            {channelHeader.badge}
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.5px', color: '#ffffff', margin: 0, fontFamily: 'var(--font-display)' }}>
            {channelHeader.title}
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginTop: '4px' }}>
            {channelHeader.subtitle}
          </p>
        </div>

        {loading && (
          <div style={{ color: '#60a5fa', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>⟳</span> Refreshing channel metrics...
          </div>
        )}
      </div>

      {/* 4. PERFORMANCE LAYOUT GRID */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px' }}>
        
        {/* Left Column: Engagement Overview + Conversion Stack */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Card 1: Channel Engagement Overview */}
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
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.05em', color: '#718096' }}>
                {activeChannel.toUpperCase()} REACH & ENGAGEMENT
              </span>
              <span style={{ fontSize: '11px', color: '#718096' }}>
                {totalPieces} content items
              </span>
            </div>

            {/* Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ display: 'inline-block', transform: 'rotate(-45deg)' }}>↑</span> Total Views / Reach
                </span>
                <div style={{ fontSize: '36px', fontWeight: 800, color: '#ffffff', marginTop: '4px', letterSpacing: '-0.5px' }}>
                  {formatK(totalViews)}
                </div>
                <span style={{ fontSize: '11px', color: '#718096', marginTop: '2px', display: 'block' }}>
                  {activeChannel === 'social' ? 'Social Impressions' : (activeChannel === 'newsletter' ? 'Newsletter Opens' : (activeChannel === 'youtube' ? 'Video Views' : 'Combined Streams'))}
                </span>
              </div>
              
              <div>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ display: 'inline-block', transform: 'rotate(135deg)' }}>⚡</span> Engagement Rate
                </span>
                <div style={{ fontSize: '36px', fontWeight: 800, color: '#ffffff', marginTop: '4px', letterSpacing: '-0.5px' }}>
                  {(summary.avgEngagement * 100).toFixed(1)}%
                </div>
                <span style={{ fontSize: '11px', color: '#718096', marginTop: '2px', display: 'block' }}>
                  {activeChannel === 'social' ? 'Likes / Comments / Reposts' : (activeChannel === 'newsletter' ? 'Click-Through Rate' : 'Audience Interaction')}
                </span>
              </div>
            </div>

            {/* Visual Vector Chart */}
            <div style={{ height: '80px', width: '100%', marginTop: '6px' }}>
              <svg viewBox="0 0 350 80" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                <path 
                  d="M 10 55 Q 60 25, 110 50 T 210 65 T 290 35 T 340 55" 
                  fill="none" 
                  stroke="#34d399" 
                  strokeWidth="2.5" 
                  strokeLinecap="round"
                />
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

          {/* Card 2: Conversion & Performance Stack */}
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
                {activeChannel.toUpperCase()} CONVERSIONS & TRAFFIC
              </span>
              <span style={{ color: '#718096', fontSize: '11px' }}>
                ${(totalConversions * 49).toLocaleString()} Est. Value
              </span>
            </div>

            {/* Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ display: 'inline-block', transform: 'rotate(-45deg)' }}>↑</span> Total Conversions
                </span>
                <div style={{ fontSize: '36px', fontWeight: 800, color: '#ffffff', marginTop: '4px', letterSpacing: '-0.5px' }}>
                  {totalConversions.toLocaleString()}
                </div>
                <span style={{ fontSize: '11px', color: '#718096', marginTop: '2px', display: 'block' }}>
                  Conv. Rate: {avgConversionRate.toFixed(2)}%
                </span>
              </div>
              
              <div>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  ⏱️ {activeChannel === 'web' ? 'Avg Time on Page' : (activeChannel === 'social' ? 'Active Posts' : 'Avg Reading Time')}
                </span>
                <div style={{ fontSize: '36px', fontWeight: 800, color: '#ffffff', marginTop: '4px', letterSpacing: '-0.5px' }}>
                  {activeChannel === 'social' ? totalPieces : `${Math.floor(summary.avgTime / 60)}m ${summary.avgTime % 60}s`}
                </div>
                <span style={{ fontSize: '11px', color: '#718096', marginTop: '2px', display: 'block' }}>
                  {activeChannel === 'web' ? 'GA4 Session Duration' : (activeChannel === 'social' ? 'Indexed in Feed' : 'Average Read Time')}
                </span>
              </div>
            </div>

            {/* Status Dots */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[1,2,3,4,5,6,7,8,9,10,11,12].map(i => {
                  let color = '#34d399';
                  if (i === 4 || i === 8) color = '#fbbf24';
                  if (i === 11 || i === 12) color = '#3f4e66';
                  return (
                    <span key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: color }} />
                  );
                })}
              </div>
            </div>

          </div>

        </div>

        {/* Right Column: Trajectory & Topic Resonance */}
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.05em', color: '#718096' }}>
              {activeChannel.toUpperCase()} TOPIC RESONANCE & CLUSTERS
            </span>
            <span style={{ color: '#718096', fontSize: '11px' }}>
              {data.topics.length} Clusters Tracked
            </span>
          </div>

          {/* List of resonance bars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
            
            {topTopics.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#718096', padding: '60px 0', fontSize: '13px' }}>
                No topic data imported for {activeChannel.toUpperCase()} yet. 
                <br />
                <Link href={channelHeader.syncLink} style={{ color: '#60a5fa', textDecoration: 'underline', marginTop: '8px', display: 'inline-block' }}>
                  Sync your {activeChannel.toUpperCase()} content now →
                </Link>
              </div>
            ) : (
              topTopics.map((topic, i) => {
                const widthPercent = maxTopicViews > 0 ? (topic.totalViews / maxTopicViews) * 90 : 50;
                
                let category: 'High' | 'Medium' | 'Low' = 'Low';
                let barBg = 'linear-gradient(90deg, #f3f4f6, #d1d5db)';
                let textColor = '#1f2937';

                if (topic.totalViews >= 10000) {
                  category = 'High';
                  barBg = 'linear-gradient(90deg, #a7f3d0, #34d399)';
                  textColor = '#065f46';
                } else if (topic.totalViews >= 2000) {
                  category = 'Medium';
                  barBg = 'linear-gradient(90deg, #fef3c7, #fbbf24)';
                  textColor = '#92400e';
                }

                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', height: '32px' }}>
                    <div style={{ width: '130px', fontSize: '12px', fontWeight: 600, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: '12px' }}>
                      {topic.topic}
                    </div>

                    <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                      <div style={{ 
                        height: '24px', 
                        width: `${Math.max(widthPercent, 28)}%`, 
                        background: barBg, 
                        borderRadius: '20px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        padding: '0 8px 0 10px',
                        boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.1)'
                      }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: textColor }}>
                          {formatK(topic.totalViews)}
                        </span>

                        <span style={{ 
                          fontSize: '9px', 
                          fontWeight: 800, 
                          color: textColor,
                          letterSpacing: '0.02em'
                        }}>
                          {category}
                        </span>
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
            paddingTop: '16px',
            marginTop: '16px',
            fontSize: '11px',
            color: '#718096'
          }}>
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

            <div>
              Total Topics: {data.topics.length}
            </div>
          </div>

        </div>

      </section>

      {/* 5. TOP CONTENT STREAM FOR ACTIVE CHANNEL */}
      {data.topItems && data.topItems.length > 0 && (
        <section className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', margin: 0, fontFamily: 'var(--font-display)' }}>
                Top Performing Content in {activeChannel.toUpperCase()}
              </h3>
              <p style={{ fontSize: '12px', color: '#718096', marginTop: '2px' }}>
                Ranked by total audience reach and conversions
              </p>
            </div>
            <Link href={channelHeader.syncLink} style={{ color: '#60a5fa', fontSize: '12px', textDecoration: 'none' }}>
              + Ingest New Piece →
            </Link>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: '#718096' }}>
                  <th style={{ padding: '10px 12px', fontWeight: 600 }}>CONTENT TITLE / URL</th>
                  <th style={{ padding: '10px 12px', fontWeight: 600 }}>CHANNEL</th>
                  <th style={{ padding: '10px 12px', fontWeight: 600 }}>TOPIC</th>
                  <th style={{ padding: '10px 12px', fontWeight: 600 }}>VIEWS</th>
                  <th style={{ padding: '10px 12px', fontWeight: 600 }}>ENGAGEMENT</th>
                  <th style={{ padding: '10px 12px', fontWeight: 600 }}>CONVERSIONS</th>
                  <th style={{ padding: '10px 12px', fontWeight: 600, textAlign: 'right' }}>DATE</th>
                </tr>
              </thead>
              <tbody>
                {data.topItems.map(item => (
                  <tr key={item.content_id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)' }}>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 600, color: '#ffffff', marginBottom: '2px' }}>
                        {item.title}
                      </div>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: '11px', color: '#60a5fa', textDecoration: 'none' }}
                      >
                        {item.author ? `${item.author} • ` : ''}{item.url.length > 50 ? `${item.url.substring(0, 50)}...` : item.url}
                      </a>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#e2e8f0',
                        fontSize: '11px',
                        textTransform: 'uppercase'
                      }}>
                        {item.channel}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: 'rgba(59, 130, 246, 0.1)',
                        border: '1px solid rgba(59, 130, 246, 0.2)',
                        color: '#60a5fa',
                        fontSize: '11px'
                      }}>
                        {item.topic || 'Uncategorized'}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontWeight: 700, color: '#ffffff' }}>
                      {item.views.toLocaleString()}
                    </td>
                    <td style={{ padding: '12px', color: '#34d399', fontWeight: 600 }}>
                      {(item.engagement_rate * 100).toFixed(1)}%
                    </td>
                    <td style={{ padding: '12px', color: '#a0aec0' }}>
                      {item.conversions.toLocaleString()}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#718096', fontSize: '12px' }}>
                      {item.publish_date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 6. EDITORIAL ACTION MATRIX */}
      <h3 style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.2px', color: '#ffffff', marginTop: '8px', fontFamily: 'var(--font-display)' }}>
        AI Editorial Strategy Recommendations ({activeChannel.toUpperCase()})
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
              All formats and topics in {activeChannel.toUpperCase()} are performing within target thresholds.
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
            CREATE (OPPORTUNITY GAPS)
          </div>
          {data.recommendations.filter(r => r.action === 'CREATE').length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '16px', lineHeight: '1.5' }}>
              No content gaps detected. Your coverage across topics is healthy!
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

      {/* 7. GSC CONTENT GAPS & FORMAT PERFORMANCE */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px' }}>
        
        {/* Organic Search Content Gaps */}
        <div style={{ background: '#09090b', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '24px', overflowX: 'auto' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', marginBottom: '4px', fontFamily: 'var(--font-display)' }}>Organic Search Content Gaps</h3>
          <p style={{ fontSize: '12px', color: '#718096', marginBottom: '20px' }}>
            GSC queries pulling impressions with high priority for {activeChannel.toUpperCase()}
          </p>

          {data.contentGaps.length === 0 ? (
            <p style={{ fontSize: '13px', color: '#718096', padding: '20px 0' }}>No search queries with uncaptured gaps found.</p>
          ) : (
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
          )}
        </div>

        {/* Format Performance */}
        <div style={{ background: '#09090b', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', marginBottom: '4px', fontFamily: 'var(--font-display)' }}>Format Performance Index</h3>
          <p style={{ fontSize: '12px', color: '#718096', marginBottom: '24px' }}>
            Percentile ranks comparing content success within {activeChannel.toUpperCase()}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {data.formats.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#718096', padding: '20px 0' }}>No format breakdowns available for this channel.</p>
            ) : (
              data.formats.map((f, i) => {
                const getPlatformDetails = (format: string) => {
                  switch (format.toLowerCase()) {
                    case 'video':
                      return { label: 'YouTube Video Sync', platform: 'YouTube Integration' };
                    case 'article':
                      return { label: 'Web Pages (GA4)', platform: 'Google Analytics 4' };
                    case 'newsletter':
                      return { label: 'Email Newsletter', platform: 'Substack / Medium' };
                    case 'social_post':
                      return { label: 'Social Feed Post', platform: 'Social Streams' };
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
              })
            )}
          </div>
        </div>

      </section>

    </div>
  );
}
