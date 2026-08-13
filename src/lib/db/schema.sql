-- PostgreSQL schema definitions for ContentPulse

-- 1. Content Items Table
CREATE TABLE IF NOT EXISTS content_items (
    content_id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    channel VARCHAR(50) NOT NULL, -- 'web', 'youtube', 'newsletter', 'social'
    format VARCHAR(50) NOT NULL,  -- 'article', 'video', 'newsletter', 'social_post'
    word_count INTEGER,           -- nullable for video/social
    duration INTEGER,             -- duration in seconds (for video, nullable for others)
    publish_date DATE NOT NULL,
    author VARCHAR(100) NOT NULL,
    url TEXT NOT NULL,
    derived_from INTEGER REFERENCES content_items(content_id) ON DELETE SET NULL
);

-- 2. Daily Metrics Table
CREATE TABLE IF NOT EXISTS content_metrics_daily (
    id SERIAL PRIMARY KEY,
    content_id INTEGER NOT NULL REFERENCES content_items(content_id) ON DELETE CASCADE,
    date DATE NOT NULL,
    views INTEGER NOT NULL DEFAULT 0,
    engagement_rate NUMERIC(6,4) NOT NULL DEFAULT 0.0, -- e.g. 0.8521 (85.21%)
    avg_time_on_page INTEGER DEFAULT 0,                 -- in seconds (avg watch time for video, avg time on page for articles)
    conversions INTEGER NOT NULL DEFAULT 0,
    conversion_value NUMERIC(10,2) NOT NULL DEFAULT 0.0,
    search_impressions INTEGER NOT NULL DEFAULT 0,
    search_clicks INTEGER NOT NULL DEFAULT 0,
    avg_search_position NUMERIC(5,2),
    CONSTRAINT unique_content_date UNIQUE (content_id, date)
);

-- 3. Content Taxonomy Table
CREATE TABLE IF NOT EXISTS content_taxonomy (
    topic VARCHAR(100) PRIMARY KEY,
    parent_category VARCHAR(100),
    first_published DATE
);

-- 4. Content Item Taxonomy Mapping
CREATE TABLE IF NOT EXISTS content_item_taxonomy (
    content_id INTEGER NOT NULL REFERENCES content_items(content_id) ON DELETE CASCADE,
    topic VARCHAR(100) NOT NULL REFERENCES content_taxonomy(topic) ON DELETE CASCADE,
    PRIMARY KEY (content_id, topic)
);

-- 5. Audience Segments Table
CREATE TABLE IF NOT EXISTS audience_segments (
    segment_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    definition TEXT
);

-- 6. Content Segment Metrics Daily
CREATE TABLE IF NOT EXISTS content_segment_metrics_daily (
    id SERIAL PRIMARY KEY,
    content_id INTEGER NOT NULL REFERENCES content_items(content_id) ON DELETE CASCADE,
    segment_id VARCHAR(50) NOT NULL REFERENCES audience_segments(segment_id) ON DELETE CASCADE,
    date DATE NOT NULL,
    views INTEGER NOT NULL DEFAULT 0,
    conversions INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT unique_content_segment_date UNIQUE (content_id, segment_id, date)
);

-- 7. Search Queries Table
CREATE TABLE IF NOT EXISTS search_queries (
    id SERIAL PRIMARY KEY,
    query VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    impressions INTEGER NOT NULL DEFAULT 0,
    clicks INTEGER NOT NULL DEFAULT 0,
    position NUMERIC(5,2) NOT NULL,
    matched_content_id INTEGER REFERENCES content_items(content_id) ON DELETE SET NULL
);

-- 8. Editorial Reports Archive Table
CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    title VARCHAR(255) NOT NULL,
    narrative TEXT NOT NULL,
    metrics_summary JSONB NOT NULL
);

INSERT INTO content_taxonomy (topic) VALUES 
('AI Engineering'), 
('Next.js Best Practices'), 
('SaaS Marketing'), 
('Career in Tech'), 
('Web Performance'),
('Entertainment'),
('Gaming'),
('Comedy & Humor'),
('Education & Science'),
('Tech Reviews'),
('Lifestyle & Vlogs'),
('Charity & Philanthropy'),
('General Entertainment'),
('Product Management'),
('Design & UX'),
('Finance & Investing'),
('Health & Wellness'),
('Travel & Culture'),
('Food & Culinary'),
('Music & Performing Arts'),
('Startups & Venture Capital'),
('Software Architecture'),
('Cloud Computing & DevOps')
ON CONFLICT DO NOTHING;

INSERT INTO audience_segments (segment_id, name) VALUES 
('new', 'New Visitors'), 
('returning', 'Returning Visitors'), 
('enterprise', 'Enterprise Leads')
ON CONFLICT DO NOTHING;
