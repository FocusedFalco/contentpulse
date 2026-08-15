import { Pool, QueryResult, QueryResultRow } from 'pg';
import fs from 'fs';
import path from 'path';

// Connection string configuration
const connectionString = process.env.DATABASE_URL;

// Ensure pool is cached in Next.js hot-reloads to prevent leak
let pool: Pool;

if (process.env.NODE_ENV === 'production') {
  pool = new Pool({
    connectionString,
    ssl: connectionString?.includes('supabase') || connectionString?.includes('render')
      ? { rejectUnauthorized: false }
      : false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
} else {
  // Prevent multiple pools during development hot reloads
  const globalPool = global as unknown as { _postgresPool?: Pool };
  if (!globalPool._postgresPool) {
    globalPool._postgresPool = new Pool({
      connectionString,
      ssl: connectionString?.includes('supabase')
        ? { rejectUnauthorized: false }
        : false,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000, // longer timeout in dev
    });
  }
  pool = globalPool._postgresPool;
}

export { pool };

export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is missing.');
  }
  const client = await pool.connect();
  try {
    return await client.query<T>(text, params);
  } finally {
    client.release();
  }
}

export async function checkConnection(): Promise<{ connected: boolean; error?: string }> {
  if (!connectionString) {
    return { connected: false, error: 'DATABASE_URL environment variable is not defined.' };
  }
  try {
    const res = await query('SELECT NOW()');
    return { connected: !!res.rows[0] };
  } catch (err: any) {
    console.error('Database connection test failed:', err);
    return { connected: false, error: err?.message || String(err) };
  }
}

export async function initializeDatabase(forceReset = false): Promise<{ success: boolean; log: string }> {
  let log = '';
  try {
    log += 'Verifying database connection...\n';
    const connCheck = await checkConnection();
    if (!connCheck.connected) {
      throw new Error(`Database connection failed: ${connCheck.error}`);
    }
    log += 'Database connected successfully.\n';

    if (forceReset) {
      log += 'Dropping existing tables (forceReset = true)...\n';
      await query(`
        DROP TABLE IF EXISTS content_segment_metrics_daily CASCADE;
        DROP TABLE IF EXISTS content_metrics_daily CASCADE;
        DROP TABLE IF EXISTS content_item_taxonomy CASCADE;
        DROP TABLE IF EXISTS content_taxonomy CASCADE;
        DROP TABLE IF EXISTS search_queries CASCADE;
        DROP TABLE IF EXISTS audience_segments CASCADE;
        DROP TABLE IF EXISTS content_items CASCADE;
        DROP TABLE IF EXISTS reports CASCADE;
      `);
    }

    log += 'Reading schema.sql...\n';
    const schemaPath = path.join(process.cwd(), 'src/lib/db/schema.sql');
    let schemaSql = '';
    
    if (fs.existsSync(schemaPath)) {
      schemaSql = fs.readFileSync(schemaPath, 'utf-8');
    } else {
      // Fallback in-case path resolves weirdly
      log += 'schema.sql not found at path, using embedded schema fallback...\n';
      schemaSql = getEmbeddedSchema();
    }

    log += 'Executing database schema definitions...\n';
    const cleanedSql = schemaSql
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n');

    const queries = cleanedSql
      .split(';')
      .map(q => q.trim())
      .filter(q => q.length > 0);

    for (const q of queries) {
      log += `Executing statement starting with: "${q.substring(0, 40)}..."\n`;
      await query(q);
    }
    
    log += 'All schema tables initialized successfully.\n';
    return { success: true, log };
  } catch (err: any) {
    console.error('Database initialization failed:', err);
    log += `ERROR: ${err?.message || String(err)}\n`;
    return { success: false, log };
  }
}

function getEmbeddedSchema(): string {
  return `
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(120) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        company VARCHAR(150),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS content_items (
        content_id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        channel VARCHAR(50) NOT NULL,
        format VARCHAR(50) NOT NULL,
        word_count INTEGER,
        duration INTEGER,
        publish_date DATE NOT NULL,
        author VARCHAR(100) NOT NULL,
        url TEXT NOT NULL,
        derived_from INTEGER REFERENCES content_items(content_id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS content_metrics_daily (
        id SERIAL PRIMARY KEY,
        content_id INTEGER NOT NULL REFERENCES content_items(content_id) ON DELETE CASCADE,
        date DATE NOT NULL,
        views INTEGER NOT NULL DEFAULT 0,
        engagement_rate NUMERIC(6,4) NOT NULL DEFAULT 0.0,
        avg_time_on_page INTEGER DEFAULT 0,
        conversions INTEGER NOT NULL DEFAULT 0,
        conversion_value NUMERIC(10,2) NOT NULL DEFAULT 0.0,
        search_impressions INTEGER NOT NULL DEFAULT 0,
        search_clicks INTEGER NOT NULL DEFAULT 0,
        avg_search_position NUMERIC(5,2),
        CONSTRAINT unique_content_date UNIQUE (content_id, date)
    );

    CREATE TABLE IF NOT EXISTS content_taxonomy (
        topic VARCHAR(100) PRIMARY KEY,
        parent_category VARCHAR(100),
        first_published DATE
    );

    CREATE TABLE IF NOT EXISTS content_item_taxonomy (
        content_id INTEGER NOT NULL REFERENCES content_items(content_id) ON DELETE CASCADE,
        topic VARCHAR(100) NOT NULL REFERENCES content_taxonomy(topic) ON DELETE CASCADE,
        PRIMARY KEY (content_id, topic)
    );

    CREATE TABLE IF NOT EXISTS audience_segments (
        segment_id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        definition TEXT
    );

    CREATE TABLE IF NOT EXISTS content_segment_metrics_daily (
        id SERIAL PRIMARY KEY,
        content_id INTEGER NOT NULL REFERENCES content_items(content_id) ON DELETE CASCADE,
        segment_id VARCHAR(50) NOT NULL REFERENCES audience_segments(segment_id) ON DELETE CASCADE,
        date DATE NOT NULL,
        views INTEGER NOT NULL DEFAULT 0,
        conversions INTEGER NOT NULL DEFAULT 0,
        CONSTRAINT unique_content_segment_date UNIQUE (content_id, segment_id, date)
    );

    CREATE TABLE IF NOT EXISTS search_queries (
        id SERIAL PRIMARY KEY,
        query VARCHAR(255) NOT NULL,
        date DATE NOT NULL,
        impressions INTEGER NOT NULL DEFAULT 0,
        clicks INTEGER NOT NULL DEFAULT 0,
        position NUMERIC(5,2) NOT NULL,
        matched_content_id INTEGER REFERENCES content_items(content_id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS reports (
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        title VARCHAR(255) NOT NULL,
        channel VARCHAR(50) NOT NULL DEFAULT 'all',
        narrative TEXT NOT NULL,
        metrics_summary JSONB NOT NULL
    );
  `;
}
