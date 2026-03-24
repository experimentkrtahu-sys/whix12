import Link from 'next/link';
import { requireAuth } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';

export default async function WatchlistPage() {
  const session = await requireAuth();
  const items = await prisma.bookmark.findMany({ where: { userId: session.sub }, include: { show: true }, orderBy: { createdAt: 'desc' } });
  return (
    <div className="container-app py-8">
      <h1 className="text-3xl font-bold">Watchlist</h1>
      <div className="mt-4 grid gap-3">{items.map((item) => <Link key={item.id} href={`/shows/${item.show.slug}`} className="rounded-lg border border-slate-800 bg-surface p-4">{item.show.title}</Link>)}</div>
    </div>
  );
}
