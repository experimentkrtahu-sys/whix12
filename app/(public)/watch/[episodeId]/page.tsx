import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';

export default async function WatchPage({ params, searchParams }: { params: Promise<{ episodeId: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { episodeId } = await params;
  const query = await searchParams;
  const episode = await prisma.episode.findUnique({
    where: { id: episodeId },
    include: { externalSources: { where: { isActive: true }, orderBy: { isPrimary: 'desc' } }, show: { include: { episodes: true } } }
  });
  if (!episode) notFound();

  const selected = episode.externalSources.find((s) => s.id === query.source) ?? episode.externalSources[0];
  const sorted = [...episode.show.episodes].sort((a, b) => a.number - b.number);
  const idx = sorted.findIndex((e) => e.id === episode.id);

  return (
    <div className="container-app space-y-6 py-8">
      <h1 className="text-2xl font-bold">{episode.show.title} • Episode {episode.number}</h1>
      {selected ? (
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-black">
          <iframe src={selected.embedUrl} allowFullScreen className="h-[60vh] w-full" title="Authorized video player" />
        </div>
      ) : <p>No authorized source available.</p>}
      <div className="flex flex-wrap gap-2">
        {episode.externalSources.map((source) => (
          <a key={source.id} href={`?source=${source.id}`} className="rounded-md border border-slate-700 px-3 py-1 text-sm">{source.label} ({source.language})</a>
        ))}
      </div>
      <div className="flex gap-3">
        {idx > 0 && <a href={`/watch/${sorted[idx - 1].id}`} className="rounded-md border border-slate-700 px-4 py-2">Previous</a>}
        {idx < sorted.length - 1 && <a href={`/watch/${sorted[idx + 1].id}`} className="rounded-md bg-brand px-4 py-2">Next</a>}
      </div>
      <section className="rounded-xl border border-slate-800 bg-surface p-4 text-sm text-slate-300">Comments architecture placeholder: persist comments in a future `Comment` model with moderation queue.</section>
    </div>
  );
}
