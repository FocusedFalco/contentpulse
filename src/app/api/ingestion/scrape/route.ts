import { NextRequest, NextResponse } from 'next/server';
import { query, initializeDatabase } from '@/lib/db/db';
import { classifyTopicWithGemini } from '@/lib/gemini/gemini';

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || !url.startsWith('http')) {
      return NextResponse.json({ success: false, error: 'Valid URL is required.' }, { status: 400 });
    }

    // Auto-create tables on first scrape if they don't exist
    await initializeDatabase().catch(err => {
      console.warn('Silent warning: Database initialization failed during scrape, proceeding anyway:', err);
    });

    console.log(`Scraping URL: ${url}`);

    const youtubeApiKey = process.env.YOUTUBE_API_KEY;

    // Detect if it is a YouTube Channel
    const isChannel = url.includes('youtube.com') && 
                      (url.includes('/@') || url.includes('/channel/') || url.includes('/c/') || url.includes('/user/')) &&
                      !url.includes('watch?v=') && !url.includes('/watch');

    if (isChannel) {
      console.log('YouTube Channel detected. Running YouTube Data API v3 scraper...');
      
      if (!youtubeApiKey) {
        return NextResponse.json({ 
          success: false, 
          error: 'YouTube API Key is required to fetch channel videos. Please configure it in .env.local or settings.' 
        }, { status: 400 });
      }

      // 1. Fetch channel page to extract channel ID
      let channelId = '';
      try {
        const channelPageRes = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        if (channelPageRes.ok) {
          const channelHtml = await channelPageRes.text();
          const channelIdMatch = channelHtml.match(/meta itemprop="channelId" content="([^"]+)"/i) || 
                                 channelHtml.match(/"channelId":"([^"]+)"/i);
          if (channelIdMatch) {
            channelId = channelIdMatch[1];
          }
        }
      } catch (err) {
        console.warn('Failed to scrape channel ID from HTML, will try direct search:', err);
      }

      // If we couldn't parse the channel ID from HTML, let's try to resolve it from the username handle via search
      if (!channelId) {
        try {
          const handleMatch = url.match(/youtube\.com\/@([a-zA-Z0-9_\-\.]+)/i);
          if (handleMatch) {
            const handle = handleMatch[1];
            const searchUrl = `https://www.googleapis.com/youtube/v3/search?key=${youtubeApiKey}&q=${handle}&type=channel&part=id&maxResults=1`;
            const searchRes = await fetch(searchUrl);
            const searchData = await searchRes.json();
            if (searchData.items && searchData.items.length > 0) {
              channelId = searchData.items[0].id.channelId;
            }
          }
        } catch (err) {
          console.error('Failed to resolve channel ID via Search API:', err);
        }
      }

      if (!channelId) {
        return NextResponse.json({ 
          success: false, 
          error: 'Could not resolve YouTube Channel ID. Please make sure the URL is correct.' 
        }, { status: 400 });
      }

      console.log(`Resolved Channel ID: ${channelId}`);

      // 2. Fetch latest 5 videos of the channel
      const searchApiUrl = `https://www.googleapis.com/youtube/v3/search?key=${youtubeApiKey}&channelId=${channelId}&part=snippet&order=date&maxResults=5&type=video`;
      const searchRes = await fetch(searchApiUrl);
      const searchData = await searchRes.json();

      if (searchData.error) {
        throw new Error(searchData.error.message || 'YouTube Search API failed.');
      }

      const items = searchData.items || [];
      if (items.length === 0) {
        return NextResponse.json({ 
          success: false, 
          error: 'No videos found in this YouTube channel feed.' 
        }, { status: 400 });
      }

      // Extract video IDs
      const videoIds = items.map((item: any) => item.id.videoId);
      console.log(`Found videos: ${videoIds.join(', ')}`);

      // 3. Fetch statistics and duration for these videos
      const videosApiUrl = `https://www.googleapis.com/youtube/v3/videos?key=${youtubeApiKey}&id=${videoIds.join(',')}&part=statistics,contentDetails`;
      const videosRes = await fetch(videosApiUrl);
      const videosData = await videosRes.json();

      const videoStatsMap: Record<string, { views: number; duration: number }> = {};
      
      // ISO 8601 duration parser helper (e.g. PT15M33S -> 933)
      const parseISODuration = (isoDuration: string): number => {
        const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        if (!match) return 600;
        const hours = parseInt(match[1] || '0', 10);
        const minutes = parseInt(match[2] || '0', 10);
        const seconds = parseInt(match[3] || '0', 10);
        return hours * 3600 + minutes * 60 + seconds;
      };

      if (videosData.items) {
        videosData.items.forEach((v: any) => {
          videoStatsMap[v.id] = {
            views: parseInt(v.statistics?.viewCount || '0', 10),
            duration: parseISODuration(v.contentDetails?.duration || 'PT10M')
          };
        });
      }

      const importedVideos = [];

      // 4. Save each video in DB and seed daily metrics
      for (const item of items) {
        const videoId = item.id.videoId;
        const videoTitle = item.snippet.title;
        const publishDateStr = new Date(item.snippet.publishedAt).toISOString().split('T')[0];
        const videoAuthor = item.snippet.channelTitle || 'YouTube Creator';
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        const stats = videoStatsMap[videoId] || { views: Math.floor(1000 + Math.random() * 5000), duration: 600 };

        // Save Content Item
        const insertRes = await query(
          `INSERT INTO content_items (title, channel, format, word_count, duration, publish_date, author, url)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING content_id`,
          [videoTitle, 'youtube', 'video', null, stats.duration, publishDateStr, videoAuthor, videoUrl]
        );
        const contentId = insertRes.rows[0].content_id;

        // Auto-topic mapping
        // Auto-topic mapping using Gemini
        const topic = await classifyTopicWithGemini(videoTitle, item.snippet.description || '');

        await query(
          'INSERT INTO content_item_taxonomy (content_id, topic) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [contentId, topic]
        );

        // Seed 30 days daily metrics
        const avgViews = Math.round(stats.views / 30);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        let convRate = 0.015;
        if (topic === 'AI Engineering') convRate = 0.028;

        for (let i = 0; i < 30; i++) {
          const currentDate = new Date(startDate);
          currentDate.setDate(startDate.getDate() + i);
          const dateStr = currentDate.toISOString().split('T')[0];
          const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;

          let views = Math.floor(avgViews * (0.8 + Math.random() * 0.4));
          if (isWeekend) views = Math.floor(views * 0.5);

          const conversions = Math.ceil(views * convRate);
          const convValue = conversions * 49.00;

          await query(
            `INSERT INTO content_metrics_daily (
              content_id, date, views, engagement_rate, avg_time_on_page, conversions, conversion_value
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (content_id, date) DO NOTHING`,
            [contentId, dateStr, views, 0.45, Math.round(stats.duration * 0.8), conversions, convValue]
          );
        }

        importedVideos.push({
          id: contentId,
          title: videoTitle,
          views: stats.views,
          topic
        });
      }

      const channelAuthor = items[0]?.snippet?.channelTitle || 'YouTube Creator';

      // Return response immediately for channel import success!
      return NextResponse.json({
        success: true,
        channelImport: true,
        count: importedVideos.length,
        videos: importedVideos,
        content: {
          id: importedVideos[0].id,
          title: `Imported Channel: ${channelAuthor} (${importedVideos.length} Videos)`,
          author: channelAuthor,
          publishDate: new Date().toISOString().split('T')[0],
          channel: 'youtube',
          format: 'video',
          estimatedViews: importedVideos.reduce((acc, v) => acc + v.views, 0),
          estimatedConversions: Math.round(importedVideos.reduce((acc, v) => acc + v.views, 0) * 0.02),
          topic: importedVideos[0].topic
        }
      });
    }

    
    // 1. Fetch raw HTML
    let html = '';
    let crawlSuccess = true;
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      if (response.ok) {
        html = await response.text();
      } else {
        crawlSuccess = false;
      }
    } catch (e) {
      console.warn('Scrape crawler failed, using fallback generator:', e);
      crawlSuccess = false;
    }

    // 2. Parse Metadata (using HTML or generating fallback)
    let title = '';
    let author = 'Staff Writer';
    let publishDate = new Date().toISOString().split('T')[0];
    let channel = 'web';
    let format = 'article';
    let wordCount: number | null = null;
    let duration: number | null = null;
    let publicViews = 0;

    // Detect platform/channel based on URL domain
    const urlLower = url.toLowerCase();
    if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) {
      channel = 'youtube';
      format = 'video';
    } else if (urlLower.includes('substack.com')) {
      channel = 'newsletter';
      format = 'newsletter';
    } else if (urlLower.includes('medium.com')) {
      channel = 'web';
      format = 'article';
    }

    if (crawlSuccess && html) {
      // Title Extraction
      const ogTitleMatch = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i);
      const titleTagMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      title = ogTitleMatch ? ogTitleMatch[1] : (titleTagMatch ? titleTagMatch[1] : '');
      title = title.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');

      // Author Extraction
      const authorMatch = html.match(/<meta[^>]*name="author"[^>]*content="([^"]+)"/i) || 
                          html.match(/<meta[^>]*property="og:article:author"[^>]*content="([^"]+)"/i);
      if (authorMatch) {
        author = authorMatch[1];
      }

      // Date Extraction
      const dateMatch = html.match(/<meta[^>]*property="article:published_time"[^>]*content="([^"]+)"/i) ||
                        html.match(/<meta[^>]*name="publish-date"[^>]*content="([^"]+)"/i);
      if (dateMatch) {
        try {
          publishDate = new Date(dateMatch[1]).toISOString().split('T')[0];
        } catch (e) {}
      }
    }

    // Fallback title generation if fetch failed or parsed title is empty
    if (!title) {
      try {
        const urlObj = new URL(url);
        const pathSegments = urlObj.pathname.split('/').filter(s => s.length > 0);
        const lastSegment = pathSegments[pathSegments.length - 1] || urlObj.hostname;
        title = lastSegment
          .replace(/[-_@+]/g, ' ')
          .replace(/\.[a-z]{3,4}$/i, '') // remove extension like .html
          .trim();
        // Capitalize words
        title = title.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        if (!title) title = 'Scraped Content';
      } catch (e) {
        title = 'Scraped Content';
      }
    }

    // Specific Extraction for YouTube (Scrape views and duration) or articles
    if (format === 'video') {
      if (crawlSuccess && html) {
        // YouTube viewCount regex
        const viewMatch = html.match(/"viewCount":"(\d+)"/i);
        if (viewMatch) {
          publicViews = parseInt(viewMatch[1], 10);
        } else {
          publicViews = Math.floor(3000 + Math.random() * 8000);
        }

        // YouTube duration regex (seconds)
        const durationMatch = html.match(/"lengthSeconds":"(\d+)"/i);
        if (durationMatch) {
          duration = parseInt(durationMatch[1], 10);
        } else {
          duration = 600; // 10 mins fallback
        }
      } else {
        publicViews = Math.floor(3000 + Math.random() * 8000);
        duration = 600;
      }
    } else {
      if (crawlSuccess && html) {
        // Word count calculation for articles (approximate by stripping HTML tags)
        const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        const bodyText = bodyMatch ? bodyMatch[1] : html;
        const strippedText = bodyText.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                                     .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                                     .replace(/<[^>]+>/g, ' ');
        const words = strippedText.split(/\s+/).filter(w => w.trim().length > 0);
        wordCount = Math.min(3500, Math.max(250, words.length)); // clamp between 250 and 3500 words
        
        // Calculate fake views based on word count/likes (e.g. 500-1500)
        publicViews = Math.floor(400 + (wordCount * 0.4) + Math.random() * 400);
      } else {
        wordCount = 1200;
        publicViews = Math.floor(800 + Math.random() * 400);
      }
    }

    // 3. Save Scraped Item to Supabase
    const insertRes = await query(
      `INSERT INTO content_items (title, channel, format, word_count, duration, publish_date, author, url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING content_id`,
      [title, channel, format, wordCount, duration, publishDate, author, url]
    );
    const contentId = insertRes.rows[0].content_id;

    // 4. Auto-Assign Topic Category using Gemini
    const descriptionMatch = html ? (html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]+)"/i) || 
                                     html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i)) : null;
    const pageDescription = descriptionMatch ? descriptionMatch[1] : '';
    const topic = await classifyTopicWithGemini(title, pageDescription || url);

    await query(
      'INSERT INTO content_item_taxonomy (content_id, topic) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [contentId, topic]
    );

    // 5. Seed 30 days of daily metrics based on the scraped views count
    console.log(`Seeding 30 days of daily metrics for new item. Total views target: ${publicViews}`);
    
    // Average daily views = total views / 30 days
    const avgDailyViews = Math.round(publicViews / 30);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    // Set topic-specific conversion rates
    let convRate = 0.012; // default
    if (topic === 'AI Engineering') convRate = 0.028;
    else if (topic === 'Next.js Best Practices') convRate = 0.021;
    else if (topic === 'SaaS Marketing') convRate = 0.002;

    let totalViewsSeeded = 0;
    let totalConversionsSeeded = 0;

    for (let i = 0; i < 30; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateStr = currentDate.toISOString().split('T')[0];
      const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;

      let views = Math.floor(avgDailyViews * (0.7 + Math.random() * 0.6));
      if (isWeekend && channel !== 'social') {
        views = Math.floor(views * 0.4);
      }
      
      const conversions = Math.ceil(views * convRate);
      const convValue = conversions * 49.00;
      const engagement = format === 'video' ? 0.42 : 0.68;
      const avgTime = format === 'video' ? 510 : 180;

      let searchImp = 0;
      let searchCli = 0;
      let searchPos = null;

      if (channel === 'web') {
        searchImp = Math.floor(views * (0.8 + Math.random() * 0.4));
        searchCli = Math.floor(searchImp * 0.06);
        searchPos = 3.8;
      }

      await query(
        `INSERT INTO content_metrics_daily (
          content_id, date, views, engagement_rate, avg_time_on_page, conversions, conversion_value, search_impressions, search_clicks, avg_search_position
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (content_id, date) DO NOTHING`,
        [contentId, dateStr, views, engagement, avgTime, conversions, convValue, searchImp, searchCli, searchPos]
      );

      totalViewsSeeded += views;
      totalConversionsSeeded += conversions;
    }

    // Add a Search Query match for GSC
    if (channel === 'web') {
      const cleanTitle = title.split('|')[0].split('-')[0].trim();
      await query(
        `INSERT INTO search_queries (query, date, impressions, clicks, position, matched_content_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [cleanTitle.toLowerCase(), publishDate, publicViews, Math.round(publicViews * 0.07), 2.1, contentId]
      );
    }

    return NextResponse.json({
      success: true,
      content: {
        id: contentId,
        title,
        author,
        publishDate,
        channel,
        format,
        wordCount,
        duration,
        estimatedViews: totalViewsSeeded,
        estimatedConversions: totalConversionsSeeded,
        topic
      }
    });

  } catch (err: any) {
    console.error('URL Scraping failed:', err);
    return NextResponse.json({ success: false, error: err?.message || String(err) }, { status: 500 });
  }
}
