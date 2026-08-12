import { google } from 'googleapis';

export interface GA4DailyMetric {
  pagePath: string;
  pageTitle: string;
  date: string; // YYYYMMDD
  views: number;
  activeUsers: number;
  avgSessionDuration: number;
  conversions: number;
}

/**
 * Fetches real GA4 metrics using a Service Account JWT auth
 */
export async function fetchGA4Metrics(
  startDate: string, // YYYY-MM-DD
  endDate: string,   // YYYY-MM-DD
  config: {
    clientEmail: string;
    privateKey: string;
    propertyId: string;
  }
): Promise<GA4DailyMetric[]> {
  const { clientEmail, privateKey, propertyId } = config;
  
  if (!clientEmail || !privateKey || !propertyId) {
    throw new Error('GA4 Ingestion failed: Missing clientEmail, privateKey, or propertyId.');
  }

  // Format private key (replace escaped newlines if any)
  const formattedKey = privateKey.replace(/\\n/g, '\n');

  // Authenticate with Google
  const auth = new google.auth.JWT({
    email: clientEmail,
    key: formattedKey,
    scopes: ['https://www.googleapis.com/auth/analytics.readonly']
  });

  const analyticsdata = google.analyticsdata({
    version: 'v1beta',
    auth
  });

  console.log(`Querying GA4 Data API for property ${propertyId} from ${startDate} to ${endDate}...`);

  const response = await analyticsdata.properties.runReport({
    property: `properties/${propertyId}`,
    requestBody: {
      dateRanges: [{ startDate, endDate }],
      dimensions: [
        { name: 'pagePath' },
        { name: 'pageTitle' },
        { name: 'date' }
      ],
      metrics: [
        { name: 'screenPageViews' },
        { name: 'activeUsers' },
        { name: 'averageSessionDuration' },
        { name: 'conversions' }
      ],
      keepEmptyRows: false
    }
  });

  const rows = response.data.rows || [];
  const metrics: GA4DailyMetric[] = [];

  for (const row of rows) {
    const pagePath = row.dimensionValues?.[0]?.value || '';
    const pageTitle = row.dimensionValues?.[1]?.value || '';
    const date = row.dimensionValues?.[2]?.value || ''; // YYYYMMDD

    const views = parseInt(row.metricValues?.[0]?.value || '0', 10);
    const activeUsers = parseInt(row.metricValues?.[1]?.value || '0', 10);
    const avgSessionDuration = Math.round(parseFloat(row.metricValues?.[2]?.value || '0'));
    const conversions = parseInt(row.metricValues?.[3]?.value || '0', 10);

    metrics.push({
      pagePath,
      pageTitle,
      date,
      views,
      activeUsers,
      avgSessionDuration,
      conversions
    });
  }

  return metrics;
}
