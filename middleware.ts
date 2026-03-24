import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const limiter = new Map<string, { count: number; ts: number }>();

export function middleware(request: NextRequest) {
  const key = `${request.ip ?? 'anon'}:${request.nextUrl.pathname}`;
  const now = Date.now();
  const prev = limiter.get(key);
  if (!prev || now - prev.ts > 60_000) {
    limiter.set(key, { count: 1, ts: now });
  } else {
    prev.count += 1;
    if (prev.count > 120) {
      return new NextResponse('Too Many Requests', { status: 429 });
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*']
};
