import { NextRequest, NextResponse } from 'next/server';
import rateLimiter from './rate-limiter';

const limiter = rateLimiter({
  interval: 60 * 1000, // 60 seconds
  uniqueTokenPerInterval: 500, // Max 500 users per second
});

export async function apiMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/api')) {
    try {
      await limiter.check(request, 10); // 10 requests per minute
    } catch {
      return new NextResponse(
        JSON.stringify({ error: 'Too many requests' }),
        { status: 429 }
      );
    }
  }

  return NextResponse.next();
}
