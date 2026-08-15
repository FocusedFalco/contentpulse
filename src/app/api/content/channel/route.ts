import { NextRequest, NextResponse } from 'next/server';
import { query, checkConnection } from '@/lib/db/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const channel = (searchParams.get('channel') || 'social').toLowerCase();

    const conn = await checkConnection();
    if (!conn.connected) {
      return NextResponse.json({ success: true, handles: [], items: [] });
    }

    let whereClause = 'LOWER(c.channel) = LOWER($1)';
    const params: any[] = [channel];

    if (channel === 'social') {
      whereClause = "LOWER(c.channel) IN ('social', 'youtube')";
      params.pop();
    } else if (channel === 'all') {
      whereClause = '1=1';
      params.pop();
    }

    // 1. Group by Handle / Account / Creator
    const handlesRes = await query(
      `SELECT 
        COALESCE(NULLIF(c.author, ''), 'Connected Account') as handle_name,
        c.channel,
        MIN(c.url) as sample_url,
        COUNT(DISTINCT c.content_id)::int as items_count,
        COALESCE(SUM(m.views), 0)::int as total_views,
        COALESCE(SUM(m.conversions), 0)::int as total_conversions,
        COALESCE(AVG(m.engagement_rate), 0)::float as avg_engagement,
        MAX(c.publish_date) as last_synced
      FROM content_items c
      LEFT JOIN content_metrics_daily m ON c.content_id = m.content_id
      WHERE ${whereClause}
      GROUP BY COALESCE(NULLIF(c.author, ''), 'Connected Account'), c.channel
      ORDER BY total_views DESC`,
      params
    );

    // 2. Individual content items (for fallback/drilldown)
    const itemsRes = await query(
      `SELECT 
        c.content_id, 
        c.title, 
        c.channel, 
        c.format, 
        c.word_count, 
        c.duration, 
        c.publish_date, 
        c.author, 
        c.url,
        t.topic,
        COALESCE(SUM(m.views), 0)::int AS total_views,
        COALESCE(SUM(m.conversions), 0)::int AS total_conversions,
        COALESCE(AVG(m.engagement_rate), 0)::float AS avg_engagement
      FROM content_items c
      LEFT JOIN content_item_taxonomy t ON c.content_id = t.content_id
      LEFT JOIN content_metrics_daily m ON c.content_id = m.content_id
      WHERE ${whereClause}
      GROUP BY c.content_id, c.title, c.channel, c.format, c.word_count, c.duration, c.publish_date, c.author, c.url, t.topic
      ORDER BY c.publish_date DESC, c.content_id DESC
      LIMIT 100`,
      params
    );

    return NextResponse.json({
      success: true,
      handles: handlesRes.rows,
      items: itemsRes.rows
    });
  } catch (err: any) {
    console.error('Error fetching channel items:', err);
    return NextResponse.json(
      { success: false, error: err?.message || String(err), handles: [], items: [] },
      { status: 500 }
    );
  }
}
