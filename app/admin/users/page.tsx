import { requireAdmin } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';

export default async function AdminUsersPage() {
  await requireAdmin();
  const users = await prisma.user.findMany({ include: { profile: true }, orderBy: { createdAt: 'desc' }, take: 100 });

  return (
    <div className="container-app py-8">
      <h1 className="mb-4 text-3xl font-bold">Users</h1>
      <div className="space-y-2">{users.map((user) => <div key={user.id} className="rounded border border-slate-800 bg-surface p-3">{user.profile?.displayName ?? 'Unnamed'} • {user.email} • {user.role}</div>)}</div>
    </div>
  );
}
