import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';

export async function POST(request: Request) {
  const session = await requireAuth();
  const { episodeId, progressSec, completed } = await request.json();
  await prisma.watchHistory.upsert({
    where: { userId_episodeId: { userId: session.sub, episodeId } },
    update: { progressSec, completed, lastWatchedAt: new Date() },
    create: { userId: session.sub, episodeId, progressSec, completed }
  });
  return NextResponse.json({ ok: true });
}
