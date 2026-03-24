import Image from 'next/image';
import Link from 'next/link';

type ShowCardProps = {
  show: {
    title: string;
    slug: string;
    posterUrl: string;
    releaseYear: number;
  };
};

export function ShowCard({ show }: ShowCardProps) {
  return (
    <Link href={`/shows/${show.slug}`} className="group block min-w-44 max-w-44 overflow-hidden rounded-xl border border-slate-800 bg-surface transition hover:scale-[1.02] hover:border-slate-700">
      <div className="relative aspect-[2/3]">
        <Image src={show.posterUrl} alt={show.title} fill className="object-cover" />
      </div>
      <div className="p-3">
        <p className="line-clamp-1 text-sm font-medium text-white">{show.title}</p>
        <p className="text-xs text-slate-400">{show.releaseYear}</p>
      </div>
    </Link>
  );
}
