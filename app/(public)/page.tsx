import { ContentRail } from '@/components/home/content-rail';
import { Hero } from '@/components/home/hero';
import { getHomepageData } from '@/lib/services/show-service';

export default async function HomePage() {
  const { hero, trending, latest, recentlyAdded, topRated } = await getHomepageData();

  return (
    <div className="container-app space-y-10 py-8">
      <Hero show={hero} />
      <ContentRail title="Trending" items={trending} />
      <ContentRail title="Latest Releases" items={latest} />
      <ContentRail title="Recently Added" items={recentlyAdded} />
      <ContentRail title="Top Rated" items={topRated} />
    </div>
  );
}
