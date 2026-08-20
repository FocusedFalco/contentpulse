import { StructuredAnalysisResult, Recommendation } from '../analysis/analysis';
import { query } from '../db/db';

export interface ReportRecord {
  id: number;
  created_at: string;
  title: string;
  channel: string;
  narrative: string;
  metrics_summary: any;
}

export const MASTER_TAXONOMY_TOPICS = [
  // Entertainment & Media
  'Entertainment & Challenges',
  'Drama & Storytelling',
  'Comedy & Humor',
  'Gaming & Esports',
  'Movies & TV Shows',
  'Music & Performing Arts',
  'Animation & Anime',
  'Celebrity & Pop Culture',
  
  // Sports & Fitness
  'Sports & Athletics',
  'Fitness & Bodybuilding',
  'Extreme Sports & Outdoors',
  'Martial Arts & Combat Sports',
  'Automotive & Motorsports',

  // Lifestyle & Creators
  'Lifestyle & Vlogs',
  'Travel & Adventure',
  'Food & Culinary',
  'Fashion & Beauty',
  'Charity & Philanthropy',
  'DIY & Home Improvement',
  'Health & Wellness',

  // Tech, AI & Engineering
  'AI Engineering',
  'Tech Reviews & Gadgets',
  'Software Engineering',
  'Next.js Best Practices',
  'Web Performance',
  'Cloud & DevOps',
  'Science & Space',
  'Education & Learning',

  // Business & News
  'Business & Startups',
  'Finance & Investing',
  'SaaS Marketing',
  'Career & Professional Growth',
  'News & Current Affairs',
  'General Content'
];

/**
 * Ensures comprehensive taxonomy categories exist in the database
 */
export async function ensureExpandedTaxonomy(): Promise<string[]> {
  try {
    const valuesList = MASTER_TAXONOMY_TOPICS.map((_, i) => `($${i + 1})`).join(', ');
    await query(
      `INSERT INTO content_taxonomy (topic) VALUES ${valuesList} ON CONFLICT (topic) DO NOTHING`,
      MASTER_TAXONOMY_TOPICS
    );

    const res = await query('SELECT topic FROM content_taxonomy ORDER BY topic ASC');
    return res.rows.map(r => r.topic);
  } catch (err) {
    console.warn('Failed to sync master taxonomy, using default list:', err);
    return MASTER_TAXONOMY_TOPICS;
  }
}

/**
 * Calls Gemini API or falls back to simulated narrative report tailored to a specific channel
 */
export async function generateEditorialReport(
  analysisData: StructuredAnalysisResult,
  channel: string = 'all',
  options?: { provider?: 'auto' | 'bytez' | 'gemini'; modelId?: string }
): Promise<{ title: string; channel: string; narrative: string; isSimulated: boolean; engine?: string }> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const bytezKey = process.env.BYTEZ_API_KEY;
  const provider = (options?.provider || 'auto').toLowerCase();
  const selectedChannel = (channel || 'all').toLowerCase().trim();

  try {
    await query('ALTER TABLE reports ADD COLUMN IF NOT EXISTS channel VARCHAR(50) DEFAULT \'all\'');
  } catch (e) {}

  const dateRange = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  
  const getChannelTitle = (ch: string) => {
    switch (ch) {
      case 'social':
        return `Social Media Virality & Engagement Report - ${dateRange}`;
      case 'newsletter':
        return `Newsletter Readership & Conversion Report - ${dateRange}`;
      case 'web':
        return `Web Strategy & Organic Growth Report - ${dateRange}`;
      case 'youtube':
        return `YouTube Video & Shorts Performance Report - ${dateRange}`;
      default:
        return `Unified Editorial Strategy Report - ${dateRange}`;
    }
  };

  const title = getChannelTitle(selectedChannel);

  // 1. Try Bytez AI if explicitly requested or if auto and configured
  if ((provider === 'bytez' || (provider === 'auto' && bytezKey)) && bytezKey) {
    try {
      const { generateEditorialReportWithBytez } = await import('../bytez/bytez');
      const modelId = options?.modelId || 'Qwen/Qwen2.5-72B-Instruct';
      console.log(`Generating editorial report with Bytez AI (${modelId})...`);
      const bytezNarrative = await generateEditorialReportWithBytez(analysisData, selectedChannel, modelId);
      
      if (bytezNarrative && bytezNarrative.length > 100) {
        await query(
          'INSERT INTO reports (title, channel, narrative, metrics_summary) VALUES ($1, $2, $3, $4)',
          [title, selectedChannel, bytezNarrative, JSON.stringify(analysisData)]
        );
        return { title, channel: selectedChannel, narrative: bytezNarrative, isSimulated: false, engine: `Bytez AI (${modelId.split('/').pop()})` };
      }
    } catch (bytezErr) {
      console.warn('Bytez report generation fallback:', bytezErr);
      if (provider === 'bytez' && !geminiKey) {
        // Fallback to simulated if only Bytez was requested and no Gemini
      }
    }
  }

  // 2. Try Gemini API
  if (geminiKey && provider !== 'bytez') {
    try {
      const prompt = buildEditorialPrompt(analysisData, selectedChannel);
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 8192,
            },
          }),
        }
      );

      if (response.ok) {
        const json = await response.json();
        const narrative = json.candidates?.[0]?.content?.parts?.[0]?.text;

        if (narrative) {
          await query(
            'INSERT INTO reports (title, channel, narrative, metrics_summary) VALUES ($1, $2, $3, $4)',
            [title, selectedChannel, narrative, JSON.stringify(analysisData)]
          );
          return { title, channel: selectedChannel, narrative, isSimulated: false, engine: 'Google Gemini' };
        }
      } else {
        const errorText = await response.text();
        console.warn(`Gemini API returned status ${response.status}: ${errorText}`);
      }
    } catch (geminiErr) {
      console.warn('Gemini report generation error:', geminiErr);
    }
  }

  // 3. Fallback to dynamic simulated report
  const narrative = generateSimulatedReportMarkdown(analysisData, selectedChannel);
  await query(
    'INSERT INTO reports (title, channel, narrative, metrics_summary) VALUES ($1, $2, $3, $4)',
    [title, selectedChannel, narrative, JSON.stringify(analysisData)]
  );
  return { title, channel: selectedChannel, narrative, isSimulated: true, engine: 'Simulation Engine' };
}

