import { requireAuth } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';

export default async function ProfilePage() {
  const session = await requireAuth();
  const user = await prisma.user.findUnique({ where: { id: session.sub }, include: { profile: true } });

  return (
    <div className="container-app py-8">
      <h1 className="text-3xl font-bold">Profile</h1>
      <div className="mt-4 rounded-xl border border-slate-800 bg-surface p-6">
        <p className="text-lg">{user?.profile?.displayName}</p>
        <p className="text-sm text-slate-400">{user?.email}</p>
      </div>
    </div>
  );
}
