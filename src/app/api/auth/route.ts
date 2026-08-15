import { NextRequest, NextResponse } from 'next/server';
import { query, checkConnection } from '@/lib/db/db';
import { hashPassword, verifyPassword, createSessionToken, verifySessionToken, COOKIE_NAME } from '@/lib/auth/auth';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ user: null });
    }

    const user = verifySessionToken(token);
    if (!user) {
      return NextResponse.json({ user: null });
    }

    // Fetch user details and account stats
    const userRes = await query('SELECT id, name, email, company, created_at FROM users WHERE id = $1', [user.id]);
    if (userRes.rows.length === 0) {
      return NextResponse.json({ user: null });
    }

    // Also get connected stats
    const statsRes = await query(`
      SELECT 
        COUNT(DISTINCT c.content_id)::int as total_items,
        COUNT(DISTINCT c.channel)::int as total_channels,
        COALESCE(SUM(m.views), 0)::int as total_views,
        COALESCE(SUM(m.conversions), 0)::int as total_conversions
      FROM content_items c
      LEFT JOIN content_metrics_daily m ON c.content_id = m.content_id
    `);

    const reportsCountRes = await query('SELECT COUNT(*)::int as count FROM reports');

    return NextResponse.json({
      user: {
        ...userRes.rows[0],
        stats: {
          total_items: statsRes.rows[0]?.total_items || 0,
          total_channels: statsRes.rows[0]?.total_channels || 0,
          total_views: statsRes.rows[0]?.total_views || 0,
          total_conversions: statsRes.rows[0]?.total_conversions || 0,
          total_reports: reportsCountRes.rows[0]?.count || 0
        }
      }
    });
  } catch (err: any) {
    return NextResponse.json({ user: null, error: err?.message || String(err) });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    // Auto-create users table if needed
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            name VARCHAR(120) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            company VARCHAR(150),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
    } catch (e) {}

    // 1. SIGN OUT
    if (action === 'signout') {
      const response = NextResponse.json({ success: true, message: 'Signed out successfully.' });
      response.cookies.delete(COOKIE_NAME);
      return response;
    }

    // 2. SIGN UP
    if (action === 'signup') {
      const { name, company, email, password, confirmPassword } = body;

      if (!name || !email || !password) {
        return NextResponse.json({ success: false, error: 'Full name, email, and password are required.' }, { status: 400 });
      }

      if (password.length < 6) {
        return NextResponse.json({ success: false, error: 'Password must be at least 6 characters long.' }, { status: 400 });
      }

      if (password !== confirmPassword) {
        return NextResponse.json({ success: false, error: 'Passwords do not match. Please confirm your password.' }, { status: 400 });
      }

      // Check if email already exists
      const existingUser = await query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [email.trim()]);
      if (existingUser.rows.length > 0) {
        return NextResponse.json({ success: false, error: 'An account with this email address already exists. Please sign in instead.' }, { status: 400 });
      }

      const passwordHash = await hashPassword(password);
      const insertRes = await query(
        `INSERT INTO users (name, email, password_hash, company)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, email, company, created_at`,
        [name.trim(), email.trim().toLowerCase(), passwordHash, company?.trim() || null]
      );

      const newUser = insertRes.rows[0];
      const sessionToken = createSessionToken({
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        company: newUser.company
      });

      const response = NextResponse.json({
        success: true,
        user: newUser,
        message: 'Account created successfully!'
      });

      response.cookies.set({
        name: COOKIE_NAME,
        value: sessionToken,
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 // 30 days
      });

      return response;
    }

    // 3. SIGN IN
    if (action === 'signin') {
      const { email, password } = body;

      if (!email || !password) {
        return NextResponse.json({ success: false, error: 'Email and password are required.' }, { status: 400 });
      }

      const userRes = await query('SELECT id, name, email, password_hash, company FROM users WHERE LOWER(email) = LOWER($1)', [email.trim()]);
      if (userRes.rows.length === 0) {
        return NextResponse.json({ success: false, error: 'Invalid email or password.' }, { status: 401 });
      }

      const user = userRes.rows[0];
      const isPasswordValid = await verifyPassword(password, user.password_hash);
      if (!isPasswordValid) {
        return NextResponse.json({ success: false, error: 'Invalid email or password.' }, { status: 401 });
      }

      const sessionToken = createSessionToken({
        id: user.id,
        name: user.name,
        email: user.email,
        company: user.company
      });

      const response = NextResponse.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          company: user.company
        },
        message: 'Signed in successfully!'
      });

      response.cookies.set({
        name: COOKIE_NAME,
        value: sessionToken,
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60
      });

      return response;
    }

    return NextResponse.json({ success: false, error: 'Invalid auth action.' }, { status: 400 });
  } catch (err: any) {
    console.error('Auth API Error:', err);
    return NextResponse.json({ success: false, error: err?.message || String(err) }, { status: 500 });
  }
}
