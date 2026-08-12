import { NextResponse } from 'next/server';
import { runAnalysis } from '@/lib/analysis/analysis';

export async function GET() {
  try {
    const analysis = await runAnalysis();
    return NextResponse.json(analysis);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: `Analysis failed: ${err?.message || String(err)}` },
      { status: 500 }
    );
  }
}
