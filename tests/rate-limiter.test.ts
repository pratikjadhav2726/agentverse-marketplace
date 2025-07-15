import rateLimiter from '../lib/rate-limiter';
import { NextRequest } from 'next/server';

describe('rateLimiter', () => {
  it('should allow requests below the limit', async () => {
    const limiter = rateLimiter({
      interval: 1000,
      uniqueTokenPerInterval: 10,
    });

    const req = new NextRequest('http://localhost');
    await expect(limiter.check(req, 5)).resolves.toBeUndefined();
    await expect(limiter.check(req, 5)).resolves.toBeUndefined();
    await expect(limiter.check(req, 5)).resolves.toBeUndefined();
  });

  it('should reject requests above the limit', async () => {
    const limiter = rateLimiter({
      interval: 1000,
      uniqueTokenPerInterval: 10,
    });

    const req = new NextRequest('http://localhost');
    await expect(limiter.check(req, 2)).resolves.toBeUndefined();
    await expect(limiter.check(req, 2)).resolves.toBeUndefined();
    await expect(limiter.check(req, 2)).rejects.toBeUndefined();
  });
});
