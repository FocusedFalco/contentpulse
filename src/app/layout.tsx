import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { checkConnection, query } from "@/lib/db/db";

export const metadata: Metadata = {
  title: "ContentPulse | Content Performance & Editorial Intelligence",
  description: "Aggregated multi-channel content performance analytics and automated narrative-driven editorial reports using Gemini.",
  metadataBase: new URL("http://localhost:3000"),
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const conn = await checkConnection();

  let hasRealData = false;
  if (conn.connected) {
    try {
      const res = await query('SELECT COUNT(*) FROM content_items');
      hasRealData = parseInt(res.rows[0].count, 10) > 0;
    } catch (err) {
      // Tables don't exist yet
      hasRealData = false;
    }
  }

  if (!hasRealData) {
    return (
      <html lang="en">
        <head>
          <title>ContentPulse | Content Performance & Editorial Intelligence</title>
        </head>
        <body>
          {children}
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <head>
        <title>ContentPulse | Content Performance & Editorial Intelligence</title>
      </head>
      <body>
        <div className="app-container">
          <aside className="sidebar">
            <div style={{ marginBottom: '40px' }}>
              <Link href="/">
                <h1 className="gradient-text" style={{ fontSize: '28px', fontWeight: 800, cursor: 'pointer' }}>
                  ContentPulse
                </h1>
              </Link>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--color-secondary)', fontWeight: 600, marginTop: '2px' }}>
                Editorial Intelligence
              </div>
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
              <Link href="/" className="nav-link-item">
                Dashboard
              </Link>
              <Link href="/reports" className="nav-link-item">
                Editorial Reports
              </Link>
              <Link href="/settings" className="nav-link-item">
                Sync & Settings
              </Link>
            </nav>

            <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border-color)', fontSize: '12px', color: 'var(--color-text-muted)' }}>
              <div>Connected to Cloud:</div>
              <div style={{ color: 'var(--color-primary)', fontWeight: 600, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-success)', display: 'inline-block' }}></span>
                Supabase Postgres
              </div>
            </div>
          </aside>
          
          <main className="main-content">
            {children}
          </main>
        </div>

        {/* Styles for sidebar links */}
        <style dangerouslySetInnerHTML={{ __html: `
          .nav-link-item {
            display: flex;
            align-items: center;
            padding: 12px 16px;
            color: var(--color-text-muted);
            border-radius: 10px;
            font-family: var(--font-display);
            font-weight: 500;
            font-size: 15px;
            transition: all 0.2s ease;
          }
          .nav-link-item:hover {
            color: var(--color-text);
            background: var(--bg-surface-hover);
            transform: translateX(4px);
          }
        `}} />
      </body>
    </html>
  );
}
