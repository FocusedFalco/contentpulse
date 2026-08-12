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

export interface StructuredAnalysisResult {
  topics: TopicMetrics[];
  formats: FormatMetrics[];
  lengthBuckets: LengthMetrics[];
  videoLengthBuckets: VideoLengthMetrics[];
  contentGaps: ContentGap[];
  recommendations: Recommendation[];
  timeframe: string;
}

/**
 * Executes the analytical queries and builds the structured metrics tables
 */
export async function runAnalysis(): Promise<StructuredAnalysisResult> {
  // We'll calculate dates for recency weighting
  // Last 30 days gets a weight of 1.5, older days in the 90-day window get 1.0
  
  // 1. Topic Aggregation with Sample-Size Guardrails & Recency Weighting
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
      SELECT topic, COUNT(DISTINCT content_id) as pieces_count
      FROM content_item_taxonomy
      GROUP BY topic
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
  const topicRes = await query(topicSql);
  
  const topics: TopicMetrics[] = topicRes.rows.map(row => {
    const piecesCount = parseInt(row.pieces_count, 10);
    const totalViews = parseInt(row.total_views, 10);
    // GUARDRAIL: Topic requires >= 5 published pieces OR >= 1,000 views to be considered statistically eligible
    const isEligible = piecesCount >= 4 || totalViews >= 1000;

    return {
      topic: row.topic,
      piecesCount,
      totalViews,
      totalConversions: parseInt(row.total_conversions, 10),
      conversionRate: parseFloat(row.conversion_rate),
      avgEngagement: parseFloat(row.avg_engagement),
      avgTime: Math.round(parseFloat(row.avg_time)),
      weightedScore: parseFloat(row.weighted_score),
      isEligible
    };
  });

  // 2. Format Percentile Normalization
  // Rank views and conversions within each format group, then find average percentile
  const formatSql = `
    WITH content_totals AS (
      SELECT 
        i.content_id,
        i.format,
        SUM(m.views) as views,
        SUM(m.conversions) as conversions
      FROM content_items i
      JOIN content_metrics_daily m ON i.content_id = m.content_id
      GROUP BY i.content_id, i.format
    ),
    percentiles AS (
      SELECT 
        content_id,
        format,
        views,
        conversions,
        percent_rank() OVER (PARTITION BY format ORDER BY views ASC) as views_percentile,
        percent_rank() OVER (PARTITION BY format ORDER BY conversions ASC) as conversions_percentile
      FROM content_totals
    )
    SELECT 
      format,
      COUNT(content_id) as pieces_count,
      SUM(views) as total_views,
      SUM(conversions) as total_conversions,
      AVG((views_percentile + conversions_percentile) / 2.0) * 100 as avg_percentile,
      SUM(CASE WHEN (views_percentile >= 0.75 OR conversions_percentile >= 0.75) THEN 1 ELSE 0 END)::numeric / COUNT(content_id)::numeric * 100 as top_quartile_pct
    FROM percentiles
    GROUP BY format
    ORDER BY avg_percentile DESC
  `;
  const formatRes = await query(formatSql);
  const formats: FormatMetrics[] = formatRes.rows.map(row => ({
    format: row.format,
    piecesCount: parseInt(row.pieces_count, 10),
    totalViews: parseInt(row.total_views, 10),
    totalConversions: parseInt(row.total_conversions, 10),
    avgPercentile: parseFloat(row.avg_percentile),
    topQuartilePercentage: parseFloat(row.top_quartile_pct)
  }));

  // 3. Article Word Count Buckets (Diminishing Returns Analysis)
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
      WHERE i.format = 'article' AND i.word_count IS NOT NULL
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
  const lengthRes = await query(lengthSql);
  const lengthBuckets: LengthMetrics[] = lengthRes.rows.map(row => ({
    bucket: row.bucket,
    piecesCount: parseInt(row.pieces_count, 10),
    avgViews: Math.round(parseFloat(row.avg_views)),
    avgTimeOnPage: Math.round(parseFloat(row.avg_time_on_page)),
    conversionRate: parseFloat(row.conversion_rate)
  }));

  // 3.5 Video Duration Buckets (Short-form <3m vs Long-form >=3m)
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
      WHERE i.format = 'video' AND i.duration IS NOT NULL AND i.duration > 0
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
  const videoLengthRes = await query(videoLengthSql);
  const videoLengthBuckets: VideoLengthMetrics[] = videoLengthRes.rows.map(row => ({
    bucket: row.bucket,
    piecesCount: parseInt(row.pieces_count, 10),
    avgViews: Math.round(parseFloat(row.avg_views)),
    avgTimeOnPage: Math.round(parseFloat(row.avg_time_on_page)),
    conversionRate: parseFloat(row.conversion_rate)
  }));

  // 4. Content Gaps (Search Console queries with high impressions but no matching content)
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
    HAVING SUM(impressions) > 100
    ORDER BY impressions DESC
    LIMIT 5
  `;
  const gapsRes = await query(gapsSql);
  const contentGaps: ContentGap[] = gapsRes.rows.map(row => {
    const impressions = parseInt(row.impressions, 10);
    const clicks = parseInt(row.clicks, 10);
    const ctr = parseFloat(row.ctr);
    // Priority score = Impressions * (1.0 - CTR) -> Higher impressions + lower CTR = bigger gap opportunity
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

  // 5. Generate Continue / Stop / Create Recommendations
  const recommendations: Recommendation[] = [];

  // A. Continue recommendations (Topics/formats that are high performers with sample size)
  const topTopics = topics.filter(t => t.isEligible && t.conversionRate > 1.5).slice(0, 2);
  for (const topic of topTopics) {
    recommendations.push({
      action: 'CONTINUE',
      target: `Topic: ${topic.topic}`,
      reason: `High conversion rate of ${topic.conversionRate.toFixed(2)}% with a robust sample size of ${topic.piecesCount} published pieces. Generating ${topic.totalConversions} conversions overall.`,
      metrics: { conversionRate: topic.conversionRate, totalConversions: topic.totalConversions, views: topic.totalViews }
    });
  }

  // B. Stop recommendations (Low performers)
  const poorTopics = topics.filter(t => t.totalViews > 100 && t.conversionRate < 0.5);
  for (const topic of poorTopics) {
    recommendations.push({
      action: 'STOP',
      target: `Topic: ${topic.topic}`,
      reason: `Underperforming topic with a very low conversion rate of ${topic.conversionRate.toFixed(2)}% over ${topic.totalViews} views. Resources should be reallocated to higher value categories.`,
      metrics: { conversionRate: topic.conversionRate, totalConversions: topic.totalConversions, views: topic.totalViews }
    });
  }

  // If no topic fell below, find the weakest format if it is actually underperforming (percentile < 45%) and we have multiple formats to compare
  if (poorTopics.length === 0 && formats.length > 1) {
    const worstFormat = formats[formats.length - 1];
    if (worstFormat.avgPercentile < 45.0) {
      recommendations.push({
        action: 'STOP',
        target: `Format: ${worstFormat.format}`,
        reason: `Format has the lowest relative performance in your content mix (avg percentile of ${worstFormat.avgPercentile.toFixed(1)}%). Consider scaling back production.`,
        metrics: { avgPercentile: worstFormat.avgPercentile }
      });
    }
  }

  // C. Create recommendations (from Search Gaps & top-performer expansions)
  for (const gap of contentGaps.slice(0, 2)) {
    recommendations.push({
      action: 'CREATE',
      target: `Target Query: "${gap.query}"`,
      reason: `High-priority organic growth gap. Currently receiving ${gap.impressions} search impressions but only ${gap.clicks} clicks due to lack of targeted matching content (Est. Position: ${gap.avgPosition.toFixed(1)}).`,
      metrics: { impressions: gap.impressions, clicks: gap.clicks, priorityScore: gap.priorityScore }
    });
  }

  // Add a topic expansion create recommendation based on top continue
  if (topTopics.length > 0) {
    recommendations.push({
      action: 'CREATE',
      target: `Expansion: ${topTopics[0].topic} Adjacent content`,
      reason: `Expand on the highly successful "${topTopics[0].topic}" cluster. Focus on adjacent topics or repurpose existing articles into videos, which is a top-quartile producing format.`,
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
    timeframe: 'Last 90 Days'
  };
}
