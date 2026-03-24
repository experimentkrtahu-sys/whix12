import { NextResponse } from 'next/server';
import { compare } from 'bcryptjs';
import { prisma } from '@/lib/db/prisma';
import { loginSchema } from '@/lib/validators/auth';
import { createSession } from '@/lib/auth/session';

export async function POST(request: Request) {
  const formData = await request.formData();
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password')
  });

  if (!parsed.success) return NextResponse.redirect(new URL('/login?error=validation', request.url));

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user) return NextResponse.redirect(new URL('/login?error=invalid', request.url));

  const ok = await compare(parsed.data.password, user.passwordHash);
  if (!ok) return NextResponse.redirect(new URL('/login?error=invalid', request.url));

  await createSession({ sub: user.id, email: user.email, role: user.role });
  return NextResponse.redirect(new URL('/', request.url));
}
