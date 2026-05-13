interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export interface RateLimitOptions {
  windowMs: number;
  max: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

export function checkRateLimit(
  key: string,
  identifier: string,
  options: RateLimitOptions
): RateLimitResult {
  const compositeKey = `${key}:${identifier}`;
  const now = Date.now();
  const windowStart = now - options.windowMs;

  // Clean up expired entries
  for (const [k, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(k);
    }
  }

  const entry = rateLimitStore.get(compositeKey);

  if (!entry || entry.resetTime < now) {
    // Create new entry or reset expired
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + options.windowMs,
    };
    rateLimitStore.set(compositeKey, newEntry);
    return {
      allowed: true,
      remaining: options.max - 1,
      resetTime: newEntry.resetTime,
    };
  }

  if (entry.count >= options.max) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  // Increment count
  entry.count++;
  return {
    allowed: true,
    remaining: options.max - entry.count,
    resetTime: entry.resetTime,
  };
}

export function getClientIp(headers: Headers): string {
  // Try various headers for the real IP
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  const cfConnectingIp = headers.get("cf-connecting-ip");
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  return "unknown";
}

export function getRateLimitErrorMessage(): string {
  return "คำขอมากเกินไป กรุณารอสักครู่แล้วลองใหม่";
}
