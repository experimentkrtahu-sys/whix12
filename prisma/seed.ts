import { PrismaClient, ShowStatus, ShowType, UserRole, WatchLanguage } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await hash('Admin123!secure', 12);

  const [action, sciFi, drama, education] = await Promise.all([
    prisma.genre.upsert({ where: { slug: 'action' }, update: {}, create: { name: 'Action', slug: 'action' } }),
    prisma.genre.upsert({ where: { slug: 'sci-fi' }, update: {}, create: { name: 'Sci-Fi', slug: 'sci-fi' } }),
    prisma.genre.upsert({ where: { slug: 'drama' }, update: {}, create: { name: 'Drama', slug: 'drama' } }),
    prisma.genre.upsert({ where: { slug: 'education' }, update: {}, create: { name: 'Education', slug: 'education' } })
  ]);

  const [studioA, producerA] = await Promise.all([
    prisma.studio.upsert({ where: { slug: 'nova-studio' }, update: {}, create: { name: 'Nova Studio', slug: 'nova-studio' } }),
    prisma.producer.upsert({ where: { slug: 'zenith-media' }, update: {}, create: { name: 'Zenith Media', slug: 'zenith-media' } })
  ]);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@catalog.local' },
    update: { passwordHash: adminPassword, role: UserRole.ADMIN },
    create: {
      email: 'admin@catalog.local',
      passwordHash: adminPassword,
      role: UserRole.ADMIN,
      profile: { create: { displayName: 'Catalog Admin' } }
    }
  });

  const show = await prisma.show.upsert({
    where: { slug: 'stellar-frontier' },
    update: {},
    create: {
      slug: 'stellar-frontier',
      title: 'Stellar Frontier',
      altTitles: ['Frontier of Stars'],
      synopsis: 'A licensed sci-fi adventure series where cadets explore ethical AI systems across galaxies.',
      posterUrl: 'https://images.unsplash.com/photo-1614728263952-84ea256f9679?q=80&w=1200&auto=format&fit=crop',
      bannerUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1800&auto=format&fit=crop',
      releaseYear: 2025,
      status: ShowStatus.ONGOING,
      type: ShowType.SERIES,
      totalEpisodes: 2,
      cast: ['Ava Lin', 'Marco Voss'],
      featured: true,
      trending: true,
      latestRelease: true,
      recentlyAdded: true,
      createdById: admin.id,
      showGenres: { create: [{ genreId: action.id }, { genreId: sciFi.id }, { genreId: drama.id }] },
      showStudios: { create: [{ studioId: studioA.id }] },
      showProducers: { create: [{ producerId: producerA.id }] }
    }
  });

  const episode1 = await prisma.episode.upsert({
    where: { showId_number: { showId: show.id, number: 1 } },
    update: {},
    create: {
      showId: show.id,
      slug: 'ep-1-first-light',
      number: 1,
      title: 'First Light',
      synopsis: 'Cadets onboard the Horizon receive their first licensed mission briefing.',
      thumbnailUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
      durationMin: 24,
      releaseDate: new Date('2025-07-01T00:00:00Z')
    }
  });

  const episode2 = await prisma.episode.upsert({
    where: { showId_number: { showId: show.id, number: 2 } },
    update: {},
    create: {
      showId: show.id,
      slug: 'ep-2-orbital-accord',
      number: 2,
      title: 'Orbital Accord',
      synopsis: 'A treaty mission turns complicated when communication networks fail.',
      thumbnailUrl: 'https://i.ytimg.com/vi/oHg5SJYRHA0/maxresdefault.jpg',
      durationMin: 24,
      releaseDate: new Date('2025-07-08T00:00:00Z')
    }
  });

  await prisma.externalVideoSource.createMany({
    data: [
      {
        episodeId: episode1.id,
        label: 'YouTube Main',
        embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        externalWatchUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        language: WatchLanguage.SUB,
        qualityLabel: '1080p',
        isPrimary: true
      },
      {
        episodeId: episode2.id,
        label: 'YouTube Main',
        embedUrl: 'https://www.youtube.com/embed/oHg5SJYRHA0',
        externalWatchUrl: 'https://www.youtube.com/watch?v=oHg5SJYRHA0',
        language: WatchLanguage.SUB,
        qualityLabel: '1080p',
        isPrimary: true
      }
    ],
    skipDuplicates: true
  });

  await prisma.homepageFeature.upsert({
    where: { slug: 'hero-spotlight' },
    update: { showId: show.id },
    create: {
      name: 'Hero Spotlight',
      slug: 'hero-spotlight',
      description: 'Primary homepage hero slot',
      showId: show.id,
      sortOrder: 1
    }
  });

  await prisma.show.createMany({
    data: [
      {
        slug: 'design-for-streaming-creators',
        title: 'Design for Streaming Creators',
        altTitles: ['Creator Design Masterclass'],
        synopsis: 'Educational course on visual storytelling and production design.',
        posterUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=1200&auto=format&fit=crop',
        bannerUrl: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?q=80&w=1800&auto=format&fit=crop',
        releaseYear: 2024,
        status: ShowStatus.COMPLETED,
        type: ShowType.COURSE,
        totalEpisodes: 12,
        cast: ['Mia Varga'],
        trending: false,
        latestRelease: false,
        recentlyAdded: true,
        createdById: admin.id
      }
    ],
    skipDuplicates: true
  });

  console.log('Seed completed');
  console.log('Admin login: admin@catalog.local / Admin123!secure');
  console.log(`Genres created: ${[action, sciFi, drama, education].length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
