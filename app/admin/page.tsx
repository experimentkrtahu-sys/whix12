import Link from 'next/link';
import { requireAdmin } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';

export default async function AdminDashboardPage() {
  await requireAdmin();
  const [totalShows, totalEpisodes, mostViewed, recentUsers] = await Promise.all([
    prisma.show.count(),
    prisma.episode.count(),
    prisma.show.findMany({ orderBy: { viewCount: 'desc' }, take: 5 }),
    prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 5 })
  ]);

  return (
    <div className="container-app space-y-6 py-8">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-slate-800 bg-surface p-4">Total shows: {totalShows}</div>
        <div className="rounded-lg border border-slate-800 bg-surface p-4">Total episodes: {totalEpisodes}</div>
        <div className="rounded-lg border border-slate-800 bg-surface p-4">Recent users: {recentUsers.length}</div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-lg border border-slate-800 bg-surface p-4">
          <h2 className="mb-2 font-semibold">Most viewed titles</h2>
          {mostViewed.map((show) => <p key={show.id} className="text-sm text-slate-300">{show.title} ({show.viewCount})</p>)}
        </section>
        <section className="rounded-lg border border-slate-800 bg-surface p-4">
          <h2 className="mb-2 font-semibold">Management</h2>
          <div className="space-y-2 text-sm"><Link href="/admin/shows">Manage Shows</Link><br /><Link href="/admin/episodes">Manage Episodes</Link><br /><Link href="/admin/users">Manage Users</Link></div>
        </section>
      </div>
    </div>
  );
}
