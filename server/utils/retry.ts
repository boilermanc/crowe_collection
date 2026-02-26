const RETRYABLE_STATUS_CODES = [429, 500, 503];

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Check whether an error is retryable (rate-limit, server error, service unavailable). */
export function isRetryableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  // Check numeric status on the error object (Google GenAI SDK attaches this)
  const errObj = error as unknown as Record<string, unknown>;
  const status = errObj.status ?? errObj.statusCode ?? errObj.code;
  if (typeof status === 'number' && RETRYABLE_STATUS_CODES.includes(status)) {
    return true;
  }

  // Fallback: match common patterns in the error message
  const msg = error.message.toLowerCase();
  if (msg.includes('429') || msg.includes('rate limit') || msg.includes('too many requests')) return true;
  if (msg.includes('503') || msg.includes('service unavailable')) return true;
  if (msg.includes('500') || msg.includes('internal server error')) return true;
  if (msg.includes('resource exhausted') || msg.includes('resource_exhausted')) return true;

  return false;
}

/**
 * Retry an async function with exponential backoff.
 *
 * Only retries on transient/throttle errors (429, 500, 503).
 * Non-retryable errors (400, 401, 403, etc.) are thrown immediately.
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 2,
  baseDelayMs = 1000,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (!isRetryableError(error) || attempt === maxRetries) {
        throw error;
      }

      const delay = baseDelayMs * 2 ** attempt;
      console.warn(
        `[retryWithBackoff] Attempt ${attempt + 1}/${maxRetries + 1} failed: ${error instanceof Error ? error.message : error}. Retrying in ${delay}ms…`,
      );
      await sleep(delay);
    }
  }

  // Unreachable, but satisfies TypeScript
  throw lastError;
}
