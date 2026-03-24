import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';

const showPreviewInclude = {
  showGenres: { include: { genre: true } },
  ratings: { select: { value: true } }
} satisfies Prisma.ShowInclude;

export async function getHomepageData() {
  const [hero, trending, latest, recentlyAdded, topRated] = await Promise.all([
    prisma.show.findFirst({ where: { featured: true, published: true }, include: showPreviewInclude, orderBy: { updatedAt: 'desc' } }),
    prisma.show.findMany({ where: { trending: true, published: true }, include: showPreviewInclude, take: 12, orderBy: { viewCount: 'desc' } }),
    prisma.show.findMany({ where: { latestRelease: true, published: true }, include: showPreviewInclude, take: 12, orderBy: { updatedAt: 'desc' } }),
    prisma.show.findMany({ where: { recentlyAdded: true, published: true }, include: showPreviewInclude, take: 12, orderBy: { createdAt: 'desc' } }),
    prisma.show.findMany({ where: { published: true }, include: showPreviewInclude, take: 12, orderBy: { ratings: { _count: 'desc' } } })
  ]);

  return { hero, trending, latest, recentlyAdded, topRated };
}

export async function getShowBySlug(slug: string) {
  return prisma.show.findUnique({
    where: { slug },
    include: {
      episodes: { include: { externalSources: { where: { isActive: true } } }, orderBy: { number: 'asc' } },
      showGenres: { include: { genre: true } },
      showStudios: { include: { studio: true } },
      showProducers: { include: { producer: true } },
      recommendations: { include: { toShow: true }, take: 10, orderBy: { score: 'desc' } },
      ratings: true
    }
  });
}

export async function searchShows(params: {
  q?: string;
  genre?: string;
  type?: string;
  status?: string;
  year?: string;
  sort?: string;
  page?: number;
}) {
  const page = params.page || 1;
  const take = 20;

  const where: Prisma.ShowWhereInput = {
    published: true,
    ...(params.q
      ? {
          OR: [
            { title: { contains: params.q, mode: 'insensitive' } },
            { altTitles: { hasSome: [params.q] } }
          ]
        }
      : {}),
    ...(params.genre ? { showGenres: { some: { genre: { slug: params.genre } } } } : {}),
    ...(params.type ? { type: params.type as never } : {}),
    ...(params.status ? { status: params.status as never } : {}),
    ...(params.year ? { releaseYear: Number(params.year) } : {})
  };

  const orderBy: Prisma.ShowOrderByWithRelationInput =
    params.sort === 'popular'
      ? { viewCount: 'desc' }
      : params.sort === 'rating'
        ? { ratings: { _count: 'desc' } }
        : params.sort === 'az'
          ? { title: 'asc' }
          : { updatedAt: 'desc' };

  const [items, total] = await Promise.all([
    prisma.show.findMany({ where, orderBy, include: showPreviewInclude, skip: (page - 1) * take, take }),
    prisma.show.count({ where })
  ]);

  return { items, total, page, pages: Math.ceil(total / take) };
}
