import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getShowBySlug } from '@/lib/services/show-service';

export default async function ShowDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const show = await getShowBySlug(slug);
  if (!show) notFound();

  return (
    <div className="container-app space-y-8 py-8">
      <section className="rounded-xl border border-slate-800 bg-surface p-6">
        <h1 className="text-3xl font-bold">{show.title}</h1>
        <p className="mt-2 text-slate-300">{show.synopsis}</p>
        <div className="mt-4 text-sm text-slate-400">{show.releaseYear} • {show.status} • {show.type}</div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Episodes</h2>
        {show.episodes.map((episode) => (
          <div key={episode.id} className="flex items-center justify-between rounded-lg border border-slate-800 bg-surface p-4">
            <div>
              <p className="font-medium">Episode {episode.number}: {episode.title}</p>
              <p className="text-xs text-slate-400">{episode.releaseDate?.toISOString().slice(0, 10) ?? 'TBA'}</p>
            </div>
            <Link href={`/watch/${episode.id}`} className="rounded-md bg-brand px-4 py-2 text-sm">Watch</Link>
          </div>
        ))}
      </section>
    </div>
  );
}
