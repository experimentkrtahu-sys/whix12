import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/db/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const shows = await prisma.show.findMany({ select: { slug: true, updatedAt: true } });
  return [
    { url: base, lastModified: new Date() },
    { url: `${base}/browse`, lastModified: new Date() },
    ...shows.map((s) => ({ url: `${base}/shows/${s.slug}`, lastModified: s.updatedAt }))
  ];
}
