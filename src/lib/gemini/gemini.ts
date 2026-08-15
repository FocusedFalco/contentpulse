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

/**
 * Calls Gemini API or falls back to simulated narrative report tailored to a specific channel
 */
export async function generateEditorialReport(
  analysisData: StructuredAnalysisResult,
  channel: string = 'all'
): Promise<{ title: string; channel: string; narrative: string; isSimulated: boolean }> {
  const apiKey = process.env.GEMINI_API_KEY;
  const isSimulated = !apiKey;
  const selectedChannel = (channel || 'all').toLowerCase().trim();

  // Auto-migrate column if needed
  try {
    await query('ALTER TABLE reports ADD COLUMN IF NOT EXISTS channel VARCHAR(50) DEFAULT \'all\'');
  } catch (e) {
    // Ignore migration error
  }

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

  if (isSimulated) {
    // Generate a high-fidelity dynamic simulated report based on database results for this channel
    const narrative = generateSimulatedReportMarkdown(analysisData, selectedChannel);
    
    // Save report to database archive with channel
    await query(
      'INSERT INTO reports (title, channel, narrative, metrics_summary) VALUES ($1, $2, $3, $4)',
      [title, selectedChannel, narrative, JSON.stringify(analysisData)]
    );

    return { title, channel: selectedChannel, narrative, isSimulated: true };
  }

  // Live Gemini API call
  try {
    const prompt = buildEditorialPrompt(analysisData, selectedChannel);
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
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

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API returned status ${response.status}: ${errorText}`);
    }

    const json = await response.json();
    const narrative = json.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!narrative) {
      throw new Error('Gemini API returned an empty response.');
    }

    // Save report to database archive with channel
    await query(
      'INSERT INTO reports (title, channel, narrative, metrics_summary) VALUES ($1, $2, $3, $4)',
      [title, selectedChannel, narrative, JSON.stringify(analysisData)]
    );

    return { title, channel: selectedChannel, narrative, isSimulated: false };
  } catch (err: any) {
    console.error('Error generating report from Gemini API:', err);
    // Graceful fallback to simulated report if API call fails
    const narrative = `> [!WARNING]\n> Gemini API call failed: ${err?.message || String(err)}. Falling back to local analytical engine simulation.\n\n` +
      generateSimulatedReportMarkdown(analysisData, selectedChannel);
      
    await query(
      'INSERT INTO reports (title, channel, narrative, metrics_summary) VALUES ($1, $2, $3, $4)',
      [title, selectedChannel, narrative, JSON.stringify(analysisData)]
    );

    return { title, channel: selectedChannel, narrative, isSimulated: true };
  }
}

/**
 * Builds the prompt template for Gemini tailored to the active channel
 */
function buildEditorialPrompt(data: StructuredAnalysisResult, channel: string): string {
  const channelContextMap: Record<string, string> = {
    social: 'focusing exclusively on our Social Media channels (X/Twitter, LinkedIn, Instagram, Threads, and Bluesky). Analyze viral resonance, engagement hooks, post formats, and conversion mechanisms.',
    newsletter: 'focusing exclusively on our Email Newsletter and Publishing platforms (Substack, Beehiiv, Medium, Ghost). Analyze open rates, readership depth, optimal word count ranges, and subscriber conversion efficiency.',
    web: 'focusing exclusively on our Web Articles & Blog (Google Analytics 4 and Google Search Console). Analyze organic search queries, keyword gaps, average time on page, and traffic conversion funnels.',
    youtube: 'focusing exclusively on our YouTube Video Channel. Analyze video views, watch time retention, and Short-form vs Long-form performance index.',
    all: 'synthesizing cross-channel performance across Web, Social, Newsletter, and YouTube into a unified portfolio strategy.'
  };

  const channelContext = channelContextMap[channel] || channelContextMap.all;

  return `You are ContentPulse, an elite Editorial Strategist and Content Analytics AI. 
Analyze the following aggregated performance tables ${channelContext} from the last 90 days. 
Your goal is to synthesize these metrics into a premium, decision-ready editorial strategy report for a Content Director.

Here is the aggregated performance data for channel: ${channel.toUpperCase()}:

1. TOPICS PERFORMANCE (Aggregated views, conversions, and avg engagement for this channel):
${JSON.stringify(data.topics, null, 2)}

2. FORMAT PERFORMANCE (Normalized metrics relative within format group, sorted by average percentile rank):
${JSON.stringify(data.formats, null, 2)}

3. ARTICLE / CONTENT LENGTH ANALYSIS:
${JSON.stringify(data.lengthBuckets, null, 2)}

4. SEARCH & OPPORTUNITY GAPS:
${JSON.stringify(data.contentGaps, null, 2)}

5. PRE-CALCULATED CHANNEL RECOMMENDATIONS:
${JSON.stringify(data.recommendations, null, 2)}

6. CHANNEL SUMMARY KPIS:
${JSON.stringify(data.channelSummary, null, 2)}

---

Write a comprehensive, professional, markdown-formatted report containing the following sections:

# Executive Summary
Provide a high-level editorial narrative connecting what was published in ${channel.toUpperCase()} to what happened. Highlight the core takeaways, overall audience growth, and conversion highlights.

# Continue / Stop / Create Matrix (${channel.toUpperCase()})
For each action, detail 1-2 key items, incorporating the pre-calculated recommendations. Explain the "why" using the metrics (views, conversion rates, and percentiles).
- **Continue**: Focus on topic/format combinations in the top quartile of performance. Highlight conversion and engagement rates.
- **Stop**: Identify combinations underperforming consistently in this channel. Call out the conversion rates or engagement rates that justify stopping.
- **Create**: Prioritize high-opportunity gaps where we lack matching content or viral angles, and suggest specific content titles to produce.

# ${channel === 'social' ? 'Social Virality & Format Analysis' : (channel === 'newsletter' ? 'Newsletter Readership & Length Analysis' : (channel === 'youtube' ? 'Video Duration & Retention Analysis' : 'Content Depth & Diminishing Returns'))}
Explain the relationship between content structure (word count, video length, or post format) and audience engagement/conversions. Call out the optimal guidelines.

# Strategic Roadmap for ${channel.toUpperCase()}
Give 3 concrete next steps for the upcoming editorial cycle to double performance in this channel.

### Guidelines for Tone and Style:
- Keep the narrative crisp, punchy, and highly analytical.
- Do NOT just spit back the raw tables. Interpret the data as a seasoned editorial strategist.
- Use Github-flavored alert boxes like "> [!IMPORTANT]" or "> [!TIP]" for critical callouts.
- Include a closing sign-off from "ContentPulse ${channel.toUpperCase()} Strategy Engine".
`;
}

/**
 * Local simulation tailored by channel in case API key is missing
 */
function generateSimulatedReportMarkdown(data: StructuredAnalysisResult, channel: string): string {
  const topTopic = data.topics.find(t => t.isEligible && t.conversionRate > 1.2) || data.topics[0];
  const stopTopic = data.topics.find(t => t.conversionRate < 0.5 && t.totalViews > 100);
  const mainGap = data.contentGaps[0];
  const secondGap = data.contentGaps[1];

  const optimalLength = data.lengthBuckets.reduce((max, b) => 
    b.conversionRate > max.conversionRate ? b : max
  , data.lengthBuckets[0] || { avgTimeOnPage: 240, conversionRate: 2.1 });

  const summary = data.channelSummary || { totalViews: 12000, totalConversions: 240, conversionRate: 2.0, avgEngagement: 0.052, avgTime: 190 };

  if (channel === 'social') {
    return `# Executive Summary: Social Media Channel

Over the last 90 days, our **Social Media** channel has driven **${summary.totalViews.toLocaleString()} total impressions** across X/Twitter, LinkedIn, and Instagram, generating **${summary.totalConversions} direct user conversions** at an average engagement rate of **${(summary.avgEngagement * 100).toFixed(1)}%**.

Viral momentum is overwhelmingly concentrated in **hands-on technical breakdowns, architectural diagrams, and concise benchmarks**. Broad high-level thought leadership has experienced steep drop-offs in reposts and click-through rates.

---

# Continue / Stop / Create Matrix (Social)

### 🟢 CONTINUE: ${topTopic ? topTopic.topic : 'AI Engineering Breakdowns'}
* **Why:** This cluster is our single most viral asset on social channels, generating **${topTopic?.totalViews.toLocaleString() || '14,200'} impressions** with a standout **${(topTopic?.conversionRate || 3.2).toFixed(2)}% conversion rate**.
* **Action:** Publish 2-3 visual breakdown threads weekly. Pair every code snippet or diagram with a direct signup link in the replies.

### 🔴 STOP: ${stopTopic ? stopTopic.topic : 'Generic SaaS Growth Tips'}
* **Why:** Generated only **${(stopTopic?.conversionRate || 0.3).toFixed(2)}% conversions** with engagement falling below the 2.0% baseline.
* **Action:** Cease generic platitude posts. Reallocate creative time to data-backed benchmarks and case studies.

### 🔵 CREATE: High-Intent Visual Hooks
* **Why:** High social demand for reproducible agent workflows and open-weights benchmark comparisons.
* **Action:** Launch a weekly "Friday Tech Stack Teardown" series on X and LinkedIn.

---

# Social Virality & Format Analysis

* **Visual Diagrams & Code Carousels:** Generate 3.4x higher repost velocity than text-only posts.
* **Thread Openers:** First tweet with a bold quantifiable outcome achieves a 68% thread-completion rate.
* **Conversion Anchors:** Placing conversion links in the final conclusion card yields 2.8x higher CTR than in-line links.

> [!TIP]
> **Optimal Social Guideline:** Keep initial hook post under 180 characters with 1 embedded graphic, followed by a 4-5 tweet educational sequence.

---

# Strategic Roadmap for Social
1. **Double Down on Diagram Formats:** System architecture infographics drive 40% of all social conversions.
2. **Implement Automated Retweet Schedules:** Re-buffer top quartile posts at 7-day intervals during peak hours.
3. **Synergize with Newsletter:** Cross-promote deep-dive newsletter issues within high-performing social threads.

---
*Report compiled automatically by the **ContentPulse Social Strategy Engine**.*
`;
  }

  if (channel === 'newsletter') {
    return `# Executive Summary: Newsletter Channel

Over the last 90 days, our **Email Newsletter** channel has delivered **${summary.totalViews.toLocaleString()} total issue reads** across Substack and Beehiiv publications, achieving **${summary.totalConversions} subscriber conversions** with a conversion rate of **${summary.conversionRate.toFixed(2)}%**.

Readership depth metrics demonstrate strong loyalty among engineering and product readers. Deep technical editions demonstrate a **92% read-through rate**, significantly outperforming general industry news digests.

---

# Continue / Stop / Create Matrix (Newsletter)

### 🟢 CONTINUE: ${topTopic ? topTopic.topic : 'Deep-Dive Architecture Issues'}
* **Why:** Highest subscriber retention and conversion rate (**${(topTopic?.conversionRate || 3.8).toFixed(2)}%**), driving **${topTopic?.totalConversions || 85} paid conversions**.
* **Action:** Maintain bi-weekly deep dives. Introduce recurring "Behind the Architecture" issue formats.

### 🔴 STOP: ${stopTopic ? stopTopic.topic : 'Daily News Aggregation'}
* **Why:** Thin curation issues suffer from declining click-through rates and high unsubscribe ratios.
* **Action:** Eliminate daily roundups in favor of comprehensive, curated bi-weekly analyses.

### 🔵 CREATE: Actionable Implementation Blueprints
* **Why:** Subscribers actively request copy-pasteable architectural templates and step-by-step implementation code.
* **Action:** Introduce downloadable templates at the end of each long-form issue.

---

# Newsletter Readership & Length Analysis

Our word count distribution analysis highlights the optimal issue length:
* **Short Briefs (<600 words):** Quick scan time (~45s), but lower perceived value and modest 0.8% conversion.
* **Deep-Dive (1,200–2,000 words):** **The Editorial Sweet Spot**. Average read time exceeds 4 minutes with a peak **${(optimalLength?.conversionRate || 2.9).toFixed(2)}% conversion rate**.
* **Mega-Issues (2,500+ words):** Read completion rate begins to dip past the 2,200-word mark without additional conversion uplift.

> [!TIP]
> **Optimal Newsletter Guideline:** Standardize issues at **1,400 to 1,800 words** with clear subheadings, syntax-highlighted code blocks, and executive takeaways.

---

# Strategic Roadmap for Newsletter
1. **Launch Subscriber-Only Deep Dives:** Convert free readers with exclusive quarterly strategy briefs.
2. **Optimize Welcome Email Sequence:** Introduce a 3-part onboarding autoresponder highlighting top-read archive issues.
3. **Cross-Pollinate with Web Articles:** Syndicate top newsletter issues to web blog after a 7-day exclusive window.

---
*Report compiled automatically by the **ContentPulse Newsletter Strategy Engine**.*
`;
  }

  if (channel === 'youtube') {
    return `# Executive Summary: YouTube Video Channel

Over the last 90 days, our **YouTube Video Channel** has accumulated **${summary.totalViews.toLocaleString()} views**, delivering **${summary.totalConversions} conversions** across video tutorials, teardowns, and Shorts.

Audience retention data highlights strong engagement in tactical code walk-throughs and architecture breakdowns, while short-form vertical video serves as a high-volume top-of-funnel acquisition driver.

---

# Continue / Stop / Create Matrix (YouTube)

### 🟢 CONTINUE: Tactical Code Walkthroughs (16:9 Long-Form)
* **Why:** Average watch time exceeds 8.5 minutes, resulting in a **${(topTopic?.conversionRate || 2.4).toFixed(2)}% conversion rate**.
* **Action:** Maintain weekly 10-15 minute deep-dive tutorials with chapter markers and pinned resource links.

### 🔴 STOP: Unstructured Live Streams
* **Why:** Low retention past minute 4, generating high viewer drop-off and minimal conversion.
* **Action:** Replace unedited livestreams with tightly scripted, edited video essays.

### 🔵 CREATE: 60-Second Short-Form Coding Tips (9:16 Shorts)
* **Why:** Shorts provide rapid subscriber growth and top-of-funnel reach.
* **Action:** Clip 2-3 vertical Shorts from every long-form video tutorial.

---
*Report compiled automatically by the **ContentPulse YouTube Strategy Engine**.*
`;
  }

  // Default: Unified Portfolio Report
  return `# Executive Summary

Over the last 90 days, our cross-channel publishing engine generated **${summary.totalViews.toLocaleString()} unified views** and **${summary.totalConversions} conversions** across Web, Social, Newsletter, and YouTube.

A clear divergence exists between **AI Engineering and Technical Best Practices** (which drive disproportionate business conversions) and **SaaS Marketing Guides** (which fail to hit engagement and conversion benchmarks).

---

# Continue / Stop / Create Matrix (Unified Portfolio)

### 🟢 CONTINUE: ${topTopic ? topTopic.topic : 'AI Engineering Content'}
* **Why:** Single strongest conversion engine (**${(topTopic?.conversionRate || 2.8).toFixed(2)}% conversion rate**, **${topTopic?.totalConversions || 120} conversions**).
* **Action:** Double down across Web deep-dives and YouTube video breakdowns for maximum cross-channel synergy.

### 🔴 STOP: ${stopTopic ? stopTopic.topic : 'SaaS Marketing Content'}
* **Why:** Bottom quartile conversion rate of **${(stopTopic?.conversionRate || 0.2).toFixed(2)}%**.
* **Action:** Halt production of thin marketing guides and reallocate creative hours to high-intent technical documentation.

### 🔵 CREATE: Organic Search & Opportunity Gaps
* **Why:** High search impressions with zero matched content.
* **Action:** Prioritize:
  1. **"${mainGap?.query || 'how to fix nextjs server actions timeout'}"** (${mainGap?.impressions || 3800} impressions, Priority: ${mainGap?.priorityScore || 3700})
  2. **"${secondGap?.query || 'gemini-2.5-pro vs gemini-2.5-flash latency'}"** (${secondGap?.impressions || 5800} impressions, Priority: ${secondGap?.priorityScore || 5700})

---

# Content Depth & Diminishing Returns

* **Short-form (<600 words):** High bounce rates, average time-on-page ~70s.
* **Deep-dive (1200–2000 words):** **Optimal Peak** with average time-on-page of **${optimalLength?.avgTimeOnPage || 240}s** and peak conversion of **${(optimalLength?.conversionRate || 2.1).toFixed(2)}%**.
* **Mega-form (2000+ words):** Time-on-page remains high (~300s), but conversion rate flatlines (~1.8%).

> [!TIP]
> **Optimal Editorial Guideline:** Aim for **1,200 to 1,800 words** per written article.

---
*Report compiled automatically by the **ContentPulse Editorial Engine**.*
`;
}

/**
 * Classifies a title and description into one of our predefined content topics using Gemini
 */
export async function classifyTopicWithGemini(
  title: string,
  description: string
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  const fallbackTopic = 'General Content';

  let allowedTopics: string[] = [];
  try {
    const topicsRes = await query('SELECT topic FROM content_taxonomy');
    allowedTopics = topicsRes.rows.map(r => r.topic);
  } catch (err) {
    console.warn('Failed to query content_taxonomy table, using defaults:', err);
  }

  if (allowedTopics.length === 0) {
    allowedTopics = [
      'AI Engineering',
      'Next.js Best Practices',
      'SaaS Marketing',
      'Career in Tech',
      'Web Performance',
      'Entertainment',
      'Gaming',
      'Comedy & Humor',
      'Education & Science',
      'Tech Reviews',
      'Lifestyle & Vlogs',
      'Charity & Philanthropy',
      'General Entertainment',
      'Product Management',
      'Design & UX',
      'Finance & Investing',
      'Health & Wellness',
      'Travel & Culture',
      'Food & Culinary',
      'Music & Performing Arts',
      'Startups & Venture Capital',
      'Software Architecture',
      'Cloud Computing & DevOps'
    ];
  }

  const getFallbackTopic = () => {
    const text = (title + ' ' + description).toLowerCase();
    for (const topic of allowedTopics) {
      if (text.includes(topic.toLowerCase())) {
        return topic;
      }
    }
    if (/\b(next\.js|nextjs|vercel|react)\b/i.test(text)) {
      return 'Next.js Best Practices';
    } else if (/\b(ai|gemini|rag|llm|agent)\b/i.test(text)) {
      return 'AI Engineering';
    } else if (/\b(saas|marketing|seo|growth)\b/i.test(text)) {
      return 'SaaS Marketing';
    } else if (/\b(performance|speed|lighthouse)\b/i.test(text)) {
      return 'Web Performance';
    }
    return allowedTopics.includes('Career in Tech') ? 'Career in Tech' : (allowedTopics[0] || fallbackTopic);
  };

  if (!apiKey) {
    return getFallbackTopic();
  }

  try {
    const allowedListStr = allowedTopics.map(t => `- ${t}`).join('\n');
    const prompt = `You are a content taxonomy classifier. Categorize this piece of content into exactly ONE of the allowed categories based on its title and description. You MUST return ONLY the exact category name (no quotes, no extra words, no punctuation).

Allowed Categories:
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
            maxOutputTokens: 300,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API returned status ${response.status}`);
    }

    const json = await response.json();
    const result = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (result) {
      if (allowedTopics.includes(result)) {
        return result;
      }
      const cleanResult = result.replace(/[*#`"\.]/g, '').trim().toLowerCase();
      const exactCleanMatch = allowedTopics.find(t => t.toLowerCase() === cleanResult);
      if (exactCleanMatch) {
        return exactCleanMatch;
      }
      for (const topic of allowedTopics) {
        const cleanTopic = topic.toLowerCase();
        if (cleanResult.includes(cleanTopic) || (cleanResult.length >= 3 && cleanTopic.includes(cleanResult))) {
          return topic;
        }
      }
    }

    return getFallbackTopic();
  } catch (err) {
    console.warn('Gemini topic classification failed, falling back to local scanner:', err);
    return getFallbackTopic();
  }
}
