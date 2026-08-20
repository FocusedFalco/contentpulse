import { NextRequest, NextResponse } from 'next/server';
import { runAnalysis } from '@/lib/analysis/analysis';
import { generateEditorialReport } from '@/lib/gemini/gemini';
import { query } from '@/lib/db/db';
import { checkRateLimit, getClientIp } from '@/lib/security/rateLimiter';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const channel = searchParams.get('channel');

    // Auto-migrate column if needed
    try {
      await query('ALTER TABLE reports ADD COLUMN IF NOT EXISTS channel VARCHAR(50) DEFAULT \'all\'');
    } catch (e) {}

    if (id) {
      const res = await query(
        'SELECT id, created_at, title, channel, narrative, metrics_summary FROM reports WHERE id = $1',
        [parseInt(id, 10)]
      );
      if (res.rows.length === 0) {
        return NextResponse.json({ error: 'Report not found' }, { status: 404 });
      }
      return NextResponse.json(res.rows[0]);
    }

    let sql = 'SELECT id, created_at, title, COALESCE(channel, \'all\') as channel FROM reports';
    const params: any[] = [];

    if (channel && channel !== 'all') {
      sql += ' WHERE LOWER(COALESCE(channel, \'all\')) = LOWER($1)';
      params.push(channel);
    }

    sql += ' ORDER BY created_at DESC';

    const res = await query(sql, params);
    return NextResponse.json(res.rows);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || String(err) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);
    const rateLimit = checkRateLimit(`reports:${clientIp}`, 10, 60000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: `Report generation rate limit reached. Please wait ${rateLimit.retryAfterSec} seconds.` },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(req.url);
    let body: any = {};
    try {
      body = await req.json();
    } catch (e) {
      body = {};
    }

    const channel = (body.channel || searchParams.get('channel') || 'all').toLowerCase().trim();
    const provider = (body.provider || searchParams.get('provider') || 'auto').toLowerCase().trim();
    const model = body.model || searchParams.get('model');

    // 1. Run database metrics aggregation specifically for this channel
    const analysisData = await runAnalysis(channel);

    // 2. Call Bytez AI or Gemini (or simulation fallback) to write narrative tailored to this channel
    const report = await generateEditorialReport(analysisData, channel, {
      provider: provider as 'auto' | 'bytez' | 'gemini',
      modelId: model
    });

    return NextResponse.json({
      success: true,
      report
    });
  } catch (err: any) {
    console.error('Failed to generate report:', err);
    return NextResponse.json(
      { success: false, error: err?.message || String(err) },
      { status: 500 }
    );
  }
}
