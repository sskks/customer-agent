/**
 * 脚本生成 API 接口
 * POST /api/script
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateScript, ScriptGenerationRequest } from '@/lib/scriptGenerator';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rateLimiter';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // 速率限制检查
    const userId = await getUserId();
    const rateLimit = await checkRateLimit(request, '/api/script', userId);
    
    if (!rateLimit.success) {
      return NextResponse.json(
        {
          success: false,
          error: `请求过于频繁，请在 ${rateLimit.retryAfter} 秒后重试`,
          retryAfter: rateLimit.retryAfter,
        },
        { 
          status: 429,
          headers: getRateLimitHeaders(rateLimit),
        }
      );
    }

    const body = await request.json();
    
    // 验证必要参数
    if (!body.topic || !body.contentType || !body.industry) {
      return NextResponse.json(
        {
          success: false,
          error: '缺少必要参数：topic, contentType, industry'
        },
        { status: 400 }
      );
    }

    // 构建请求对象
    const scriptRequest: ScriptGenerationRequest = {
      topic: body.topic,
      contentType: body.contentType,
      industry: body.industry,
      businessName: body.businessName || '未命名店铺',
      services: body.services,
      targetCustomers: body.targetCustomers
    };

    console.log('[API] 收到脚本生成请求:', scriptRequest);

    // 生成脚本
    const script = await generateScript(scriptRequest);

    console.log('[API] 脚本生成成功:', script.title);

    return NextResponse.json({
      success: true,
      data: {
        script,
        meta: {
          generatedAt: new Date().toISOString(),
          model: 'qwen-plus',
          cost: estimateCost(script)
        }
      },
      headers: getRateLimitHeaders(rateLimit),
    });

  } catch (error) {
    console.error('[API] 脚本生成失败:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '生成失败，请重试'
      },
      { status: 500 }
    );
  }
}

/**
 * 获取当前用户 ID（如果已登录）
 */
async function getUserId(): Promise<string | undefined> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id;
  } catch {
    return undefined;
  }
}

/**
 * 估算成本（通义千问 qwen-plus）
 * 输入：0.008元/1K tokens，输出：0.02元/1K tokens
 * 平均每次调用约 1000 tokens
 */
function estimateCost(script: any): number {
  // 粗略估算：每次调用约 0.02-0.05 元
  return 0.03;
}
