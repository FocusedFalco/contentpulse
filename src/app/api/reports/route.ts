import { NextRequest, NextResponse } from 'next/server';
import { runAnalysis } from '@/lib/analysis/analysis';
import { generateEditorialReport } from '@/lib/gemini/gemini';
import { query } from '@/lib/db/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
      const res = await query(
        'SELECT id, created_at, title, narrative, metrics_summary FROM reports WHERE id = $1',
        [parseInt(id, 10)]
      );
      if (res.rows.length === 0) {
        return NextResponse.json({ error: 'Report not found' }, { status: 404 });
      }
      return NextResponse.json(res.rows[0]);
    }

    const res = await query(
      'SELECT id, created_at, title FROM reports ORDER BY created_at DESC'
    );
    return NextResponse.json(res.rows);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || String(err) },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    // 1. Run database metrics aggregation
    const analysisData = await runAnalysis();

    // 2. Call Gemini (or simulation fallback) to write narrative
    const report = await generateEditorialReport(analysisData);

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
