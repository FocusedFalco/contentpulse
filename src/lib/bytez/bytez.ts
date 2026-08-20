/**
 * Bytez AI Client & Extraction Service
 * Provides access to open-source models (Qwen, DeepSeek, Llama) hosted on Bytez AI.
 */

export interface BytezChatResponse {
  error: string | null;
  output: any;
}

export async function callBytezModel(
  modelId: string,
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  options?: { maxTokens?: number; temperature?: number }
): Promise<string | null> {
  const apiKey = process.env.BYTEZ_API_KEY;
  if (!apiKey) {
    console.warn('BYTEZ_API_KEY is not configured in environment.');
    return null;
  }

  try {
    // 1. Try OpenAI-compatible Chat Completions endpoint on Bytez
    const res = await fetch('https://api.bytez.com/models/v2/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: modelId,
        messages,
        max_tokens: options?.maxTokens || 300,
        temperature: options?.temperature ?? 0.2
      })
    });

    if (res.ok) {
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) return content.trim();
    }

    // 2. Fallback to direct model inference endpoint
    const directRes = await fetch(`https://api.bytez.com/models/v2/${modelId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n'),
        params: {
          max_new_tokens: options?.maxTokens || 300,
          temperature: options?.temperature ?? 0.2
        }
      })
    });

    if (directRes.ok) {
      const directData = await directRes.json();
      if (directData.output && typeof directData.output === 'string') {
        return directData.output.trim();
      }
    }

    return null;
  } catch (error) {
    console.error(`Error calling Bytez model ${modelId}:`, error);
    return null;
  }
}

/**
 * Classify content taxonomy using Bytez (e.g. Qwen 2.5 or DeepSeek)
 */
export async function classifyTopicWithBytez(
  title: string,
  description: string,
  allowedTopics: string[],
  modelId: string = 'Qwen/Qwen2.5-72B-Instruct'
): Promise<string | null> {
  const allowedListStr = allowedTopics.map(t => `- ${t}`).join('\n');
  const prompt = `You are a high-precision content taxonomy classifier.
Categorize this content into the single most accurate category from the list below.
Return ONLY the category name and nothing else.

Categories:
${allowedListStr}

Title: "${title}"
Description: "${description}"

Category:`;

  const response = await callBytezModel(modelId, [
    { role: 'user', content: prompt }
  ], { maxTokens: 60, temperature: 0.1 });

  if (!response) return null;

  const clean = response.replace(/[*#`"\.]/g, '').trim();
  const matched = allowedTopics.find(t => t.toLowerCase() === clean.toLowerCase());
  return matched || (clean.length >= 3 && clean.length <= 40 ? clean : null);
}

/**
 * Generate comprehensive Editorial Strategy Report using Bytez AI (Qwen 2.5, DeepSeek, Llama)
 */
export async function generateEditorialReportWithBytez(
  analysisData: any,
  channel: string = 'all',
  modelId: string = 'Qwen/Qwen2.5-72B-Instruct'
): Promise<string | null> {
  const channelContext = channel.toUpperCase();
  const prompt = `You are the Lead Data-Driven Editorial Strategist and Executive Editor at ContentPulse.
Your task is to analyze aggregated multi-channel performance data for the "${channelContext}" channel and write an authoritative, decision-ready Editorial Strategy Report in Markdown.

Channel Context:
Channel Filter: ${channelContext}
Timeframe: ${analysisData.timeframe || 'Last 30 Days'}
Active Channels Monitored: ${(analysisData.availableChannels || []).map((c: any) => `${c.label} (${c.count} items, ${c.views?.toLocaleString?.() || c.views} views)`).join(', ')}

Channel Summary Metrics:
- Total Views / Reach: ${analysisData.channelSummary?.totalViews?.toLocaleString?.() || 0}
- Total Direct Conversions: ${analysisData.channelSummary?.totalConversions?.toLocaleString?.() || 0}
- Channel Conversion Rate: ${(analysisData.channelSummary?.conversionRate || 0).toFixed?.(2) || '0.00'}%
- Tracked Pieces: ${analysisData.channelSummary?.piecesCount || 0}
- Average Dwell / Watch Time: ${Math.round(analysisData.channelSummary?.avgTime || 0)}s

Topic Performance & Clusters:
${JSON.stringify(analysisData.topics || [], null, 2)}

Format Performance:
${JSON.stringify(analysisData.formats || [], null, 2)}

Length & Video Format Optimization:
${JSON.stringify({ articles: analysisData.lengthBuckets || [], video: analysisData.videoLengthBuckets || [] }, null, 2)}

Search & Content Gaps:
${JSON.stringify(analysisData.contentGaps || [], null, 2)}

Top Content Streams:
${JSON.stringify((analysisData.topItems || []).slice(0, 5), null, 2)}

REQUIREMENTS:
Write an authoritative, rigorous Markdown document with the following structure:
# ${channelContext} Editorial Performance & Strategy Report
## 1. Executive Summary
## 2. Topic Resonance & Audience Allocation
## 3. Format Efficiency & Distribution Dynamics
## 4. Content Gaps & Growth Opportunities
## 5. Strategic Recommendations & Action Matrix

End the report with:
---
*Report synthesized automatically by ContentPulse Bytez AI Engine (${modelId}).*
`;

  const narrative = await callBytezModel(
    modelId,
    [
      {
        role: 'system',
        content: 'You are an elite editorial strategist and analytics executive. You write detailed, analytical markdown reports backed by empirical numbers and strategic insight.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    { maxTokens: 4096, temperature: 0.3 }
  );

  return narrative;
}

