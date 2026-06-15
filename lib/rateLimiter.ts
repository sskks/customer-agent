/**
 * 店播AI Agent - API 速率限制工具
 * 
 * 使用内存存储的滑动窗口算法，适合单机部署
 * 对于多实例部署，建议使用 Redis + Upstash RateLimit
 */

import { RateLimiterMemory } from 'rate-limiter-flexible';

// 速率限制配置
export interface RateLimitConfig {
  points: number;      // 允许的请求次数
  duration: number;    // 时间窗口（秒）
}

// 不同 API 端点的速率限制策略
const RATE_LIMITS: Record<string, RateLimitConfig> = {
  // 脚本生成 - 较严格（消耗 LLM token）
  '/api/script': {
    points: 10,        // 每用户每 60 秒最多 10 次
    duration: 60,
  },
  
  // 推荐生成 - 中等限制
  '/api/recommendations': {
    points: 20,        // 每用户每 60 秒最多 20 次
    duration: 60,
  },
  
  // 反馈提交 - 宽松限制
  '/api/feedback': {
    points: 30,        // 每用户每 60 秒最多 30 次
    duration: 60,
  },
  
  // 热搜搜索 - 宽松限制
  '/api/trending': {
    points: 30,        // 每用户每 60 秒最多 30 次
    duration: 60,
  },
  
  // 认证相关 - 严格限制（防止暴力破解）
  '/api/auth': {
    points: 5,         // 每 IP 每 60 秒最多 5 次
    duration: 60,
  },
};

// 创建速率限制器实例（按端点隔离）
const limiters: Record<string, RateLimiterMemory> = {};

Object.entries(RATE_LIMITS).forEach(([path, config]) => {
  limiters[path] = new RateLimiterMemory({
    points: config.points,
    duration: config.duration,
  });
});

/**
 * 获取客户端标识（优先用用户 ID，其次用 IP）
 */
function getClientIdentifier(request: Request, userId?: string): string {
  if (userId) {
    return `user:${userId}`;
  }
  
  // 从请求头获取 IP
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwardedFor?.split(',')[0] || realIp || 'unknown';
  
  return `ip:${ip}`;
}

/**
 * 检查速率限制
 * @returns { success: boolean, remaining?: number, resetAt?: Date }
 */
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
    // 没有配置速率限制的端点，直接放行
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
  } catch (rejRes: any) {
    // 超过限制
    return {
      success: false,
      remaining: 0,
      resetAt: new Date(Date.now() + rejRes.msBeforeNext),
      retryAfter: Math.ceil(rejRes.msBeforeNext / 1000),
    };
  }
}

/**
 * 生成速率限制响应头
 */
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

/**
 * 清除指定用户的速率限制记录（用于管理员操作）
 */
export async function clearRateLimit(path: string, userId: string) {
  const limiter = limiters[path];
  if (limiter) {
    await limiter.delete(`user:${userId}`);
  }
}
