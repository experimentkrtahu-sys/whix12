import Image from 'next/image';
import Link from 'next/link';

type HeroProps = {
  show?: { title: string; synopsis: string; slug: string; bannerUrl: string | null } | null;
};

export function Hero({ show }: HeroProps) {
  if (!show) return null;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
      {show.bannerUrl ? (
        <div className="absolute inset-0 opacity-30">
          <Image src={show.bannerUrl} alt={show.title} fill className="object-cover" />
        </div>
      ) : null}
      <div className="relative space-y-4 p-8 md:p-12">
        <p className="text-sm uppercase tracking-wide text-brand">Featured today</p>
        <h1 className="max-w-2xl text-3xl font-bold text-white md:text-5xl">{show.title}</h1>
        <p className="max-w-2xl text-slate-200">{show.synopsis}</p>
        <Link href={`/shows/${show.slug}`} className="inline-flex rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white">
          View details
        </Link>
      </div>
    </section>
  );
}
