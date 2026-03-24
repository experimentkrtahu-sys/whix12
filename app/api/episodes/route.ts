import { NextResponse } from 'next/server';
import { WatchLanguage } from '@prisma/client';
import { requireAdmin } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';

export async function POST(request: Request) {
  await requireAdmin();
  const formData = await request.formData();

  const episode = await prisma.episode.create({
    data: {
      showId: String(formData.get('showId')),
      number: Number(formData.get('number')),
      slug: String(formData.get('slug')),
      title: String(formData.get('title'))
    }
  });

  await prisma.externalVideoSource.create({
    data: {
      episodeId: episode.id,
      label: 'Main',
      embedUrl: String(formData.get('embedUrl')),
      language: WatchLanguage.ORIGINAL,
      isPrimary: true
    }
  });

  return NextResponse.redirect(new URL('/admin/episodes', request.url));
}
