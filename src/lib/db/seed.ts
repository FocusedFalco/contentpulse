import { query } from './db';

export async function seedDatabase(): Promise<{ success: boolean; log: string }> {
  let log = 'Starting database seeding...\n';
  try {
    // 1. Clean existing data (in order of dependencies)
    log += 'Clearing existing database tables...\n';
    await query('TRUNCATE TABLE content_segment_metrics_daily, content_metrics_daily, content_item_taxonomy, content_taxonomy, search_queries, audience_segments, content_items, reports RESTART IDENTITY CASCADE');

    // 2. Insert Audience Segments
    log += 'Inserting audience segments...\n';
    const segments = [
      { id: 'new_users', name: 'New Visitors', definition: 'Users who visit for the first time' },
      { id: 'returning_users', name: 'Returning Visitors', definition: 'Users who have visited at least once before' },
      { id: 'enterprise_leads', name: 'Enterprise Leads', definition: 'Visitors from corporate networks or matching business domains' }
    ];
    for (const seg of segments) {
      await query(
        'INSERT INTO audience_segments (segment_id, name, definition) VALUES ($1, $2, $3)',
        [seg.id, seg.name, seg.definition]
      );
    }

    // 3. Insert Topics/Taxonomy
    log += 'Inserting content taxonomy topics...\n';
    const topics = [
      { topic: 'AI Engineering', parent: 'Technology', firstPub: '2026-02-15' },
      { topic: 'Next.js Best Practices', parent: 'Web Development', firstPub: '2026-03-01' },
      { topic: 'SaaS Marketing', parent: 'Business', firstPub: '2026-01-10' },
      { topic: 'Web Performance', parent: 'Web Development', firstPub: '2026-04-12' },
      { topic: 'Career in Tech', parent: 'Career', firstPub: '2026-02-01' },
      { topic: 'Entertainment', parent: 'Entertainment', firstPub: '2026-01-05' },
      { topic: 'Gaming', parent: 'Entertainment', firstPub: '2026-01-12' },
      { topic: 'Comedy & Humor', parent: 'Entertainment', firstPub: '2026-02-20' },
      { topic: 'Education & Science', parent: 'Education', firstPub: '2026-03-10' },
      { topic: 'Tech Reviews', parent: 'Technology', firstPub: '2026-02-18' },
      { topic: 'Lifestyle & Vlogs', parent: 'Lifestyle', firstPub: '2026-01-25' },
      { topic: 'Charity & Philanthropy', parent: 'General', firstPub: '2026-03-05' },
      { topic: 'General Entertainment', parent: 'Entertainment', firstPub: '2026-01-01' },
      { topic: 'Product Management', parent: 'Business', firstPub: '2026-04-01' },
      { topic: 'Design & UX', parent: 'Technology', firstPub: '2026-03-15' },
      { topic: 'Finance & Investing', parent: 'Business', firstPub: '2026-02-22' },
      { topic: 'Health & Wellness', parent: 'Lifestyle', firstPub: '2026-01-30' },
      { topic: 'Travel & Culture', parent: 'Lifestyle', firstPub: '2026-04-05' },
      { topic: 'Food & Culinary', parent: 'Lifestyle', firstPub: '2026-02-28' },
      { topic: 'Music & Performing Arts', parent: 'Entertainment', firstPub: '2026-03-20' },
      { topic: 'Startups & Venture Capital', parent: 'Business', firstPub: '2026-01-15' },
      { topic: 'Software Architecture', parent: 'Technology', firstPub: '2026-02-10' },
      { topic: 'Cloud Computing & DevOps', parent: 'Technology', firstPub: '2026-03-25' }
    ];
    for (const t of topics) {
      await query(
        'INSERT INTO content_taxonomy (topic, parent_category, first_published) VALUES ($1, $2, $3)',
        [t.topic, t.parent, t.firstPub]
      );
    }

    // 4. Create Content Items (90 days history)
    log += 'Inserting content items...\n';
    const contentList = [
      // AI Engineering
      { title: 'Building a RAG Pipeline with Gemini Flash 2.5', channel: 'web', format: 'article', words: 1850, duration: null, date: '2026-05-10', author: 'Sarah Chen', url: 'https://contentpulse.ai/blog/rag-pipeline-gemini-flash' },
      { title: 'Structured Outputs in LLMs: Schema Enforcement Guide', channel: 'web', format: 'article', words: 2400, duration: null, date: '2026-06-02', author: 'Sarah Chen', url: 'https://contentpulse.ai/blog/structured-outputs-llms' },
      { title: 'Video: Deploying AI Agents with Vercel AI SDK', channel: 'youtube', format: 'video', words: null, duration: 920, date: '2026-06-15', author: 'Sarah Chen', url: 'https://youtube.com/watch?v=ai-agents-vercel' },
      { title: 'Newsletter: Why Agentic AI is Replacing Chatbots', channel: 'newsletter', format: 'newsletter', words: 950, duration: null, date: '2026-07-01', author: 'Sarah Chen', url: 'https://contentpulse.ai/newsletter/agentic-ai-shift' },
      { title: 'Social: My RAG Pipeline diagram went viral', channel: 'social', format: 'social_post', words: 120, duration: null, date: '2026-07-15', author: 'Sarah Chen', url: 'https://x.com/sarahchen/status/rag-viral' },
      { title: 'Fine-Tuning Gemini for Domain-Specific Code Generation', channel: 'web', format: 'article', words: 2800, duration: null, date: '2026-07-20', author: 'Sarah Chen', url: 'https://contentpulse.ai/blog/fine-tuning-gemini' },

      // Next.js Best Practices
      { title: 'Next.js 15 Server Actions: A Secure Design Pattern', channel: 'web', format: 'article', words: 1550, duration: null, date: '2026-05-18', author: 'Marcus Aurelius', url: 'https://contentpulse.ai/blog/nextjs-15-server-actions' },
      { title: 'Partial Prerendering (PPR) in Production: Lessons Learned', channel: 'web', format: 'article', words: 2100, duration: null, date: '2026-06-10', author: 'Marcus Aurelius', url: 'https://contentpulse.ai/blog/ppr-in-production' },
      { title: 'Video: How Next.js App Router Caches Data (Explained Simply)', channel: 'youtube', format: 'video', words: null, duration: 1140, date: '2026-06-25', author: 'Marcus Aurelius', url: 'https://youtube.com/watch?v=nextjs-cache' },
      { title: 'Newsletter: Next.js Server Components vs Client Components', channel: 'newsletter', format: 'newsletter', words: 800, duration: null, date: '2026-07-10', author: 'Marcus Aurelius', url: 'https://contentpulse.ai/newsletter/nextjs-components' },

      // SaaS Marketing (Low performer / Stop candidate)
      { title: '10 SaaS Pitch Deck Examples that Raised Millions', channel: 'web', format: 'article', words: 580, duration: null, date: '2026-05-05', author: 'Elena Rostova', url: 'https://contentpulse.ai/blog/saas-pitch-deck-examples' },
      { title: 'How to Write a SaaS Landing Page Copy that Converts', channel: 'web', format: 'article', words: 710, duration: null, date: '2026-06-01', author: 'Elena Rostova', url: 'https://contentpulse.ai/blog/saas-landing-page-copy' },
      { title: 'Newsletter: SaaS Cold Email Outbound Strategies', channel: 'newsletter', format: 'newsletter', words: 620, duration: null, date: '2026-06-20', author: 'Elena Rostova', url: 'https://contentpulse.ai/newsletter/saas-cold-email' },
      { title: 'Video: The Death of SEO in SaaS Marketing', channel: 'youtube', format: 'video', words: null, duration: 420, date: '2026-07-02', author: 'Elena Rostova', url: 'https://youtube.com/watch?v=death-of-seo-saas' },

      // Career in Tech
      { title: 'From Junior to Tech Lead: A Practical Checklist', channel: 'web', format: 'article', words: 1300, duration: null, date: '2026-05-15', author: 'Devon Cole', url: 'https://contentpulse.ai/blog/junior-to-tech-lead-guide' },
      { title: 'How to Negotiate Your Software Engineer Salary in 2026', channel: 'web', format: 'article', words: 1750, duration: null, date: '2026-06-08', author: 'Devon Cole', url: 'https://contentpulse.ai/blog/negotiating-salary-2026' },
      { title: 'Newsletter: Managing Technical Debt in Small Teams', channel: 'newsletter', format: 'newsletter', words: 750, duration: null, date: '2026-07-05', author: 'Devon Cole', url: 'https://contentpulse.ai/newsletter/tech-debt-management' }
    ];

    const insertedContent: any[] = [];
    for (const item of contentList) {
      const res = await query(
        `INSERT INTO content_items (title, channel, format, word_count, duration, publish_date, author, url) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING content_id, title, publish_date`,
        [item.title, item.channel, item.format, item.words, item.duration, item.date, item.author, item.url]
      );
      insertedContent.push({
        id: res.rows[0].content_id,
        title: res.rows[0].title,
        publishDate: new Date(res.rows[0].publish_date),
        format: item.format,
        channel: item.channel
      });
    }

    // Insert Taxonomy mappings
    log += 'Mapping topics to content items...\n';
    const tagMappings = [
      { idIdx: 0, topic: 'AI Engineering' },
      { idIdx: 1, topic: 'AI Engineering' },
      { idIdx: 2, topic: 'AI Engineering' },
      { idIdx: 3, topic: 'AI Engineering' },
      { idIdx: 4, topic: 'AI Engineering' },
      { idIdx: 5, topic: 'AI Engineering' },
      
      { idIdx: 6, topic: 'Next.js Best Practices' },
      { idIdx: 7, topic: 'Next.js Best Practices' },
      { idIdx: 8, topic: 'Next.js Best Practices' },
      { idIdx: 9, topic: 'Next.js Best Practices' },

      { idIdx: 10, topic: 'SaaS Marketing' },
      { idIdx: 11, topic: 'SaaS Marketing' },
      { idIdx: 12, topic: 'SaaS Marketing' },
      { idIdx: 13, topic: 'SaaS Marketing' },

      { idIdx: 14, topic: 'Career in Tech' },
      { idIdx: 15, topic: 'Career in Tech' },
      { idIdx: 16, topic: 'Career in Tech' }
    ];

    for (const mapping of tagMappings) {
      await query(
        'INSERT INTO content_item_taxonomy (content_id, topic) VALUES ($1, $2)',
        [insertedContent[mapping.idIdx].id, mapping.topic]
      );
    }

    // 5. Generate daily metrics for each content item
    log += 'Generating daily performance metrics (90 days history)...\n';
    const startDate = new Date('2026-05-05');
    const endDate = new Date('2026-08-03');

    // Helper to generate metrics based on format and topic performance multipliers
    for (const item of insertedContent) {
      const pubDate = new Date(item.publishDate);
      let dayIndex = 0;

      for (let d = new Date(pubDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        const dayOfWeek = d.getDay(); // 0 is Sunday, 6 is Saturday
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        // Base traffic decays over time but has a baseline
        const ageInDays = dayIndex;
        dayIndex++;

        // Channel baseline views
        let baseViews = 0;
        let convRate = 0;
        let avgTime = 0;

        if (item.channel === 'web') {
          // Article decay: peak in first 5 days, then decay to a long tail
          baseViews = ageInDays < 5 
            ? Math.floor(150 + Math.random() * 100) 
            : Math.floor(20 + Math.random() * 15);
          avgTime = Math.floor(120 + Math.random() * 60); // 2-3 mins
        } else if (item.channel === 'youtube') {
          // YouTube curve: build up, peak around day 7-10, stable discovery afterwards
          baseViews = ageInDays < 10 
            ? Math.floor(80 + ageInDays * 40 + Math.random() * 50)
            : Math.floor(40 + Math.random() * 20);
          avgTime = Math.floor(350 + Math.random() * 150); // 6-8 mins
        } else if (item.channel === 'newsletter') {
          // Newsletter spikes on day 1, then falls to zero
          baseViews = ageInDays === 0 ? Math.floor(1800 + Math.random() * 400) : (ageInDays === 1 ? Math.floor(150 + Math.random() * 50) : 0);
          avgTime = Math.floor(80 + Math.random() * 30);
        } else if (item.channel === 'social') {
          // Social spike on day 1, minor tail on day 2, then zero
          baseViews = ageInDays === 0 ? Math.floor(5000 + Math.random() * 2000) : (ageInDays === 1 ? Math.floor(200 + Math.random() * 100) : 0);
          avgTime = Math.floor(15 + Math.random() * 10);
        }

        // Apply weekend dip (except for social)
        if (isWeekend && item.channel !== 'social') {
          baseViews = Math.floor(baseViews * 0.4);
        }

        // Topic performance multipliers
        let topicMultiplier = 1.0;
        if (item.title.includes('Gemini') || item.title.includes('RAG') || item.title.includes('AI')) {
          // AI engineering is trending UP
          topicMultiplier = 1.8 + (ageInDays * 0.005); 
          convRate = 0.028; // High conversions (2.8%)
        } else if (item.title.includes('Next.js') || item.title.includes('PPR')) {
          topicMultiplier = 1.2;
          convRate = 0.021; // Good conversions (2.1%)
        } else if (item.title.includes('SaaS') || item.title.includes('Email')) {
          topicMultiplier = 0.45; // SaaS Marketing is underperforming
          convRate = 0.002; // Very low conversions (0.2%)
        } else if (item.title.includes('Negotiate') || item.title.includes('Lead') || item.title.includes('Debt')) {
          topicMultiplier = 0.9;
          convRate = 0.008; // 0.8%
        }

        const views = Math.max(0, Math.floor(baseViews * topicMultiplier));
        if (views === 0) continue;

        const conversions = Math.random() < 0.2 // randomize a bit
          ? Math.floor(views * convRate * 0.8)
          : Math.ceil(views * convRate);

        const convVal = conversions * 49.00; // e.g. $49 conversion value (ebook or newsletter sign-up worth)

        // Engagement rate
        const engagementRate = item.format === 'video' 
          ? 0.35 + Math.random() * 0.15 
          : (item.format === 'social_post' ? 0.04 + Math.random() * 0.05 : 0.65 + Math.random() * 0.15);

        // Search Console Metrics (for web only)
        let searchImpressions = 0;
        let searchClicks = 0;
        let searchPos = null;

        if (item.channel === 'web') {
          // Grows over time as Google indexes it
          const indexedFactor = Math.min(1, ageInDays / 30);
          searchImpressions = Math.floor((50 + Math.random() * 100) * indexedFactor * topicMultiplier);
          searchClicks = Math.floor(searchImpressions * (0.05 + Math.random() * 0.04));
          searchPos = Math.max(1, 15 - (ageInDays * 0.1) + (Math.random() * 2));
        }

        // Insert daily metrics
        await query(
          `INSERT INTO content_metrics_daily (
            content_id, date, views, engagement_rate, avg_time_on_page, conversions, conversion_value, search_impressions, search_clicks, avg_search_position
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (content_id, date) DO NOTHING`,
          [item.id, dateStr, views, engagementRate, avgTime, conversions, convVal, searchImpressions, searchClicks, searchPos]
        );

        // Insert Segment split views and conversions
        // Segment splits: new_users gets 50%, returning_users 40%, enterprise_leads 10%
        const segmentSplits = [
          { segId: 'new_users', pct: 0.5 },
          { segId: 'returning_users', pct: 0.4 },
          { segId: 'enterprise_leads', pct: 0.1 }
        ];

        for (const split of segmentSplits) {
          const segViews = Math.floor(views * split.pct);
          // Enterprise leads convert slightly higher for AI, returning visitors convert higher in general
          let segConvRate = convRate;
          if (split.segId === 'enterprise_leads' && (item.title.includes('Gemini') || item.title.includes('RAG'))) {
            segConvRate = convRate * 2.2;
          } else if (split.segId === 'returning_users') {
            segConvRate = convRate * 1.5;
          } else if (split.segId === 'new_users') {
            segConvRate = convRate * 0.5;
          }
          const segConversions = Math.ceil(segViews * segConvRate);
          
          await query(
            `INSERT INTO content_segment_metrics_daily (content_id, segment_id, date, views, conversions)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (content_id, segment_id, date) DO NOTHING`,
            [item.id, split.segId, dateStr, segViews, segConversions]
          );
        }
      }
    }

    // 6. Generate Search Console Queries (both matched and content-gaps)
    log += 'Generating Search Console queries and mapping gaps...\n';
    const queriesList = [
      // AI queries (matched)
      { query: 'rag pipeline tutorial gemini', impressions: 4500, clicks: 380, matchedIdx: 0 },
      { query: 'gemini flash structured output typescript', impressions: 3200, clicks: 290, matchedIdx: 1 },
      { query: 'how to fine-tune gemini code', impressions: 1800, clicks: 120, matchedIdx: 5 },
      // Next.js queries (matched)
      { query: 'nextjs secure server actions design', impressions: 2200, clicks: 180, matchedIdx: 6 },
      { query: 'partial prerendering vercel config', impressions: 1400, clicks: 90, matchedIdx: 7 },
      
      // CONTENT GAPS (no matched content: matched_content_id is null)
      // High search impressions, but extremely low clicks because we have no content targeting these queries!
      { query: 'how to fix nextjs server actions timeout issue', impressions: 3800, clicks: 12, matchedIdx: null },
      { query: 'gemini-2.5-pro vs gemini-2.5-flash latency benchmark', impressions: 5800, clicks: 25, matchedIdx: null },
      { query: 'postgres pool connection leak nextjs serverless', impressions: 4200, clicks: 18, matchedIdx: null },
      { query: 'responsive SVG line chart css styling guide', impressions: 2500, clicks: 8, matchedIdx: null },
      { query: 'saas seo strategy programmatic landing pages', impressions: 900, clicks: 2, matchedIdx: null }
    ];

    // Seed daily search console reports over the last 30 days
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      for (const q of queriesList) {
        // Add random variance
        const dayImp = Math.floor((q.impressions / 90) * (0.8 + Math.random() * 0.4));
        const dayClicks = q.matchedIdx !== null 
          ? Math.floor(dayImp * (0.08 + Math.random() * 0.04))
          : Math.floor(dayImp * (0.003 + Math.random() * 0.004)); // very low CTR for gaps

        const pos = q.matchedIdx !== null
          ? 2.5 + Math.random() * 1.5
          : 12.0 + Math.random() * 4.0; // poor ranking for gaps

        const matchedContentId = q.matchedIdx !== null ? insertedContent[q.matchedIdx].id : null;

        await query(
          `INSERT INTO search_queries (query, date, impressions, clicks, position, matched_content_id)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [q.query, dateStr, dayImp, dayClicks, pos, matchedContentId]
        );
      }
    }

    log += 'Database seeding completed successfully.\n';
    return { success: true, log };
  } catch (err: any) {
    console.error('Database seeding failed:', err);
    log += `ERROR: ${err?.message || String(err)}\n`;
    return { success: false, log };
  }
}
