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

export async function DELETE(req: NextRequest) {
  try {
    const { handle_name, channel, content_id } = await req.json();

    if (content_id) {
      await query('DELETE FROM content_items WHERE content_id = $1', [content_id]);
      return NextResponse.json({ success: true, message: `Deleted content item #${content_id}` });
    }

    if (handle_name) {
      let deleteSql = 'DELETE FROM content_items WHERE author = $1';
      const params: any[] = [handle_name];

      if (channel && channel !== 'all') {
        if (channel === 'social') {
          deleteSql += " AND LOWER(channel) IN ('social', 'youtube')";
        } else {
          deleteSql += ' AND LOWER(channel) = LOWER($2)';
          params.push(channel);
        }
      }

      const res = await query(deleteSql, params);
      return NextResponse.json({
        success: true,
        message: `Successfully disconnected and wiped ${res.rowCount || 0} items for handle "${handle_name}".`
      });
    }

    if (channel && channel !== 'all') {
      let channelDeleteSql = 'DELETE FROM content_items WHERE LOWER(channel) = LOWER($1)';
      if (channel === 'social') {
        channelDeleteSql = "DELETE FROM content_items WHERE LOWER(channel) IN ('social', 'youtube')";
      }
      const res = await query(channelDeleteSql, channel === 'social' ? [] : [channel]);
      return NextResponse.json({
        success: true,
        message: `Successfully wiped all ${channel} content (${res.rowCount || 0} items removed).`
      });
    }

    return NextResponse.json({ success: false, error: 'handle_name, content_id, or channel is required.' }, { status: 400 });
  } catch (err: any) {
    console.error('Error deleting channel items:', err);
    return NextResponse.json(
      { success: false, error: err?.message || String(err) },
      { status: 500 }
    );
  }
}
