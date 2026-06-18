
import { NextRequest, NextResponse } from 'next/server';
import { FeedbackEngine, type FeedbackRecord } from '@/lib/feedbackEngine';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rateLimiter';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: '请先登录' }, { status: 401 });
    }

    const rateLimit = await checkRateLimit(request, '/api/feedback', user.id);
    if (!rateLimit.success) {
      return NextResponse.json(
        { success: false, error: '请求过于频繁，请稍后重试' },
        { status: 429, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    const body = await request.json();
    const { action, recommendationId, feedback, views, inquiries } = body;

    if (action === 'submit') {
      if (!recommendationId || !feedback) {
        return NextResponse.json({ success: false, error: '缺少 recommendationId 或 feedback' }, { status: 400 });
      }

      const { data, error } = await supabase
        .from('recommendation_history')
        .update({ user_feedback: feedback })
        .eq('id', recommendationId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({ success: true, message: '反馈已记录', data }, { headers: getRateLimitHeaders(rateLimit) });
    }

    if (action === 'record_metrics') {
      if (!recommendationId) {
        return NextResponse.json({ success: false, error: '缺少 recommendationId' }, { status: 400 });
      }

      const { data: contentRecord, error: insertError } = await supabase
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

      if (insertError) throw insertError;

      const { error: updateError } = await supabase
        .from('recommendation_history')
        .update({ actual_content_id: contentRecord.id, user_feedback: feedback || 'good' })
        .eq('id', recommendationId)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      await supabase.rpc('refresh_business_metrics', { p_user_id: user.id });

      return NextResponse.json({ success: true, message: '效果数据已记录', data: contentRecord }, { headers: getRateLimitHeaders(rateLimit) });
    }

    return NextResponse.json({ success: false, error: '未知操作' }, { status: 400 });
  } catch (error) {
    console.error('[Feedback API] POST failed:', error);
    return NextResponse.json({ success: false, error: '提交失败，请稍后重试' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: '请先登录' }, { status: 401 });
    }

    const { data: history, error } = await supabase
      .from('recommendation_history')
      .select('*')
      .eq('user_id', user.id)
      .not('user_feedback', 'is', null)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    const feedbackHistory = (history || []) as Array<{
      id: string;
      user_id: string;
      topic: string;
      content_type: string;
      user_feedback: 'good' | 'neutral' | 'bad';
      created_at: string;
    }>;

    const records: FeedbackRecord[] = feedbackHistory.map((record) => ({
      id: record.id,
      userId: record.user_id,
      recommendationId: record.id,
      topic: record.topic,
      contentType: record.content_type,
      feedback: record.user_feedback,
      createdAt: record.created_at,
    }));

    const insight = FeedbackEngine.analyzeFeedback(records);

    return NextResponse.json({ success: true, data: { insight, recentFeedback: records.slice(0, 10) } });
  } catch (error) {
    console.error('[Feedback API] GET failed:', error);
    return NextResponse.json({ success: false, error: '获取反馈数据失败' }, { status: 500 });
  }
}
