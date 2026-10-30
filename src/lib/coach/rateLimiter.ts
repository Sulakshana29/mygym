interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

const WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS_PER_WINDOW = 10; // Max 10 coach calls per minute per IP

/**
 * In-memory sliding window IP rate limiter to protect LLM quota from denial-of-wallet.
 */
export function checkRateLimit(ip: string): {
  success: boolean;
  remaining: number;
  resetInSeconds: number;
} {
  const now = Date.now();
  const existing = rateLimitMap.get(ip);

  // Clean up expired entries if window has passed
  if (!existing || now > existing.resetAt) {
    rateLimitMap.set(ip, {
      count: 1,
      resetAt: now + WINDOW_MS,
    });
    return {
      success: true,
      remaining: MAX_REQUESTS_PER_WINDOW - 1,
      resetInSeconds: Math.ceil(WINDOW_MS / 1000),
    };
  }

  // Window still active
  if (existing.count >= MAX_REQUESTS_PER_WINDOW) {
    const resetInSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    return {
      success: false,
      remaining: 0,
      resetInSeconds,
    };
  }

  existing.count += 1;
  return {
    success: true,
    remaining: MAX_REQUESTS_PER_WINDOW - existing.count,
    resetInSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
  };
}
