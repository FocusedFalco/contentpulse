import { runAnalysis } from '@/lib/analysis/analysis';
import { checkConnection } from '@/lib/db/db';
import { getCurrentUser } from '@/lib/auth/auth';
import DashboardView from './DashboardView';
import LandingPage from './landing/LandingPage';
import SidebarLayout from './SidebarLayout';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams?: Promise<{ channel?: string }> | { channel?: string };
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const resolvedParams = searchParams ? await searchParams : {};
  const activeChannel = resolvedParams.channel || 'all';

  // 1. Check user authentication session
  const user = await getCurrentUser();

  if (!user) {
    // Render the high-converting Public Landing Page when unauthenticated
    return <LandingPage />;
  }

  // 2. Load and render actual database aggregations for the authenticated user
  const conn = await checkConnection();

  try {
    const analysisData = await runAnalysis(activeChannel);
    return (
      <SidebarLayout>
        <DashboardView initialData={analysisData} initialChannel={activeChannel} />
      </SidebarLayout>
    );
  } catch (err: any) {
    return (
      <SidebarLayout>
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          <h2>Unable to load dashboard data</h2>
          <p>{err?.message || String(err)}</p>
        </div>
      </SidebarLayout>
    );
  }
}
