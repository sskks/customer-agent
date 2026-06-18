import { NextRequest, NextResponse } from 'next/server';
import { DouyinService } from '@/lib/douyinService';
import { repairData, repairText } from '@/lib/textRepair';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get('keyword') || undefined;

    const service = new DouyinService();
    const topics = await service.getHotTopics(keyword);

    return NextResponse.json({
      success: true,
      data: {
        topics: repairData(topics),
        source: process.env.DOUYIN_HOT_API_KEY ? 'xxapi' : 'mock',
        keyword: repairText(keyword || '全部'),
      },
    });
  } catch (error) {
    console.error('[Trending API] GET failed:', error);
    return NextResponse.json(
      { success: false, error: '获取热点数据失败，请稍后重试' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keyword } = body;

    if (!keyword || !keyword.trim()) {
      return NextResponse.json(
        { success: false, error: '请输入要搜索的关键词' },
        { status: 400 }
      );
    }

    const service = new DouyinService();
    const result = await service.search(keyword.trim());

    return NextResponse.json({
      success: true,
      data: {
        ...repairData(result),
        source: process.env.DOUYIN_HOT_API_KEY ? 'xxapi' : 'mock',
      },
    });
  } catch (error) {
    console.error('[Trending API] POST failed:', error);
    return NextResponse.json(
      { success: false, error: '搜索失败，请稍后重试' },
      { status: 500 }
    );
  }
}
