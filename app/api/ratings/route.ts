import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';

export async function POST(request: Request) {
  const session = await requireAuth();
  const { showId, value, review } = await request.json();
  await prisma.rating.upsert({
    where: { userId_showId: { userId: session.sub, showId } },
    update: { value, review },
    create: { userId: session.sub, showId, value, review }
  });
  return NextResponse.json({ ok: true });
}
