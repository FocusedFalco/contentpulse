import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

async function run() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('.env.local not found');
    return;
  }
  
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const env: Record<string, string> = {};
  envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim().replace(/^"|"$/g, '');
      env[key] = val;
    }
  });

  const pool = new Pool({
    connectionString: env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Testing connection...');
    const nowRes = await pool.query('SELECT NOW()');
    console.log('Connected! Server time:', nowRes.rows[0].now);

    console.log('Listing tables in public schema...');
    const tablesRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('Tables found:', tablesRes.rows.map(r => r.table_name));

    console.log('\n--- CONTENT ITEMS ---');
    const itemsRes = await pool.query('SELECT * FROM content_items');
    console.log(JSON.stringify(itemsRes.rows, null, 2));

    console.log('\n--- CONTENT ITEM TAXONOMY ---');
    const taxRes = await pool.query('SELECT * FROM content_item_taxonomy');
    console.log(JSON.stringify(taxRes.rows, null, 2));

    console.log('\n--- SEARCH QUERIES ---');
    const queriesRes = await pool.query('SELECT * FROM search_queries');
    console.log(JSON.stringify(queriesRes.rows, null, 2));
    
  } catch (err) {
    console.error('Database connection or query failed:', err);
  } finally {
    await pool.end();
  }
}

run();