/**
 * Builds the customized prompt for Gemini based on channel
 */
function buildEditorialPrompt(data: StructuredAnalysisResult, channel: string): string {
  const channelContext = channel.toUpperCase();
  return `You are the Lead Data-Driven Editorial Strategist and Executive Editor at ContentPulse.
Your task is to analyze aggregated multi-channel performance data for the "${channelContext}" channel and write a decision-ready Editorial Strategy Report in Markdown.

Channel Context:
Channel Filter: ${channelContext}
Timeframe: ${data.timeframe}
Active Channels Monitored: ${data.availableChannels.map(c => `${c.label} (${c.count} items, ${c.views.toLocaleString()} views)`).join(', ')}

Channel Summary Metrics:
- Total Views / Reach: ${data.channelSummary.totalViews.toLocaleString()}
- Total Direct Conversions: ${data.channelSummary.totalConversions.toLocaleString()}
- Channel Conversion Rate: ${data.channelSummary.conversionRate.toFixed(2)}%
- Tracked Pieces: ${data.channelSummary.piecesCount}
- Average Dwell / Watch Time: ${Math.round(data.channelSummary.avgTime)}s

Topic Performance & Clusters:
${JSON.stringify(data.topics, null, 2)}

Format Performance:
${JSON.stringify(data.formats, null, 2)}

Length & Video Format Optimization:
${JSON.stringify({ articles: data.lengthBuckets, video: data.videoLengthBuckets }, null, 2)}

Search & Content Gaps:
${JSON.stringify(data.contentGaps, null, 2)}

Top Content Streams:
${JSON.stringify(data.topItems.slice(0, 5), null, 2)}

REQUIREMENTS:
Write an authoritative, rigorous Markdown document with:
# ${channelContext} Editorial Performance & Strategy Report
## 1. Executive Summary
## 2. Topic Resonance & Audience Allocation
## 3. Format Efficiency & Distribution Dynamics
## 4. Content Gaps & Growth Opportunities
## 5. Strategic Recommendations & Action Matrix
`;
}

/**
 * Dynamic simulated report markdown generator
 */
function generateSimulatedReportMarkdown(data: StructuredAnalysisResult, channel: string): string {
  const ch = channel.toUpperCase();
  const summary = data.channelSummary;
  const topTopics = data.topics.filter(t => t.isEligible).slice(0, 3);
  const gaps = data.contentGaps.slice(0, 3);

  return `# ${ch} Editorial Strategy & Performance Report

## 1. Executive Summary
During this active tracking cycle across the **${ch}** stream, ContentPulse indexed **${summary.piecesCount} content assets**, generating **${summary.totalViews.toLocaleString()} views** and **${summary.totalConversions.toLocaleString()} direct conversions** (${summary.conversionRate.toFixed(2)}% conversion rate).

> [!NOTE]
> Performance data aggregated directly from PostgreSQL metrics tables. Recency-weighted scoring applied.

## 2. Topic Resonance & Audience Allocation
${topTopics.map(t => `- **${t.topic}**: ${t.totalViews.toLocaleString()} views, ${t.totalConversions} conversions (${t.conversionRate.toFixed(2)}% conversion rate).`).join('\n')}

## 3. High-Leverage Strategic Directives
1. **Scale High-Resonance Formats**: Prioritize formats with above-median engagement and watch/dwell times.
2. **Capture Opportunity Queries**: Develop matching content for unaddressed high-impression queries.
3. **Cross-Channel Synergies**: Distribute top-performing hooks into short-form videos and newsletters.

---
*Report generated automatically by ContentPulse Gemini Editorial Engine.*`;
}

/**
 * Classifies content into expanded taxonomy categories (Entertainment, Sports, Drama, Tech, etc.)
 */
