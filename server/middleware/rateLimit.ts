import type { Request, Response, NextFunction } from 'express';

interface RateLimitEntry {
  count: number;
  expiresAt: number;
}

const store = new Map<string, RateLimitEntry>();

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  if (Array.isArray(forwarded)) return forwarded[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

/**
 * Factory that returns Express middleware enforcing per-IP rate limits.
 *
 * @param maxRequests - Maximum requests allowed in the window (default: 10)
 * @param windowSeconds - Time window in seconds (default: 60)
 */
export function createRateLimit(maxRequests = 10, windowSeconds = 60) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const now = Date.now();
    const ip = getClientIp(req);

    // Clean up expired entries
    for (const [key, entry] of store) {
      if (entry.expiresAt <= now) store.delete(key);
    }

    const entry = store.get(ip);

    if (!entry || entry.expiresAt <= now) {
      store.set(ip, { count: 1, expiresAt: now + windowSeconds * 1000 });
      next();
      return;
    }

    entry.count++;

    if (entry.count > maxRequests) {
      const retryAfter = Math.ceil((entry.expiresAt - now) / 1000);
      res.setHeader('Retry-After', String(retryAfter));
      res.status(429).json({ error: 'Too many requests. Please try again later.' });
      return;
    }

    next();
  };
}
