/**
 * 反馈 API
 * POST: 提交反馈（点赞/踩）
 * GET:  获取反馈洞察
 */

import { NextRequest, NextResponse } from 'next/server';
import { FeedbackEngine, FeedbackRecord } from '@/lib/feedbackEngine';
import { addFeedback, getFeedbackRecords, getFeedbackForRecommendation } from '@/lib/store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'submit') {
      const { recommendationId, contentType, topic, feedback } = body;

      if (!recommendationId || !contentType || !topic || !feedback) {
        return NextResponse.json(
          { success: false, error: '缺少必要参数' },
          { status: 400 }
        );
      }

      // 检查是否已经反馈过
      const existing = getFeedbackForRecommendation(recommendationId);
      if (existing) {
        // 更新反馈
        existing.feedback = feedback;
        return NextResponse.json({ success: true, data: { updated: true } });
      }

      // 新增反馈
      const record: FeedbackRecord = {
        id: `fb_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        recommendationId,
        contentType,
        topic,
        feedback,
        createdAt: new Date()
      };

      addFeedback(record);

      return NextResponse.json({ success: true, data: { feedback: record } });
    }

    return NextResponse.json(
      { success: false, error: '未知操作' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[Feedback API] 错误:', error);
    return NextResponse.json(
      { success: false, error: '操作失败' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const records = getFeedbackRecords();
    const insight = FeedbackEngine.analyzeFeedback(records);
    return NextResponse.json({ success: true, data: insight });
  } catch (error) {
    console.error('[Feedback API] 获取洞察失败:', error);
    return NextResponse.json(
      { success: false, error: '获取失败' },
      { status: 500 }
    );
  }
}
