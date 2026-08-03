import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/types';
import { redirect } from 'next/navigation';
import { UsersClient } from './client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function UsersPage() {
  const session = await auth();
  const userRole = (session?.user as any)?.role as string || 'EMPLOYEE';
  const userPermissions = (session?.user as any)?.permissions || [];

  if (!hasPermission(userRole, userPermissions, 'users:manage')) {
    redirect('/dashboard');
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      permissions: true,
      isActive: true,
      createdAt: true,
    },
  });

  const serialized = users.map((u: any) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
  }));

  return <UsersClient users={serialized} />;
}
