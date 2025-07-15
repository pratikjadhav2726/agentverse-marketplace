import { LRUCache } from 'lru-cache';
import { NextRequest, NextResponse } from 'next/server';

type RateLimiterOptions = {
  uniqueTokenPerInterval: number;
  interval: number;
};

export default function rateLimiter(options: RateLimiterOptions) {
  const tokenCache = new LRUCache<string, number>({
    max: options.uniqueTokenPerInterval,
    ttl: options.interval,
  });

  return {
    check: (req: NextRequest, limit: number, token = req.ip ?? '127.0.0.1') =>
      new Promise<void>((resolve, reject) => {
        const tokenCount = tokenCache.get(token) || 0;
        const currentUsage = tokenCount + 1;
        tokenCache.set(token, currentUsage);

        if (currentUsage > limit) {
          reject();
        } else {
          resolve();
        }
      }),
  };
}
