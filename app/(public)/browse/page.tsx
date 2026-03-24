import Link from 'next/link';
import { searchShows } from '@/lib/services/show-service';
import { prisma } from '@/lib/db/prisma';

export default async function BrowsePage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const result = await searchShows({
    q: params.q,
    genre: params.genre,
    type: params.type,
    status: params.status,
    year: params.year,
    sort: params.sort,
    page: Number(params.page || '1')
  });

  const genres = await prisma.genre.findMany({ orderBy: { name: 'asc' } });

  return (
    <div className="container-app space-y-6 py-8">
      <h1 className="text-3xl font-bold">Browse Catalog</h1>
      <form className="grid gap-3 rounded-xl border border-slate-800 bg-surface p-4 md:grid-cols-6">
        <input name="q" defaultValue={params.q} placeholder="Search title..." className="rounded-md border border-slate-700 bg-slate-900 p-2 md:col-span-2" />
        <select name="genre" defaultValue={params.genre} className="rounded-md border border-slate-700 bg-slate-900 p-2">
          <option value="">All genres</option>{genres.map((g) => <option key={g.id} value={g.slug}>{g.name}</option>)}
        </select>
        <select name="sort" defaultValue={params.sort} className="rounded-md border border-slate-700 bg-slate-900 p-2">
          <option value="latest">Latest</option><option value="popular">Popular</option><option value="rating">Rating</option><option value="az">A-Z</option>
        </select>
        <button className="rounded-md bg-brand px-4 py-2">Apply</button>
      </form>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {result.items.map((show) => (
          <Link key={show.id} href={`/shows/${show.slug}`} className="rounded-xl border border-slate-800 bg-surface p-4">
            <h2 className="line-clamp-1 font-medium">{show.title}</h2><p className="text-xs text-slate-400">{show.releaseYear}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
