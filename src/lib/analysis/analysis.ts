import { query } from '../db/db';

export interface TopicMetrics {
  topic: string;
  piecesCount: number;
  totalViews: number;
  totalConversions: number;
  conversionRate: number;
  avgEngagement: number;
  avgTime: number;
  weightedScore: number; // recency-weighted score
  isEligible: boolean; // meets sample-size guardrails
}

export interface FormatMetrics {
  format: string;
  piecesCount: number;
  totalViews: number;
  totalConversions: number;
  avgPercentile: number;
  topQuartilePercentage: number;
}

export interface LengthMetrics {
  bucket: string;
  piecesCount: number;
  avgViews: number;
  avgTimeOnPage: number;
  conversionRate: number;
}

export interface VideoLengthMetrics {
  bucket: string;
  piecesCount: number;
  avgViews: number;
  avgTimeOnPage: number;
  conversionRate: number;
}

export interface ContentGap {
  query: string;
  impressions: number;
  clicks: number;
  ctr: number;
  avgPosition: number;
  priorityScore: number;
}

export interface Recommendation {
  action: 'CONTINUE' | 'STOP' | 'CREATE';
  target: string; // e.g. Topic + Format combo, or Search Query
  reason: string;
  metrics?: any;
}

export interface ContentItemSummary {
  content_id: number;
  title: string;
  channel: string;
  format: string;
  word_count: number | null;
  duration: number | null;
  publish_date: string;
  author: string;
  url: string;
  topic?: string;
  views: number;
  conversions: number;
  engagement_rate: number;
}

export interface ChannelInfo {
  channel: string;
  label: string;
  count: number;
  views: number;
}

export interface ChannelSummary {
  channel: string;
  totalViews: number;
  totalConversions: number;
  conversionRate: number;
  piecesCount: number;
  avgEngagement: number;
  avgTime: number;
  searchImpressions: number;
  searchClicks: number;
}

export interface StructuredAnalysisResult {
  topics: TopicMetrics[];
  formats: FormatMetrics[];
  lengthBuckets: LengthMetrics[];
  videoLengthBuckets: VideoLengthMetrics[];
  contentGaps: ContentGap[];
  recommendations: Recommendation[];
  timeframe: string;
  channel: string;
  availableChannels: ChannelInfo[];
  channelSummary: ChannelSummary;
  topItems: ContentItemSummary[];
}

/**
 * Executes analytical queries and builds structured metrics, optionally filtered by channel
 */