export async function classifyTopicWithGemini(
  title: string,
  description: string
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  const bytezKey = process.env.BYTEZ_API_KEY;
  const allowedTopics = await ensureExpandedTaxonomy();

  // 1. Try Bytez AI (Qwen 2.5 / DeepSeek) if configured
  if (bytezKey) {
    try {
      const { classifyTopicWithBytez } = await import('../bytez/bytez');
      const bytezResult = await classifyTopicWithBytez(title, description, allowedTopics);
      if (bytezResult) {
        return bytezResult;
      }
    } catch (e) {
      console.warn('Bytez classification fallback:', e);
    }
  }

  const getFallbackTopic = () => {
    const text = (title + ' ' + description).toLowerCase();

    // 1. Charity & Philanthropy
    if (/\b(surgery|blind|cure|africa|clinic|clinics|lives|philanthropy|charity|donate|rescue|slaves|hospital|water|wells|trees|ocean)\b/i.test(text)) {
      return 'Charity & Philanthropy';
    }

    // 2. Entertainment & Challenges
    if (/\b(beast|challenge|survive|trapping|youtubers|albertsons|hours|escape|circle|last to|island|million|bounty|game show|stunt)\b/i.test(text)) {
      return 'Entertainment & Challenges';
    }

    // 3. Drama & Storytelling
    if (/\b(drama|story|exposed|confession|mystery|investigation|truth|scandal|documentary|narrative)\b/i.test(text)) {
      return 'Drama & Storytelling';
    }

    // 4. Comedy & Humor
    if (/\b(comedy|funny|prank|meme|memes|sketch|joke|parody|roast|laugh)\b/i.test(text)) {
      return 'Comedy & Humor';
    }

    // 5. Gaming & Esports
    if (/\b(gaming|gameplay|minecraft|gta|roblox|fortnite|esports|speedrun|twitch|streamer|playthrough|elden ring)\b/i.test(text)) {
      return 'Gaming & Esports';
    }

    // 6. Sports & Athletics
    if (/\b(sports|football|soccer|basketball|nba|nfl|cricket|f1|formula 1|racing|boxing|ufc|mma|athletics|championship|match|goal|olympics)\b/i.test(text)) {
      return 'Sports & Athletics';
    }

    // 7. Fitness & Bodybuilding
    if (/\b(fitness|workout|gym|bodybuilding|muscle|diet|protein|exercise|calisthenics)\b/i.test(text)) {
      return 'Fitness & Bodybuilding';
    }

    // 8. Movies, Music & Pop Culture
    if (/\b(movie|film|trailer|cinema|music|song|album|concert|singer|rapper|celebrity|hollywood|anime|manga)\b/i.test(text)) {
      return 'Movies & TV Shows';
    }

    // 9. Tech, AI & Software Engineering
    if (/\b(ai|llm|gemini|gpt|openai|machine learning|agent|rag|rag pipeline)\b/i.test(text)) {
      return 'AI Engineering';
    }
    if (/\b(next\.js|nextjs|vercel|react|javascript|typescript|tailwind|css|frontend)\b/i.test(text)) {
      return 'Next.js Best Practices';
    }
    if (/\b(postgres|sql|backend|api|database|cloud|devops|docker|kubernetes|aws)\b/i.test(text)) {
      return 'Software Engineering';
    }

    // 10. Business & Marketing
    if (/\b(saas|marketing|seo|growth|conversion|leads|b2b|ads)\b/i.test(text)) {
      return 'SaaS Marketing';
    }
    if (/\b(startup|startups|venture capital|founder|investing|finance|crypto|stocks)\b/i.test(text)) {
      return 'Business & Startups';
    }

    // Direct match against any allowed topic
    for (const topic of allowedTopics) {
      if (text.includes(topic.toLowerCase())) {
        return topic;
      }
    }

    return 'Entertainment & Challenges';
  };

  if (!apiKey) {
    return getFallbackTopic();
  }

  try {
    const allowedListStr = allowedTopics.map(t => `- ${t}`).join('\n');
    const prompt = `You are a content taxonomy classifier. Categorize this content into the single most accurate category from the list below, or return an appropriate short category name (2-3 words).
Return ONLY the category name.

Categories:
${allowedListStr}

Content Title: "${title}"
Content Description: "${description}"

Category:`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 100,
          },
        }),
      }
    );

    if (!response.ok) {
      return getFallbackTopic();
    }

    const json = await response.json();
    const result = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (result) {
      const cleanResult = result.replace(/[*#`"\.]/g, '').trim();
      const exactMatch = allowedTopics.find(t => t.toLowerCase() === cleanResult.toLowerCase());
      if (exactMatch) {
        return exactMatch;
      }

      // If it's a new valid topic from Gemini, save it to taxonomy table dynamically
      if (cleanResult.length >= 3 && cleanResult.length <= 40) {
        try {
          await query('INSERT INTO content_taxonomy (topic) VALUES ($1) ON CONFLICT DO NOTHING', [cleanResult]);
          return cleanResult;
        } catch (e) {}
      }
    }

    return getFallbackTopic();
  } catch (err) {
    return getFallbackTopic();
  }
}
