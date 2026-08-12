import { query, initializeDatabase } from '../db/db';
import { seedDatabase } from '../db/seed';
import { fetchGA4Metrics } from './connectors/ga4';
import { fetchSearchConsoleMetrics } from './connectors/search_console';

export interface IngestionConfig {
  ga4PropertyId?: string;
  gscSiteUrl?: string;
  youtubeChannelId?: string;
  newsletterProvider?: string;
  slackWebhookUrl?: string;
}

export interface IngestionResult {
  success: boolean;
  log: string;
  summary: {
    itemsSynced: number;
    metricsSynced: number;
    gapsDetected: number;
  };
}

/**
 * Main ingestion controller
 */
export async function runFullIngestion(
  resetAndRebuild: boolean = false,
  config: IngestionConfig = {}
): Promise<IngestionResult> {
  let log = `[${new Date().toISOString()}] Starting content ingestion pipeline...\n`;
  
  try {
    // 1. Initialize tables first
    const initResult = await initializeDatabase();
    log += initResult.log;
    if (!initResult.success) {
      throw new Error('Database initialization failed during ingestion.');
    }

    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;
    const propertyId = config.ga4PropertyId || process.env.GA4_PROPERTY_ID;
    const siteUrl = config.gscSiteUrl || process.env.GSC_SITE_URL;

    // Check if we can run LIVE ingestion
    const runLive = !resetAndRebuild && clientEmail && privateKey && propertyId && siteUrl;

    if (resetAndRebuild || !runLive) {
      if (resetAndRebuild) {
        log += 'Running full database seed with 90 days historical mock data...\n';
      } else {
        log += 'Google API credentials not configured in environment. Running mock incremental sync...\n';
      }

      const seedResult = await seedDatabase();
      log += seedResult.log;
      
      if (!seedResult.success) {
        throw new Error('Seeding failed.');
      }

      const itemsCount = await query('SELECT COUNT(*) FROM content_items');
      const metricsCount = await query('SELECT COUNT(*) FROM content_metrics_daily');
      const gapsCount = await query('SELECT COUNT(*) FROM search_queries WHERE matched_content_id IS NULL');

      return {
        success: true,
        log,
        summary: {
          itemsSynced: parseInt(itemsCount.rows[0].count, 10),
          metricsSynced: parseInt(metricsCount.rows[0].count, 10),
          gapsDetected: parseInt(gapsCount.rows[0].count, 10),
        }
      };
    }

    // 2. LIVE Ingestion using Google Service Account
    log += 'Google API credentials detected. Fetching real metrics from GA4 and Search Console...\n';

    // Query last 7 days of real data
    const endDate = new Date().toISOString().split('T')[0];
    const startDateObj = new Date();
    startDateObj.setDate(startDateObj.getDate() - 7);
    const startDate = startDateObj.toISOString().split('T')[0];

    // A. Sync GA4
    log += `Fetching GA4 metrics for Property ${propertyId} from ${startDate} to ${endDate}...\n`;
    const ga4Data = await fetchGA4Metrics(startDate, endDate, {
      clientEmail,
      privateKey,
      propertyId
    });
    log += `Fetched ${ga4Data.length} records from GA4.\n`;

    let itemsSynced = 0;
    let metricsSynced = 0;

    for (const record of ga4Data) {
      // Clean pagepath and build URL
      const cleanPath = record.pagePath.split('?')[0];
      const pageUrl = `${siteUrl.replace(/\/$/, '')}${cleanPath}`;
      
      // Parse publish date - default to today or format date
      const dateRaw = record.date; // YYYYMMDD
      const dateFormatted = `${dateRaw.slice(0, 4)}-${dateRaw.slice(4, 6)}-${dateRaw.slice(6, 8)}`;

      // Try to find if content item already exists in DB
      let contentRes = await query(
        'SELECT content_id FROM content_items WHERE url = $1',
        [pageUrl]
      );

      let contentId: number;

      if (contentRes.rows.length === 0) {
        // Insert new content item
        const insRes = await query(
          `INSERT INTO content_items (title, channel, format, publish_date, author, url)
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING content_id`,
          [
            record.pageTitle || `Web Page ${cleanPath}`,
            'web',
            'article',
            dateFormatted,
            'Staff Writer',
            pageUrl
          ]
        );
        contentId = insRes.rows[0].content_id;
        itemsSynced++;

        // Add a default topic 'Web Performance' or based on title
        let topic = 'Web Performance';
        if (record.pageTitle.toLowerCase().includes('next.js') || record.pageTitle.toLowerCase().includes('nextjs')) {
          topic = 'Next.js Best Practices';
        } else if (record.pageTitle.toLowerCase().includes('ai') || record.pageTitle.toLowerCase().includes('gemini')) {
          topic = 'AI Engineering';
        }
        await query(
          'INSERT INTO content_item_taxonomy (content_id, topic) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [contentId, topic]
        );
      } else {
        contentId = contentRes.rows[0].content_id;
      }

      // Save/update metrics
      const engagement = record.avgSessionDuration > 10 ? 0.75 : 0.25;
      await query(
        `INSERT INTO content_metrics_daily (
          content_id, date, views, engagement_rate, avg_time_on_page, conversions, conversion_value
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (content_id, date) DO UPDATE SET
          views = EXCLUDED.views,
          conversions = EXCLUDED.conversions,
          avg_time_on_page = EXCLUDED.avg_time_on_page`,
        [contentId, dateFormatted, record.views, engagement, record.avgSessionDuration, record.conversions, record.conversions * 49.00]
      );
      metricsSynced++;
    }

    // B. Sync Search Console
    log += `Fetching Search Console metrics for site ${siteUrl} from ${startDate} to ${endDate}...\n`;
    const gscData = await fetchSearchConsoleMetrics(startDate, endDate, {
      clientEmail,
      privateKey,
      siteUrl
    });
    log += `Fetched ${gscData.length} query records from Search Console.\n`;

    let gapsDetected = 0;
    for (const record of gscData) {
      // Find matching content item in our DB by matching the page URL
      const contentRes = await query(
        'SELECT content_id FROM content_items WHERE url = $1',
        [record.pageUrl]
      );

      const matchedContentId = contentRes.rows[0]?.content_id || null;
      if (matchedContentId === null) {
        gapsDetected++;
      }

      // Save queries
      await query(
        `INSERT INTO search_queries (query, date, impressions, clicks, position, matched_content_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [record.query, record.date, record.impressions, record.clicks, record.position, matchedContentId]
      );
    }

    log += `Ingestion sync completed. Synced ${ga4Data.length} GA4 items and ${gscData.length} search queries. Identified ${gapsDetected} content gap keywords.\n`;

    return {
      success: true,
      log,
      summary: {
        itemsSynced,
        metricsSynced,
        gapsDetected
      }
    };
  } catch (err: any) {
    console.error('Ingestion pipeline failed:', err);
    log += `[ERROR] Pipeline crashed: ${err?.message || String(err)}\n`;
    return {
      success: false,
      log,
      summary: { itemsSynced: 0, metricsSynced: 0, gapsDetected: 0 }
    };
  }
}

/**
 * Mock function to represent how live API credentials would be validated
 */
export async function testConnectorCredentials(
  source: 'ga4' | 'gsc' | 'youtube' | 'newsletter',
  credentials: any
): Promise<{ success: boolean; message: string }> {
  await new Promise(resolve => setTimeout(resolve, 800));

  if (!credentials || Object.values(credentials).some(v => v === '')) {
    return { success: false, message: 'Invalid credentials. Missing required parameters.' };
  }

  if (source === 'ga4' && !credentials.propertyId) {
    return { success: false, message: 'Property ID is required.' };
  }
  
  return { success: true, message: `Successfully connected to ${source.toUpperCase()} API.` };
}
