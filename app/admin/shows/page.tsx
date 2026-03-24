import { requireAdmin } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';

export default async function AdminShowsPage() {
  await requireAdmin();
  const shows = await prisma.show.findMany({ orderBy: { createdAt: 'desc' }, take: 50 });

  return (
    <div className="container-app py-8">
      <h1 className="mb-4 text-3xl font-bold">Shows</h1>
      <form action="/api/shows" method="post" className="mb-6 grid gap-2 rounded-xl border border-slate-800 bg-surface p-4 md:grid-cols-4">
        <input name="title" placeholder="Title" className="rounded border border-slate-700 bg-slate-900 p-2" required />
        <input name="slug" placeholder="Slug" className="rounded border border-slate-700 bg-slate-900 p-2" required />
        <input name="posterUrl" placeholder="Poster URL" className="rounded border border-slate-700 bg-slate-900 p-2" required />
        <input name="releaseYear" placeholder="Year" className="rounded border border-slate-700 bg-slate-900 p-2" required />
        <textarea name="synopsis" placeholder="Synopsis" className="rounded border border-slate-700 bg-slate-900 p-2 md:col-span-3" required />
        <button className="rounded bg-brand p-2">Create Show</button>
      </form>
      <div className="space-y-2">{shows.map((show) => <div key={show.id} className="rounded border border-slate-800 bg-surface p-3">{show.title}</div>)}</div>
    </div>
  );
}
