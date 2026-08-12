import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { checkConnection } from '@/lib/db/db';

export async function GET() {
  return NextResponse.json({
    databaseConfigured: !!process.env.DATABASE_URL,
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    slackConfigured: !!process.env.SLACK_WEBHOOK_URL,
    youtubeConfigured: !!process.env.YOUTUBE_API_KEY,
  });
}

export async function POST(req: NextRequest) {
  try {
    const { databaseUrl, geminiApiKey, slackWebhookUrl, youtubeApiKey } = await req.json();
    const envPath = path.join(process.cwd(), '.env.local');
    
    // Read existing file or default
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf-8');
    }

    const envMap: Record<string, string> = {};
    // Parse existing env
    envContent.split('\n').forEach(line => {
      const parts = line.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim().replace(/^"|"$/g, '');
        if (key) envMap[key] = value;
      }
    });

    // Update with new values
    if (databaseUrl !== undefined) envMap['DATABASE_URL'] = databaseUrl;
    if (geminiApiKey !== undefined) envMap['GEMINI_API_KEY'] = geminiApiKey;
    if (slackWebhookUrl !== undefined) envMap['SLACK_WEBHOOK_URL'] = slackWebhookUrl;
    if (youtubeApiKey !== undefined) envMap['YOUTUBE_API_KEY'] = youtubeApiKey;

    // Convert back to string
    const newEnvContent = Object.entries(envMap)
      .map(([key, val]) => `${key}="${val}"`)
      .join('\n') + '\n';

    // Write back
    fs.writeFileSync(envPath, newEnvContent, 'utf-8');

    // Also update runtime process.env values immediately so the current process has them
    if (databaseUrl) process.env.DATABASE_URL = databaseUrl;
    if (geminiApiKey) process.env.GEMINI_API_KEY = geminiApiKey;
    if (slackWebhookUrl) process.env.SLACK_WEBHOOK_URL = slackWebhookUrl;
    if (youtubeApiKey) process.env.YOUTUBE_API_KEY = youtubeApiKey;

    return NextResponse.json({
      success: true,
      message: 'Credentials saved successfully to .env.local! Note: In some environments, you might need to restart the npm run dev process for Next.js to fully pick up changes.'
    });

  } catch (err: any) {
    console.error('Failed to write .env.local:', err);
    return NextResponse.json({
      success: false,
      error: err?.message || String(err)
    }, { status: 500 });
  }
}
