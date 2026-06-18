/**
 * 脚本生成 API 接口
 * POST /api/script
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateScript, ScriptGenerationRequest } from '@/lib/scriptGenerator';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rateLimiter';
import { createClient } from '@/lib/supabase/server';
import { repairData } from '@/lib/textRepair';

export async function POST(request: NextRequest) {
  try {
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

    if (!body.topic || !body.contentType || !body.industry) {
      return NextResponse.json(
        {
          success: false,
          error: '缺少必要参数：topic, contentType, industry',
        },
        { status: 400 }
      );
    }

    const scriptRequest: ScriptGenerationRequest = {
      topic: body.topic,
      contentType: body.contentType,
      industry: body.industry,
      businessName: body.businessName || '未命名店铺',
      services: body.services,
      targetCustomers: body.targetCustomers,
    };

    console.log('[API] 收到脚本生成请求:', scriptRequest);

    const script = await generateScript(scriptRequest);

    console.log('[API] 脚本生成成功:', script.title);

    return NextResponse.json({
      success: true,
      data: {
        script: repairData(script),
        meta: {
          generatedAt: new Date().toISOString(),
          model: 'qwen-plus',
          cost: estimateCost(),
        },
      },
      headers: getRateLimitHeaders(rateLimit),
    });
  } catch (error) {
    console.error('[API] 脚本生成失败:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '生成失败，请重试',
      },
      { status: 500 }
    );
  }
}

async function getUserId(): Promise<string | undefined> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id;
  } catch {
    return undefined;
  }
}

function estimateCost(): number {
  return 0.03;
}
