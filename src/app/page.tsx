import { runAnalysis } from '@/lib/analysis/analysis';
import { checkConnection, query } from '@/lib/db/db';
import DashboardView from './DashboardView';
import OnboardingWizard from './OnboardingWizard';
import SidebarLayout from './SidebarLayout';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams?: Promise<{ channel?: string }> | { channel?: string };
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const resolvedParams = searchParams ? await searchParams : {};
  const activeChannel = resolvedParams.channel || 'all';

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
    // Render the beautiful Landing Page + Interactive Onboarding Setup Wizard
    return <OnboardingWizard />;
  }

  // Load and render actual database aggregations for the selected channel
  try {
    const analysisData = await runAnalysis(activeChannel);
    return (
      <SidebarLayout>
        <DashboardView initialData={analysisData} initialChannel={activeChannel} />
      </SidebarLayout>
    );
  } catch (err: any) {
    // Fallback to onboarding if connection breaks or database is corrupted
    return <OnboardingWizard initialError={err?.message || String(err)} />;
  }
}
