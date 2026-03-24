import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/db/prisma';
import { registerSchema } from '@/lib/validators/auth';
import { createSession } from '@/lib/auth/session';

export async function POST(request: Request) {
  const formData = await request.formData();
  const parsed = registerSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    displayName: formData.get('displayName')
  });

  if (!parsed.success) return NextResponse.redirect(new URL('/register?error=validation', request.url));

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) return NextResponse.redirect(new URL('/register?error=exists', request.url));

  const passwordHash = await hash(parsed.data.password, 12);
  const user = await prisma.user.create({
    data: {
      email: parsed.data.email,
      passwordHash,
      profile: { create: { displayName: parsed.data.displayName } }
    }
  });

  await createSession({ sub: user.id, email: user.email, role: user.role });
  return NextResponse.redirect(new URL('/', request.url));
}
