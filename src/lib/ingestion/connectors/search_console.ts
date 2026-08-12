import { google } from 'googleapis';

export interface GSCDailyQueryMetric {
  query: string;
  pageUrl: string;
  date: string; // YYYY-MM-DD
  impressions: number;
  clicks: number;
  position: number;
}

/**
 * Fetches real Search Console query performance data
 */
export async function fetchSearchConsoleMetrics(
  startDate: string, // YYYY-MM-DD
  endDate: string,   // YYYY-MM-DD
  config: {
    clientEmail: string;
    privateKey: string;
    siteUrl: string;
  }
): Promise<GSCDailyQueryMetric[]> {
  const { clientEmail, privateKey, siteUrl } = config;

  if (!clientEmail || !privateKey || !siteUrl) {
    throw new Error('Search Console Ingestion failed: Missing clientEmail, privateKey, or siteUrl.');
  }

  const formattedKey = privateKey.replace(/\\n/g, '\n');

  // Authenticate with Search Console (Webmasters API)
  const auth = new google.auth.JWT({
    email: clientEmail,
    key: formattedKey,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly']
  });

  const webmasters = google.webmasters({
    version: 'v3',
    auth
  });

  console.log(`Querying GSC API for site ${siteUrl} from ${startDate} to ${endDate}...`);

  // GSC API supports querying search analytics
  const response = await webmasters.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate,
      endDate,
      dimensions: ['query', 'page', 'date'],
      rowLimit: 5000
    }
  });

  const rows = response.data.rows || [];
  const metrics: GSCDailyQueryMetric[] = [];

  for (const row of rows) {
    // The keys are returned in the order of the dimensions requested: query, page, date
    const queryTerm = row.keys?.[0] || '';
    const pageUrl = row.keys?.[1] || '';
    const dateStr = row.keys?.[2] || ''; // YYYY-MM-DD

    const clicks = row.clicks || 0;
    const impressions = row.impressions || 0;
    const position = row.position || 0;

    metrics.push({
      query: queryTerm,
      pageUrl,
      date: dateStr,
      impressions,
      clicks,
      position
    });
  }

  return metrics;
}
