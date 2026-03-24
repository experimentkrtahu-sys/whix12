import Link from 'next/link';
import { requireAuth } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';

export default async function HistoryPage() {
  const session = await requireAuth();
  const history = await prisma.watchHistory.findMany({
    where: { userId: session.sub },
    include: { episode: { include: { show: true } } },
    orderBy: { lastWatchedAt: 'desc' }
  });
  return (
    <div className="container-app py-8">
      <h1 className="text-3xl font-bold">Continue Watching</h1>
      <div className="mt-4 grid gap-3">{history.map((item) => <Link key={item.id} href={`/watch/${item.episodeId}`} className="rounded-lg border border-slate-800 bg-surface p-4">{item.episode.show.title} - Episode {item.episode.number} ({item.progressSec}s)</Link>)}</div>
    </div>
  );
}
