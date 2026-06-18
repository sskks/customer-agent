/**
 * 店播 AI Agent - API 速率限制工具
 *
 * 使用内存存储的滑动窗口算法，适合单机部署。
 * 对于多实例部署，建议使用 Redis + Upstash RateLimit。
 */

import { RateLimiterMemory } from 'rate-limiter-flexible';

export interface RateLimitConfig {
  points: number;
  duration: number;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  '/api/script': {
    points: 10,
    duration: 60,
  },
  '/api/recommendations': {
    points: 20,
    duration: 60,
  },
  '/api/feedback': {
    points: 30,
    duration: 60,
  },
  '/api/trending': {
    points: 30,
    duration: 60,
  },
  '/api/auth': {
    points: 5,
    duration: 60,
  },
};

const limiters: Record<string, RateLimiterMemory> = {};

Object.entries(RATE_LIMITS).forEach(([path, config]) => {
  limiters[path] = new RateLimiterMemory({
    points: config.points,
    duration: config.duration,
  });
});

function getClientIdentifier(request: Request, userId?: string): string {
  if (userId) {
    return `user:${userId}`;
  }

  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwardedFor?.split(',')[0] || realIp || 'unknown';

  return `ip:${ip}`;
}

export async function checkRateLimit(
  request: Request,
  path: string,
  userId?: string
): Promise<{
  success: boolean;
  remaining?: number;
  resetAt?: Date;
  retryAfter?: number;
}> {
  const limiter = limiters[path];

  if (!limiter) {
    return { success: true };
  }

  const clientKey = getClientIdentifier(request, userId);

  try {
    const res = await limiter.consume(clientKey, 1);

    return {
      success: true,
      remaining: res.remainingPoints,
      resetAt: new Date(Date.now() + res.msBeforeNext),
    };
  } catch (rejection) {
    const msBeforeNext =
      typeof rejection === 'object' &&
      rejection !== null &&
      'msBeforeNext' in rejection &&
      typeof rejection.msBeforeNext === 'number'
        ? rejection.msBeforeNext
        : 0;

    return {
      success: false,
      remaining: 0,
      resetAt: new Date(Date.now() + msBeforeNext),
      retryAfter: Math.ceil(msBeforeNext / 1000),
    };
  }
}

export function getRateLimitHeaders(limitInfo: Awaited<ReturnType<typeof checkRateLimit>>) {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': 'configured',
  };

  if (limitInfo.remaining !== undefined) {
    headers['X-RateLimit-Remaining'] = String(limitInfo.remaining);
  }

  if (limitInfo.resetAt) {
    headers['X-RateLimit-Reset'] = String(Math.floor(limitInfo.resetAt.getTime() / 1000));
  }

  if (!limitInfo.success && limitInfo.retryAfter) {
    headers['Retry-After'] = String(limitInfo.retryAfter);
  }

  return headers;
}

export async function clearRateLimit(path: string, userId: string) {
  const limiter = limiters[path];
  if (limiter) {
    await limiter.delete(`user:${userId}`);
  }
}
