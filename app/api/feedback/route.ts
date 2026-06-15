/**
 * 反馈 API 路由
 * POST /api/feedback — 提交反馈 / 录入实际效果数据
 * GET  /api/feedback — 获取反馈洞察
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { FeedbackEngine, FeedbackRecord } from '@/lib/feedbackEngine';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
    }

    const body = await request.json();
    const { action, recommendationId, feedback, views, inquiries } = body;

    if (action === 'submit') {
      // 提交反馈（点赞/点踩）
      if (!recommendationId || !feedback) {
        return NextResponse.json(
          { success: false, error: '缺少 recommendationId 或 feedback' },
          { status: 400 }
        );
      }

      const { data, error } = await supabase
        .from('recommendation_history')
        .update({ user_feedback: feedback })
        .eq('id', recommendationId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({
        success: true,
        message: feedback === 'good' ? '感谢反馈！已记录你的偏好' : feedback === 'bad' ? '已记录，下次推荐会避免类似内容' : '已记录',
        data,
      });
    }

    if (action === 'record_metrics') {
      // 录入视频实际效果数据
      if (!recommendationId) {
        return NextResponse.json(
          { success: false, error: '缺少 recommendationId' },
          { status: 400 }
        );
      }

      // 先创建内容记录
      const { data: contentData, error: contentError } = await supabase
        .from('content_records')
        .insert({
          user_id: user.id,
          topic: body.topic || '',
          content_type: body.contentType || 'knowledge',
          title: body.title || '',
          metrics: { views: views || 0, likes: 0, comments: 0, inquiries: inquiries || 0 },
          status: 'published',
          published_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (contentError) throw contentError;

      // 关联到推荐历史
      const { error: updateError } = await supabase
        .from('recommendation_history')
        .update({
          actual_content_id: contentData.id,
          user_feedback: feedback || 'good',
        })
        .eq('id', recommendationId)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // 刷新业务指标
      await supabase.rpc('refresh_business_metrics', { p_user_id: user.id });

      return NextResponse.json({
        success: true,
        message: '效果数据已记录！Agent 会据此优化下次推荐',
        data: contentData,
      });
    }

    return NextResponse.json({ success: false, error: '未知操作' }, { status: 400 });
  } catch (error) {
    console.error('[Feedback API] 错误:', error);
    return NextResponse.json(
      { success: false, error: '提交失败，请重试' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
    }

    // 获取用户的推荐历史和反馈
    const { data: history, error } = await supabase
      .from('recommendation_history')
      .select('*')
      .eq('user_id', user.id)
      .not('user_feedback', 'is', null)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    // 转换为 FeedbackRecord 格式
    const records: FeedbackRecord[] = (history || []).map((rec: any) => ({
      id: rec.id,
      userId: rec.user_id,
      recommendationId: rec.id,
      topic: rec.topic,
      contentType: rec.content_type,
      feedback: rec.user_feedback,
      createdAt: rec.created_at,
    }));

    // 分析反馈数据
    const insight = FeedbackEngine.analyzeFeedback(records);

    return NextResponse.json({
      success: true,
      data: {
        insight,
        recentFeedback: records.slice(0, 10),
      },
    });
  } catch (error) {
    console.error('[Feedback API] 错误:', error);
    return NextResponse.json(
      { success: false, error: '获取反馈数据失败' },
      { status: 500 }
    );
  }
}
