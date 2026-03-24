import { ShowCard } from '@/components/common/show-card';

type Props = {
  title: string;
  items: Array<{ title: string; slug: string; posterUrl: string; releaseYear: number }>;
};

export function ContentRail({ title, items }: Props) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {items.map((item) => (
          <ShowCard key={item.slug} show={item} />
        ))}
      </div>
    </section>
  );
}
