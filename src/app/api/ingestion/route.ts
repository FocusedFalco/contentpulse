import { NextRequest, NextResponse } from 'next/server';
import { runFullIngestion } from '@/lib/ingestion/manager';
import { query } from '@/lib/db/db';

export async function GET() {
  try {
    const itemsCount = await query('SELECT COUNT(*) FROM content_items');
    const metricsCount = await query('SELECT COUNT(*) FROM content_metrics_daily');
    const gapsCount = await query('SELECT COUNT(*) FROM search_queries WHERE matched_content_id IS NULL');
    const latestMetric = await query('SELECT MAX(date) as max_date FROM content_metrics_daily');

    return NextResponse.json({
      success: true,
      summary: {
        totalContentItems: parseInt(itemsCount.rows[0].count, 10),
        totalDailyMetrics: parseInt(metricsCount.rows[0].count, 10),
        totalGapsDetected: parseInt(gapsCount.rows[0].count, 10),
        latestSyncDate: latestMetric.rows[0]?.max_date || null
      }
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || String(err) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const reset = searchParams.get('reset') === 'true';
    
    // In a real environment, we'd pull config credentials from database or request body
    const body = await req.json().catch(() => ({}));
    
    const result = await runFullIngestion(reset, body.config || {});
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, log: `Ingestion failed: ${err?.message || String(err)}` },
      { status: 500 }
    );
  }
}
