import { NextRequest, NextResponse } from 'next/server';
import { runAnalysis } from '@/lib/analysis/analysis';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const channel = searchParams.get('channel') || 'all';
    const analysis = await runAnalysis(channel);
    return NextResponse.json(analysis);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: `Analysis failed: ${err?.message || String(err)}` },
      { status: 500 }
    );
  }
}
