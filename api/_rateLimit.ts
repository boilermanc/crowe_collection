import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Basic in-memory rate limiter for Vercel serverless functions.
 *
 * NOTE: This is a basic first layer of protection. Because Vercel serverless
 * functions are stateless and can run across multiple instances, the in-memory
 * Map resets on cold starts and isn't shared between instances. For production,
 * use a persistent store like Redis or Upstash for reliable rate limiting.
 */

interface RateLimitEntry {
  count: number;
  expiresAt: number;
}

const store = new Map<string, RateLimitEntry>();

function getClientIp(req: VercelRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  if (Array.isArray(forwarded)) return forwarded[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

/**
 * Check whether the request exceeds the rate limit.
 * If exceeded, sends a 429 response and returns true.
 * If OK, returns false and the caller should continue.
 *
 * @param req - Vercel request
 * @param res - Vercel response
 * @param maxRequests - Maximum requests allowed in the window (default: 10)
 * @param windowSeconds - Time window in seconds (default: 60)
 * @returns true if rate limited (response already sent), false if OK
 */
export function rateLimit(
  req: VercelRequest,
  res: VercelResponse,
  maxRequests = 10,
  windowSeconds = 60
): boolean {
  const now = Date.now();
  const ip = getClientIp(req);

  // Clean up expired entries
  for (const [key, entry] of store) {
    if (entry.expiresAt <= now) store.delete(key);
  }

  const entry = store.get(ip);

  if (!entry || entry.expiresAt <= now) {
    // First request or window expired — start a new window
    store.set(ip, { count: 1, expiresAt: now + windowSeconds * 1000 });
    return false;
  }

  entry.count++;

  if (entry.count > maxRequests) {
    const retryAfter = Math.ceil((entry.expiresAt - now) / 1000);
    res.setHeader('Retry-After', String(retryAfter));
    res.status(429).json({ error: 'Too many requests. Please try again later.' });
    return true;
  }

  return false;
}
