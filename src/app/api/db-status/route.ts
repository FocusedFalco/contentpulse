import { NextRequest, NextResponse } from 'next/server';
import { checkConnection, initializeDatabase } from '@/lib/db/db';

export async function GET() {
  const status = await checkConnection();
  return NextResponse.json({
    connected: status.connected,
    error: status.error,
    databaseUrlConfigured: !!process.env.DATABASE_URL
  });
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const forceReset = searchParams.get('reset') === 'true';
    const initResult = await initializeDatabase(forceReset);
    return NextResponse.json(initResult);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, log: `Server error: ${err?.message || String(err)}` },
      { status: 500 }
    );
  }
}
