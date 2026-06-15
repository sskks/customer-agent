/**
 * 抖音热搜 / 热点数据 API
 * GET  → 获取热搜榜（可选 keyword 过滤）
 * POST → 按关键词搜索热点话题 + 相关视频
 */

import { NextRequest, NextResponse } from 'next/server';
import { DouyinService } from '@/lib/douyinService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get('keyword') || undefined;

    const service = new DouyinService();
    const topics = await service.getHotTopics(keyword);

    return NextResponse.json({
      success: true,
      data: {
        topics,
        source: process.env.DOUYIN_HOT_API_KEY ? 'xxapi' : 'mock',
        keyword: keyword || '全部',
      },
    });
  } catch (error) {
    console.error('[Trending API] GET 失败:', error);
    return NextResponse.json({ success: false, error: '获取热搜数据失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keyword } = body;

    if (!keyword || !keyword.trim()) {
      return NextResponse.json({ success: false, error: '请输入搜索关键词' }, { status: 400 });
    }

    const service = new DouyinService();
    const result = await service.search(keyword.trim());

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        source: process.env.DOUYIN_HOT_API_KEY ? 'xxapi' : 'mock',
      },
    });
  } catch (error) {
    console.error('[Trending API] POST 失败:', error);
    return NextResponse.json({ success: false, error: '搜索失败，请重试' }, { status: 500 });
  }
}
