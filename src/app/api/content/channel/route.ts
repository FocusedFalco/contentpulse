import { NextRequest, NextResponse } from 'next/server';
import { query, checkConnection } from '@/lib/db/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const channel = searchParams.get('channel') || 'social';

    const conn = await checkConnection();
    if (!conn.connected) {
      return NextResponse.json({ success: true, items: [] });
    }

    const res = await query(
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
      WHERE LOWER(c.channel) = LOWER($1)
      GROUP BY c.content_id, c.title, c.channel, c.format, c.word_count, c.duration, c.publish_date, c.author, c.url, t.topic
      ORDER BY c.publish_date DESC, c.content_id DESC
      LIMIT 50`,
      [channel]
    );

    return NextResponse.json({
      success: true,
      items: res.rows
    });
  } catch (err: any) {
    console.error('Error fetching channel items:', err);
    return NextResponse.json(
      { success: false, error: err?.message || String(err), items: [] },
      { status: 500 }
    );
  }
}
