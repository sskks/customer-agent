/**
 * 脚本生成 API
 * POST: 为推荐选题生成完整拍摄脚本
 */

import { NextRequest, NextResponse } from 'next/server';
import { ScriptGenerator } from '@/lib/scriptGenerator';
import { FinalRecommendation, Industry } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recommendation, industry, businessName } = body;

    if (!recommendation || !industry || !businessName) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      );
    }

    const generator = new ScriptGenerator();
    const script = await generator.generate(
      recommendation as FinalRecommendation,
      industry as Industry,
      businessName as string
    );

    return NextResponse.json({ success: true, data: script });
  } catch (error) {
    console.error('[Script API] 脚本生成失败:', error);
    return NextResponse.json(
      { success: false, error: '脚本生成失败，请重试' },
      { status: 500 }
    );
  }
}