export async function runAnalysis(channelFilter: string = 'all'): Promise<StructuredAnalysisResult> {
  const selectedChannel = channelFilter.toLowerCase().trim();
  const isAll = selectedChannel === 'all' || !selectedChannel;

  // Ensure expanded taxonomy topics exist in the database
  try {
    const { ensureExpandedTaxonomy } = await import('../gemini/gemini');
    await ensureExpandedTaxonomy();

    // Reclassify any misclassified items
    await query(`
      UPDATE content_item_taxonomy 
      SET topic = 'Charity & Philanthropy' 
      WHERE content_id IN (
        SELECT content_id FROM content_items 
        WHERE title ILIKE '%surgery%' OR title ILIKE '%clinic%' OR title ILIKE '%charity%' OR author ILIKE '%philanthropy%' OR title ILIKE '%lives%' OR title ILIKE '%slaves%'
      );

      UPDATE content_item_taxonomy 
      SET topic = 'Entertainment & Challenges' 
      WHERE content_id IN (
        SELECT content_id FROM content_items 
        WHERE (title ILIKE '%beast%' OR title ILIKE '%challenge%' OR title ILIKE '%albertsons%' OR title ILIKE '%trapping%' OR title ILIKE '%youtubers%')
        AND content_id NOT IN (SELECT content_id FROM content_item_taxonomy WHERE topic = 'Charity & Philanthropy')
      );
    `);
  } catch (e) {
    // Ignore migration error
  }

  // 1. Fetch available channels in the database
  const channelsRes = await query(`
    SELECT 
      LOWER(i.channel) as channel,
      COUNT(DISTINCT i.content_id)::int as count,
      COALESCE(SUM(m.views), 0)::int as views
    FROM content_items i
    LEFT JOIN content_metrics_daily m ON i.content_id = m.content_id
    GROUP BY LOWER(i.channel)
    ORDER BY views DESC
  `);

  const channelLabelMap: Record<string, string> = {
    web: 'Web Pages',
    social: 'Social Media',
    newsletter: 'Newsletter',
    youtube: 'YouTube Video'
  };

  const availableChannels: ChannelInfo[] = channelsRes.rows.map(r => ({
    channel: r.channel,
    label: channelLabelMap[r.channel] || r.channel.toUpperCase(),
    count: parseInt(r.count, 10),
    views: parseInt(r.views, 10)
  }));

  // Add 'all' channel to available list
  const totalAllViews = availableChannels.reduce((acc, c) => acc + c.views, 0);
  const totalAllPieces = availableChannels.reduce((acc, c) => acc + c.count, 0);

  const isSocial = selectedChannel === 'social';

  // 2. Topic Aggregation with Sample-Size Guardrails & Recency Weighting
  const topicFilterClause = isAll ? '' : (isSocial ? "WHERE LOWER(i.channel) IN ('social', 'youtube')" : 'WHERE LOWER(i.channel) = $1');
  const topicParams = isAll || isSocial ? [] : [selectedChannel];

  const topicSql = `
    WITH raw_daily AS (
      SELECT 
        t.topic,
        m.date,
        m.views,
        m.conversions,
        m.engagement_rate,
        m.avg_time_on_page,
        CASE 
          WHEN m.date >= CURRENT_DATE - INTERVAL '30 days' THEN 1.5
          ELSE 1.0
        END as recency_weight
      FROM content_item_taxonomy t
      JOIN content_items i ON t.content_id = i.content_id
      JOIN content_metrics_daily m ON i.content_id = m.content_id
      ${topicFilterClause}
    ),
    topic_aggregates AS (
      SELECT 
        topic,
        SUM(views) as total_views,
        SUM(conversions) as total_conversions,
        SUM(views * recency_weight) as weighted_views,
        SUM(conversions * recency_weight) as weighted_conversions,
        AVG(engagement_rate) as avg_engagement,
        AVG(avg_time_on_page) as avg_time
      FROM raw_daily
      GROUP BY topic
    ),
    pieces_count AS (
      SELECT t.topic, COUNT(DISTINCT t.content_id) as pieces_count
      FROM content_item_taxonomy t
      JOIN content_items i ON t.content_id = i.content_id
      ${topicFilterClause}
      GROUP BY t.topic
    )
    SELECT 
      a.topic,
      p.pieces_count,
      a.total_views,
      a.total_conversions,
      CASE WHEN a.total_views > 0 THEN (a.total_conversions::numeric / a.total_views::numeric) * 100 ELSE 0 END as conversion_rate,
      a.avg_engagement,
      a.avg_time,
      CASE WHEN a.weighted_views > 0 THEN (a.weighted_conversions::numeric / a.weighted_views::numeric) * 100 ELSE 0 END as weighted_score
    FROM topic_aggregates a
    JOIN pieces_count p ON a.topic = p.topic
    ORDER BY weighted_score DESC
  `;
  const topicRes = await query(topicSql, topicParams);
  
  const topics: TopicMetrics[] = topicRes.rows.map(row => {
    const piecesCount = parseInt(row.pieces_count, 10);
    const totalViews = parseInt(row.total_views, 10);
    const isEligible = piecesCount >= 3 || totalViews >= 500;

    return {
      topic: row.topic,
      piecesCount,
      totalViews,
      totalConversions: parseInt(row.total_conversions, 10),
      conversionRate: parseFloat(row.conversion_rate),
      avgEngagement: parseFloat(row.avg_engagement || '0'),
      avgTime: Math.round(parseFloat(row.avg_time || '0')),
      weightedScore: parseFloat(row.weighted_score || '0'),
      isEligible
    };
  });

  // 3. Format Percentile Normalization
  const formatFilterClause = isAll ? '' : (isSocial ? "WHERE LOWER(i.channel) IN ('social', 'youtube')" : 'WHERE LOWER(i.channel) = $1');
  const formatParams = isAll || isSocial ? [] : [selectedChannel];

  const formatSql = `
    WITH content_totals AS (
      SELECT 
        i.content_id,
        i.format,
        SUM(m.views) as views,
        SUM(m.conversions) as conversions
      FROM content_items i
      JOIN content_metrics_daily m ON i.content_id = m.content_id
      ${formatFilterClause}
      GROUP BY i.content_id, i.format
    ),
    percentiles AS (
      SELECT 
        content_id,
        format,
        views,
        conversions,
        percent_rank() OVER (ORDER BY views ASC) as views_percentile,
        percent_rank() OVER (ORDER BY conversions ASC) as conversions_percentile
      FROM content_totals
    )
    SELECT 
      format,
      COUNT(content_id) as pieces_count,
      SUM(views) as total_views,
      SUM(conversions) as total_conversions,
      AVG((views_percentile + conversions_percentile) / 2.0) * 100 as avg_percentile,
      SUM(CASE WHEN (views_percentile >= 0.75 OR conversions_percentile >= 0.75) THEN 1 ELSE 0 END)::numeric / GREATEST(COUNT(content_id), 1)::numeric * 100 as top_quartile_pct
    FROM percentiles
    GROUP BY format
    ORDER BY avg_percentile DESC
  `;
  const formatRes = await query(formatSql, formatParams);
  const formats: FormatMetrics[] = formatRes.rows.map(row => ({
    format: row.format,
    piecesCount: parseInt(row.pieces_count, 10),
    totalViews: parseInt(row.total_views, 10),
    totalConversions: parseInt(row.total_conversions, 10),
    avgPercentile: parseFloat(row.avg_percentile || '50'),
    topQuartilePercentage: parseFloat(row.top_quartile_pct || '0')
  }));

  // 4. Article Word Count Buckets (Diminishing Returns Analysis)
  const lengthFilter = isAll ? "WHERE i.format = 'article' AND i.word_count IS NOT NULL" : "WHERE i.format = 'article' AND i.word_count IS NOT NULL AND LOWER(i.channel) = $1";
  const lengthParams = isAll ? [] : [selectedChannel];

  const lengthSql = `
    WITH article_totals AS (
      SELECT 
        i.content_id,
        i.word_count,
        SUM(m.views) as views,
        SUM(m.conversions) as conversions,
        AVG(m.avg_time_on_page) as avg_time
      FROM content_items i
      JOIN content_metrics_daily m ON i.content_id = m.content_id
      ${lengthFilter}
      GROUP BY i.content_id, i.word_count
    ),
    bucketed AS (
      SELECT 
        CASE 
          WHEN word_count < 600 THEN '<600 words'
          WHEN word_count >= 600 AND word_count < 1200 THEN '600-1200 words'
          WHEN word_count >= 1200 AND word_count < 2000 THEN '1200-2000 words'
          ELSE '2000+ words'
        END as bucket,
        views,
        conversions,
        avg_time
      FROM article_totals
    )
    SELECT 
      bucket,
      COUNT(*) as pieces_count,
      AVG(views) as avg_views,
      AVG(avg_time) as avg_time_on_page,
      CASE WHEN SUM(views) > 0 THEN (SUM(conversions)::numeric / SUM(views)::numeric) * 100 ELSE 0 END as conversion_rate
    FROM bucketed
    GROUP BY bucket
    ORDER BY 
      CASE bucket
        WHEN '<600 words' THEN 1
        WHEN '600-1200 words' THEN 2
        WHEN '1200-2000 words' THEN 3
        ELSE 4
      END
  `;
  const lengthRes = await query(lengthSql, lengthParams);
  const lengthBuckets: LengthMetrics[] = lengthRes.rows.map(row => ({
    bucket: row.bucket,
    piecesCount: parseInt(row.pieces_count, 10),
    avgViews: Math.round(parseFloat(row.avg_views || '0')),
    avgTimeOnPage: Math.round(parseFloat(row.avg_time_on_page || '0')),
    conversionRate: parseFloat(row.conversion_rate || '0')
  }));

  // 5. Video Duration Buckets (Short-form <3m vs Long-form >=3m)
  const videoFilter = isAll ? "WHERE i.format = 'video' AND i.duration IS NOT NULL AND i.duration > 0" : "WHERE i.format = 'video' AND i.duration IS NOT NULL AND i.duration > 0 AND LOWER(i.channel) = $1";
  const videoParams = isAll ? [] : [selectedChannel];

  const videoLengthSql = `
    WITH video_totals AS (
      SELECT 
        i.content_id,
        i.duration,
        SUM(m.views) as views,
        SUM(m.conversions) as conversions,
        AVG(m.avg_time_on_page) as avg_time
      FROM content_items i
      JOIN content_metrics_daily m ON i.content_id = m.content_id
      ${videoFilter}
      GROUP BY i.content_id, i.duration
    ),
    bucketed AS (
      SELECT 
        CASE 
          WHEN duration <= 180 THEN '9:16 (Short-form)'
          ELSE '16:9 (Long-form)'
        END as bucket,
        views,
        conversions,
        avg_time
      FROM video_totals
    )
    SELECT 
      bucket,
      COUNT(*) as pieces_count,
      AVG(views) as avg_views,
      AVG(avg_time) as avg_time_on_page,
      CASE WHEN SUM(views) > 0 THEN (SUM(conversions)::numeric / SUM(views)::numeric) * 100 ELSE 0 END as conversion_rate
    FROM bucketed
    GROUP BY bucket
    ORDER BY 
      CASE bucket
        WHEN '9:16 (Short-form)' THEN 1
        ELSE 2
      END
  `;
  const videoLengthRes = await query(videoLengthSql, videoParams);
  const videoLengthBuckets: VideoLengthMetrics[] = videoLengthRes.rows.map(row => ({
    bucket: row.bucket,
    piecesCount: parseInt(row.pieces_count, 10),
    avgViews: Math.round(parseFloat(row.avg_views || '0')),
    avgTimeOnPage: Math.round(parseFloat(row.avg_time_on_page || '0')),
    conversionRate: parseFloat(row.conversion_rate || '0')
  }));

  // 6. Content Gaps (Search Console queries)
  const gapsSql = `
    SELECT 
      query,
      SUM(impressions) as impressions,
      SUM(clicks) as clicks,
      CASE WHEN SUM(impressions) > 0 THEN (SUM(clicks)::numeric / SUM(impressions)::numeric) * 100 ELSE 0 END as ctr,
      AVG(position) as avg_position
    FROM search_queries
    WHERE matched_content_id IS NULL
    GROUP BY query
    HAVING SUM(impressions) > 50
    ORDER BY impressions DESC
    LIMIT 5
  `;
  const gapsRes = await query(gapsSql);
  const contentGaps: ContentGap[] = gapsRes.rows.map(row => {
    const impressions = parseInt(row.impressions, 10);
    const clicks = parseInt(row.clicks, 10);
    const ctr = parseFloat(row.ctr);
    const priorityScore = Math.round(impressions * (1.0 - (ctr / 100)));

    return {
      query: row.query,
      impressions,
      clicks,
      ctr,
      avgPosition: parseFloat(row.avg_position),
      priorityScore
    };
  });

  // 7. Top Content Items for Selected Channel
  const topItemsFilter = isAll ? '' : (isSocial ? "WHERE LOWER(c.channel) IN ('social', 'youtube')" : 'WHERE LOWER(c.channel) = $1');
  const topItemsParams = isAll || isSocial ? [] : [selectedChannel];

  const topItemsRes = await query(`
    SELECT 
      c.content_id, 
      c.title, 
      c.channel, 
      c.format, 
      c.word_count, 
      c.duration, 
      c.publish_date, 
      c.author, 
      c.url,
      t.topic,
      COALESCE(SUM(m.views), 0)::int AS views,
      COALESCE(SUM(m.conversions), 0)::int AS conversions,
      COALESCE(AVG(m.engagement_rate), 0)::float AS engagement_rate
    FROM content_items c
    LEFT JOIN content_item_taxonomy t ON c.content_id = t.content_id
    LEFT JOIN content_metrics_daily m ON c.content_id = m.content_id
    ${topItemsFilter}
    GROUP BY c.content_id, c.title, c.channel, c.format, c.word_count, c.duration, c.publish_date, c.author, c.url, t.topic
    ORDER BY views DESC
    LIMIT 12
  `, topItemsParams);

  const topItems: ContentItemSummary[] = topItemsRes.rows.map(r => ({
    content_id: r.content_id,
    title: r.title,
    channel: r.channel,
    format: r.format,
    word_count: r.word_count,
    duration: r.duration,
    publish_date: r.publish_date ? new Date(r.publish_date).toISOString().split('T')[0] : '',
    author: r.author,
    url: r.url,
    topic: r.topic,
    views: parseInt(r.views, 10),
    conversions: parseInt(r.conversions, 10),
    engagement_rate: parseFloat(r.engagement_rate)
  }));

  // 8. Channel Summary Metrics Aggregation
  const summaryFilter = isAll ? '' : (isSocial ? "WHERE LOWER(i.channel) IN ('social', 'youtube')" : 'WHERE LOWER(i.channel) = $1');
  const summaryParams = isAll || isSocial ? [] : [selectedChannel];

  const summaryRes = await query(`
    SELECT 
      COALESCE(SUM(m.views), 0)::int as total_views,
      COALESCE(SUM(m.conversions), 0)::int as total_conversions,
      COALESCE(AVG(m.engagement_rate), 0)::float as avg_engagement,
      COALESCE(AVG(m.avg_time_on_page), 0)::float as avg_time,
      COALESCE(SUM(m.search_impressions), 0)::int as search_impressions,
      COALESCE(SUM(m.search_clicks), 0)::int as search_clicks,
      COUNT(DISTINCT i.content_id)::int as pieces_count
    FROM content_items i
    LEFT JOIN content_metrics_daily m ON i.content_id = m.content_id
    ${summaryFilter}
  `, summaryParams);

  const summaryRow = summaryRes.rows[0] || {};
  const totalViews = parseInt(summaryRow.total_views || '0', 10);
  const totalConversions = parseInt(summaryRow.total_conversions || '0', 10);
  const piecesCount = parseInt(summaryRow.pieces_count || '0', 10);
  const conversionRate = totalViews > 0 ? (totalConversions / totalViews) * 100 : 0;

  const channelSummary: ChannelSummary = {
    channel: selectedChannel,
    totalViews,
    totalConversions,
    conversionRate,
    piecesCount,
    avgEngagement: parseFloat(summaryRow.avg_engagement || '0'),
    avgTime: Math.round(parseFloat(summaryRow.avg_time || '0')),
    searchImpressions: parseInt(summaryRow.search_impressions || '0', 10),
    searchClicks: parseInt(summaryRow.search_clicks || '0', 10)
  };

  // 9. Generate Continue / Stop / Create Recommendations
  const recommendations: Recommendation[] = [];

  const topTopics = topics.filter(t => t.isEligible && t.conversionRate > 1.2).slice(0, 2);
  for (const topic of topTopics) {
    recommendations.push({
      action: 'CONTINUE',
      target: `Topic: ${topic.topic}`,
      reason: `High conversion rate of ${topic.conversionRate.toFixed(2)}% with ${topic.piecesCount} pieces published. Generated ${topic.totalConversions} conversions in ${selectedChannel.toUpperCase()}.`,
      metrics: { conversionRate: topic.conversionRate, totalConversions: topic.totalConversions, views: topic.totalViews }
    });
  }

  const poorTopics = topics.filter(t => t.totalViews > 100 && t.conversionRate < 0.5);
  for (const topic of poorTopics) {
    recommendations.push({
      action: 'STOP',
      target: `Topic: ${topic.topic}`,
      reason: `Underperforming topic with a conversion rate of ${topic.conversionRate.toFixed(2)}% over ${topic.totalViews} views. Resources should be shifted to top quartile themes.`,
      metrics: { conversionRate: topic.conversionRate, totalConversions: topic.totalConversions, views: topic.totalViews }
    });
  }

  if (poorTopics.length === 0 && formats.length > 1) {
    const worstFormat = formats[formats.length - 1];
    if (worstFormat.avgPercentile < 45.0) {
      recommendations.push({
        action: 'STOP',
        target: `Format: ${worstFormat.format}`,
        reason: `Lowest relative performance in ${selectedChannel.toUpperCase()} (avg percentile of ${worstFormat.avgPercentile.toFixed(1)}%). Consider reallocating effort.`,
        metrics: { avgPercentile: worstFormat.avgPercentile }
      });
    }
  }

  if (contentGaps.length > 0 && (isAll || selectedChannel === 'web')) {
    for (const gap of contentGaps.slice(0, 2)) {
      recommendations.push({
        action: 'CREATE',
        target: `Search Gap: "${gap.query}"`,
        reason: `High-priority organic growth opportunity. Received ${gap.impressions} search impressions with low matching content coverage.`,
        metrics: { impressions: gap.impressions, clicks: gap.clicks, priorityScore: gap.priorityScore }
      });
    }
  }

  if (topTopics.length > 0) {
    recommendations.push({
      action: 'CREATE',
      target: `Expand Cluster: ${topTopics[0].topic}`,
      reason: `Double down on the top performing "${topTopics[0].topic}" cluster for ${selectedChannel.toUpperCase()} with new formats or follow-up insights.`,
      metrics: null
    });
  }

  return {
    topics,
    formats,
    lengthBuckets,
    videoLengthBuckets,
    contentGaps,
    recommendations,
    timeframe: 'Last 90 Days',
    channel: selectedChannel,
    availableChannels,
    channelSummary,
    topItems
  };
}
