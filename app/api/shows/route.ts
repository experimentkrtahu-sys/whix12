import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { showSchema } from '@/lib/validators/show';

export async function GET() {
  const items = await prisma.show.findMany({ take: 50, orderBy: { updatedAt: 'desc' } });
  return NextResponse.json(items);
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  const body = Object.fromEntries((await request.formData()).entries());
  const parsed = showSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json(parsed.error.flatten(), { status: 400 });

  await prisma.show.create({
    data: {
      ...parsed.data,
      bannerUrl: parsed.data.bannerUrl || null,
      altTitles: [],
      cast: [],
      createdById: admin.sub
    }
  });

  return NextResponse.redirect(new URL('/admin/shows', request.url));
}
