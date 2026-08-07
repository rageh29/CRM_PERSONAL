import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getMasterDashboardData } from '@/features/master/actions';
import { MasterClient } from './client';

export const dynamic = 'force-dynamic';

export default async function MasterDashboardPage() {
  const session = await auth();
  const user = session?.user as any;

  if (!user || (!user.isMasterAdmin && user.role !== 'MASTER_ADMIN')) {
    redirect('/dashboard');
  }

  const data = await getMasterDashboardData();

  return <MasterClient data={data} />;
}
