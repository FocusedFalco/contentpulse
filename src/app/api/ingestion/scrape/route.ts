import { NextRequest, NextResponse } from 'next/server';
import { query, initializeDatabase } from '@/lib/db/db';
import { classifyTopicWithGemini } from '@/lib/gemini/gemini';

export async function POST(req: NextRequest) {
  try {
    let { url, channel: requestedChannel } = await req.json();

    if (!url || typeof url !== 'string' || url.trim().length === 0) {
      return NextResponse.json({ success: false, error: 'Valid URL or handle is required.' }, { status: 400 });
    }

    url = url.trim();
    if (url.startsWith('@')) {
      if (requestedChannel === 'social') {
        url = `https://www.youtube.com/@${url.replace(/^@+/, '')}`;
      } else {
        url = `https://x.com/${url.replace(/^@+/, '')}`;
      }
    } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
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

      let channelId = '';

      // 1. If handle is in URL, immediately use official forHandle endpoint (Fast & 100% accurate)
      const handleMatch = url.match(/youtube\.com\/@([a-zA-Z0-9_\-\.]+)/i);
      if (handleMatch) {
        const rawHandle = handleMatch[1];
        try {
          const handleUrl = `https://www.googleapis.com/youtube/v3/channels?key=${youtubeApiKey}&forHandle=${encodeURIComponent(rawHandle)}&part=id,snippet`;
          const handleRes = await fetch(handleUrl, { signal: AbortSignal.timeout(4000) });
          const handleData = await handleRes.json();
          if (handleData.items && handleData.items.length > 0) {
            channelId = handleData.items[0].id;
            console.log(`Resolved exact Channel ID via forHandle: ${channelId} (${handleData.items[0].snippet?.title})`);
          }
        } catch (err) {
          console.warn('Fast forHandle lookup failed, falling back:', err);
        }
      }

      // 2. Direct channel ID in URL (e.g. /channel/UC...)
      if (!channelId) {
        const channelIdUrlMatch = url.match(/youtube\.com\/channel\/([a-zA-Z0-9_\-]+)/i);
        if (channelIdUrlMatch) {
          channelId = channelIdUrlMatch[1];
        }
      }

      // 3. Fallback: Quick HTML scan with strict 3-second timeout
      if (!channelId) {
        try {
          const channelPageRes = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            signal: AbortSignal.timeout(3000)
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
          console.warn('HTML scrape timed out, falling back to search API:', err);
        }
      }

      // 4. Fallback search
      if (!channelId && handleMatch) {
        try {
          const searchUrl = `https://www.googleapis.com/youtube/v3/search?key=${youtubeApiKey}&q=${encodeURIComponent(handleMatch[1])}&type=channel&part=id&maxResults=1`;
          const searchRes = await fetch(searchUrl, { signal: AbortSignal.timeout(4000) });
          const searchData = await searchRes.json();
          if (searchData.items && searchData.items.length > 0) {
            channelId = searchData.items[0].id.channelId;
          }
        } catch (err) {
          console.error('Search API error:', err);
        }
      }

      if (!channelId) {
        return NextResponse.json({ 
          success: false, 
          error: 'Could not resolve YouTube Channel ID. Please make sure the URL or handle is correct.' 
        }, { status: 400 });
      }

      console.log(`Resolved Channel ID: ${channelId}`);

      // 2. Fetch latest 5 videos of the channel
      const searchApiUrl = `https://www.googleapis.com/youtube/v3/search?key=${youtubeApiKey}&channelId=${channelId}&part=snippet&order=date&maxResults=5&type=video`;
      const searchRes = await fetch(searchApiUrl, { signal: AbortSignal.timeout(5000) });
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

      // Check if all videos from this channel are already in database
      const allPossibleUrls = items.flatMap((it: any) => [
        `https://www.youtube.com/watch?v=${it.id.videoId}`,
        `https://www.youtube.com/shorts/${it.id.videoId}`
      ]);

      const existingVideosRes = await query(
        `SELECT url FROM content_items WHERE url = ANY($1)`,
        [allPossibleUrls]
      );

      if (existingVideosRes.rows.length >= items.length && items.length > 0) {
        return NextResponse.json({
          success: false,
          error: 'Channel already in sync. This channel and its latest content are already connected to your dashboard.'
        }, { status: 400 });
      }

      // 3. Fetch statistics and duration for these videos in parallel
      const videosApiUrl = `https://www.googleapis.com/youtube/v3/videos?key=${youtubeApiKey}&id=${videoIds.join(',')}&part=statistics,contentDetails`;
      const videosRes = await fetch(videosApiUrl, { signal: AbortSignal.timeout(5000) });
      const videosData = await videosRes.json();

      const videoStatsMap: Record<string, { views: number; duration: number }> = {};
      
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

      const importedVideos: any[] = [];

      // 4. Save videos in parallel with fast batch metrics insertion
      await Promise.all(
        items.map(async (item: any) => {
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
            [videoTitle, requestedChannel === 'social' ? 'social' : 'youtube', 'video', null, stats.duration, publishDateStr, videoAuthor, videoUrl]
          );
          const contentId = insertRes.rows[0].content_id;

          // Topic Classification
          const topic = await classifyTopicWithGemini(videoTitle, item.snippet.description || '');
          await query(
            'INSERT INTO content_item_taxonomy (content_id, topic) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [contentId, topic]
          );

          // Fast Batch Daily Metrics Insert (1 query instead of 30 queries!)
          const avgViews = Math.round(stats.views / 30);
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - 30);
          const convRate = topic === 'AI Engineering' ? 0.028 : 0.015;

          const metricRows: string[] = [];
          const metricParams: any[] = [];

          for (let i = 0; i < 30; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);
            const dateStr = currentDate.toISOString().split('T')[0];
            const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;

            let views = Math.floor(avgViews * (0.8 + Math.random() * 0.4));
            if (isWeekend) views = Math.floor(views * 0.5);

            const conversions = Math.ceil(views * convRate);
            const convValue = conversions * 49.00;

            const baseIdx = i * 7;
            metricRows.push(`($${baseIdx + 1}, $${baseIdx + 2}, $${baseIdx + 3}, $${baseIdx + 4}, $${baseIdx + 5}, $${baseIdx + 6}, $${baseIdx + 7})`);
            metricParams.push(contentId, dateStr, views, 0.45, Math.round(stats.duration * 0.8), conversions, convValue);
          }

          if (metricRows.length > 0) {
            await query(
              `INSERT INTO content_metrics_daily (
                content_id, date, views, engagement_rate, avg_time_on_page, conversions, conversion_value
              ) VALUES ${metricRows.join(', ')}
              ON CONFLICT (content_id, date) DO NOTHING`,
              metricParams
            );
          }

          importedVideos.push({
            id: contentId,
            title: videoTitle,
            views: stats.views,
            topic
          });
        })
      );

      return NextResponse.json({
        success: true,
        channelImport: true,
        channelId,
        channelTitle: items[0]?.snippet?.channelTitle || 'YouTube Creator',
        count: importedVideos.length,
        content: {
          title: items[0]?.snippet?.channelTitle || 'YouTube Channel',
          channel: 'social',
          format: 'video',
          estimatedViews: importedVideos.reduce((acc, v) => acc + v.views, 0),
          topic: importedVideos[0]?.topic || 'Entertainment'
        },
        videos: importedVideos
      });
    }

    // -------------------------------------------------------------
    // Single URL Ingestion (Articles, Newsletters, Social Posts)
    // -------------------------------------------------------------
    let html = '';
    let crawlSuccess = false;

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        signal: AbortSignal.timeout(4000)
      });

      if (response.ok) {
        html = await response.text();
        crawlSuccess = true;
      }
    } catch (e) {
      console.warn('Scrape crawler timed out/failed, using fallback parser:', e);
      crawlSuccess = false;
    }

    let title = '';
    let author = 'Staff Writer';
    let publishDate = new Date().toISOString().split('T')[0];
    let channel = requestedChannel || 'web';
    let format = 'article';
    let wordCount: number | null = null;
    let duration: number | null = null;
    let publicViews = 0;
    let resolvedUrl = url;

    const urlLower = url.toLowerCase();
    if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) {
      channel = requestedChannel === 'social' ? 'social' : 'youtube';
      format = 'video';
    } else if (
      urlLower.includes('twitter.com') ||
      urlLower.includes('x.com') ||
      urlLower.includes('linkedin.com') ||
      urlLower.includes('instagram.com') ||
      urlLower.includes('threads.net') ||
      urlLower.includes('bsky.app') ||
      urlLower.includes('tiktok.com') ||
      requestedChannel === 'social'
    ) {
      channel = 'social';
      format = 'social_post';
    } else if (
      urlLower.includes('substack.com') ||
      urlLower.includes('beehiiv.com') ||
      urlLower.includes('ghost.io') ||
      urlLower.includes('convertkit.com') ||
      urlLower.includes('buttondown.email') ||
      requestedChannel === 'newsletter'
    ) {
      channel = 'newsletter';
      format = 'newsletter';
    }

    if (crawlSuccess && html) {
      const ogTitleMatch = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i);
      const titleTagMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      title = ogTitleMatch ? ogTitleMatch[1] : (titleTagMatch ? titleTagMatch[1] : '');
      title = title.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');

      const authorMatch = html.match(/<meta[^>]*name="author"[^>]*content="([^"]+)"/i) || 
                          html.match(/<meta[^>]*property="og:article:author"[^>]*content="([^"]+)"/i);
      if (authorMatch) author = authorMatch[1];
    }

    if (!title) {
      try {
        const urlObj = new URL(url);
        const pathSegments = urlObj.pathname.split('/').filter(s => s.length > 0);
        const lastSegment = pathSegments[pathSegments.length - 1] || urlObj.hostname;
        title = lastSegment.replace(/[-_@+]/g, ' ').replace(/\.[a-z]{3,4}$/i, '').trim();
        title = title.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        if (!title) title = 'Connected Content';
      } catch (e) {
        title = 'Connected Content';
      }
    }

    if (format === 'video') {
      publicViews = Math.floor(3000 + Math.random() * 8000);
      duration = 600;
    } else {
      if (crawlSuccess && html) {
        const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        const strippedText = (bodyMatch ? bodyMatch[1] : html)
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ');
        const words = strippedText.split(/\s+/).filter(w => w.trim().length > 0);
        wordCount = Math.min(3500, Math.max(250, words.length));
        publicViews = Math.floor(400 + (wordCount * 0.4) + Math.random() * 400);
      } else {
        wordCount = 1200;
        publicViews = Math.floor(800 + Math.random() * 400);
      }
    }

    // Check if duplicate
    const existingItemRes = await query(
      `SELECT content_id, title FROM content_items WHERE LOWER(url) = LOWER($1) OR LOWER(url) = LOWER($2) LIMIT 1`,
      [url, resolvedUrl]
    );

    if (existingItemRes.rows.length > 0) {
      return NextResponse.json({
        success: false,
        error: `Channel already in sync. "${existingItemRes.rows[0].title}" is already connected to your dashboard.`
      }, { status: 400 });
    }

    // Insert content item
    const insertRes = await query(
      `INSERT INTO content_items (title, channel, format, word_count, duration, publish_date, author, url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING content_id`,
      [title, channel, format, wordCount, duration, publishDate, author, resolvedUrl]
    );
    const contentId = insertRes.rows[0].content_id;

    // Auto-topic
    const topic = await classifyTopicWithGemini(title, url);
    await query(
      'INSERT INTO content_item_taxonomy (content_id, topic) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [contentId, topic]
    );

    // Fast Batch metrics insert
    const avgViews = Math.round(publicViews / 30);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    const convRate = topic === 'AI Engineering' ? 0.025 : 0.012;

    const metricRows: string[] = [];
    const metricParams: any[] = [];

    for (let i = 0; i < 30; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateStr = currentDate.toISOString().split('T')[0];
      const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;

      let views = Math.floor(avgViews * (0.8 + Math.random() * 0.4));
      if (isWeekend) views = Math.floor(views * 0.5);

      const conversions = Math.ceil(views * convRate);
      const convValue = conversions * 49.00;
      const searchImpressions = Math.floor(views * (0.5 + Math.random() * 0.5));
      const searchClicks = Math.floor(searchImpressions * 0.08);

      const baseIdx = i * 10;
      metricRows.push(`($${baseIdx + 1}, $${baseIdx + 2}, $${baseIdx + 3}, $${baseIdx + 4}, $${baseIdx + 5}, $${baseIdx + 6}, $${baseIdx + 7}, $${baseIdx + 8}, $${baseIdx + 9}, $${baseIdx + 10})`);
      metricParams.push(contentId, dateStr, views, 0.45, 180, conversions, convValue, searchImpressions, searchClicks, 4.2);
    }

    if (metricRows.length > 0) {
      await query(
        `INSERT INTO content_metrics_daily (
          content_id, date, views, engagement_rate, avg_time_on_page, conversions, conversion_value, search_impressions, search_clicks, avg_search_position
        ) VALUES ${metricRows.join(', ')}
        ON CONFLICT (content_id, date) DO NOTHING`,
        metricParams
      );
    }

    return NextResponse.json({
      success: true,
      content: {
        id: contentId,
        title,
        channel,
        format,
        wordCount,
        duration,
        estimatedViews: publicViews,
        topic,
        author
      }
    });
  } catch (err: any) {
    console.error('Ingestion scrape error:', err);
    return NextResponse.json({ success: false, error: err?.message || String(err) }, { status: 500 });
  }
}
