import crypto from 'crypto';

/** Timing-safe string comparison to prevent timing attacks on secret tokens. */
export function timingSafeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}
