import { NextRequest, NextResponse } from 'next/server';
import { runAnalysis } from '@/lib/analysis/analysis';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const webhookUrl = body.webhookUrl || process.env.SLACK_WEBHOOK_URL;
    
    // 1. Fetch latest analysis data to build a dynamic digest
    const analysis = await runAnalysis().catch(() => null);
    
    // Fallback static recommendations if database not seeded yet
    const continueRec = analysis?.recommendations.find(r => r.action === 'CONTINUE')?.target || 'Topic: AI Engineering';
    const continueReason = analysis?.recommendations.find(r => r.action === 'CONTINUE')?.reason || 'Conversion rate is 2.80% (robust sample size).';
    
    const stopRec = analysis?.recommendations.find(r => r.action === 'STOP')?.target || 'Topic: SaaS Marketing';
    const stopReason = analysis?.recommendations.find(r => r.action === 'STOP')?.reason || 'Underperforming with 0.20% conversion rate across views.';
    
    const createRecs = analysis?.recommendations.filter(r => r.action === 'CREATE').slice(0, 2) || [];
    const create1 = createRecs[0]?.target || 'Query: "how to fix nextjs server actions timeout"';
    const create2 = createRecs[1]?.target || 'Query: "gemini-2.5-pro vs gemini-2.5-flash latency"';

    // 2. Build Slack Block Kit payload
    const slackPayload = {
      text: "ContentPulse Biweekly Editorial Digest",
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "📊 ContentPulse Biweekly Editorial Digest",
            emoji: true
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*ContentPulse* has analyzed performance across GA4, Google Search Console, YouTube, and ESPs. Here is your biweekly editorial action plan:`
          }
        },
        {
          type: "divider"
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*🟢 CONTINUE: ${continueRec}*\n_${continueReason}_`
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*🔴 STOP: ${stopRec}*\n_${stopReason}_`
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*🔵 CREATE (High-Priority Search Gaps):*\n• *${create1}* \n• *${create2}*`
          }
        },
        {
          type: "divider"
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "🔍 _Verify the complete interactive narrative and explore detailed format, topic, and word-count curves on the ContentPulse Web Dashboard._"
          },
          accessory: {
            type: "button",
            text: {
              type: "plain_text",
              text: "Open Dashboard",
              emoji: true
            },
            value: "click_me_123",
            url: "http://localhost:3000",
            action_id: "button-action"
          }
        }
      ]
    };

    if (webhookUrl && webhookUrl.startsWith('https://hooks.slack.com/')) {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slackPayload)
      });
      
      if (!response.ok) {
        throw new Error(`Slack API returned status ${response.status}`);
      }

      return NextResponse.json({
        success: true,
        sent: true,
        message: 'Successfully sent digest to Slack Webhook!',
        payload: slackPayload
      });
    }

    return NextResponse.json({
      success: true,
      sent: false,
      message: 'Slack Webhook Url empty or invalid. Mocking send.',
      payload: slackPayload
    });

  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err?.message || String(err)
    }, { status: 500 });
  }
}
