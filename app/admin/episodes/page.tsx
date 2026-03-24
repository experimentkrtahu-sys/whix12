import { requireAdmin } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';

export default async function AdminEpisodesPage() {
  await requireAdmin();
  const [episodes, shows] = await Promise.all([
    prisma.episode.findMany({ include: { show: true }, take: 100, orderBy: { createdAt: 'desc' } }),
    prisma.show.findMany({ orderBy: { title: 'asc' } })
  ]);

  return (
    <div className="container-app py-8">
      <h1 className="mb-4 text-3xl font-bold">Episodes</h1>
      <form action="/api/episodes" method="post" className="mb-6 grid gap-2 rounded-xl border border-slate-800 bg-surface p-4 md:grid-cols-4">
        <select name="showId" className="rounded border border-slate-700 bg-slate-900 p-2">{shows.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}</select>
        <input name="number" type="number" placeholder="Episode #" className="rounded border border-slate-700 bg-slate-900 p-2" required />
        <input name="slug" placeholder="Episode slug" className="rounded border border-slate-700 bg-slate-900 p-2" required />
        <input name="title" placeholder="Title" className="rounded border border-slate-700 bg-slate-900 p-2" required />
        <input name="embedUrl" placeholder="Authorized embed URL" className="rounded border border-slate-700 bg-slate-900 p-2 md:col-span-3" required />
        <button className="rounded bg-brand p-2">Create Episode</button>
      </form>
      <div className="space-y-2">{episodes.map((ep) => <div key={ep.id} className="rounded border border-slate-800 bg-surface p-3">{ep.show.title} • #{ep.number} {ep.title}</div>)}</div>
    </div>
  );
}
