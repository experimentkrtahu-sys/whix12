import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';

export async function POST(request: Request) {
  const session = await requireAuth();
  const { showId } = await request.json();
  await prisma.bookmark.upsert({
    where: { userId_showId: { userId: session.sub, showId } },
    update: {},
    create: { userId: session.sub, showId }
  });
  return NextResponse.json({ ok: true });
}
