/**
 * 推荐 API 接口
 * - 已登录：从 Supabase 读取用户资料、业务指标、反馈数据，生成个性化推荐并保存历史
 * - 未登录：使用模拟数据生成演示推荐
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { RecommendationEngine } from '@/lib/recommendationEngine';
import { FeedbackEngine, FeedbackRecord } from '@/lib/feedbackEngine';
import { AgentContext, Industry } from '@/lib/types';
import { DouyinService } from '@/lib/douyinService';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rateLimiter';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 速率限制检查
    const rateLimit = await checkRateLimit(request, '/api/recommendations', user?.id);
    
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

    let context: AgentContext;
    let feedbackInsight: ReturnType<typeof FeedbackEngine.analyzeFeedback> | undefined;
    let userId: string | null = null;

    if (user) {
      // ═══ 已登录用户：从 Supabase 读取真实数据 ═══
      userId = user.id;

      // 0. 获取抖音热搜数据（动态 trending）
      const douyin = new DouyinService();
      let trendingFromDouyin = [];
      try {
        const hotTopics = await douyin.getHotTopics();
        trendingFromDouyin = hotTopics.slice(0, 6).map(t => ({
          keyword: t.keyword,
          searchVolume: t.heatValue,
          growthRate: Math.round(50 + Math.random() * 300),
        }));
      } catch (err) {
        console.error('[API] 获取热搜数据失败，使用默认数据:', err);
        trendingFromDouyin = [
          { keyword: '夏季护肤技巧', searchVolume: 50000, growthRate: 200 },
          { keyword: '防晒指南', searchVolume: 40000, growthRate: 180 },
          { keyword: '清爽穿搭', searchVolume: 30000, growthRate: 150 },
        ];
      }

      // 1. 读取用户资料
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      // 2. 读取用户服务
      const { data: services } = await supabase
        .from('services')
        .select('*')
        .eq('user_id', userId);

      // 3. 读取业务指标
      const { data: metrics } = await supabase
        .from('business_metrics')
        .select('*')
        .eq('user_id', userId)
        .single();

      // 4. 读取内容历史
      const { data: contents } = await supabase
        .from('content_records')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      // 5. 读取用户偏好
      const { data: prefs } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      // 6. 读取反馈数据 → 生成学习洞察
      const { data: feedbackHistory } = await supabase
        .from('recommendation_history')
        .select('*')
        .eq('user_id', userId)
        .not('user_feedback', 'is', null)
        .order('created_at', { ascending: false })
        .limit(100);

      if (feedbackHistory && feedbackHistory.length > 0) {
        const records: FeedbackRecord[] = feedbackHistory.map((rec: any) => ({
          id: rec.id,
          userId: rec.user_id,
          recommendationId: rec.id,
          topic: rec.topic,
          contentType: rec.content_type,
          feedback: rec.user_feedback,
          createdAt: rec.created_at,
        }));
        feedbackInsight = FeedbackEngine.analyzeFeedback(records);
      }

      // 构建上下文（优先用真实数据，缺失字段用默认值）
      const industry = (profile?.industry || body.industry || 'beauty') as Industry;
      context = {
        userProfile: {
          userId,
          industry,
          businessName: profile?.business_name || body.businessName || '我的店铺',
          location: profile?.location || '上海',
          services: (services || []).map((s: any) => ({
            id: s.id,
            name: s.name,
            description: s.description || '',
            price: s.price || 0,
          })),
          targetCustomers: prefs?.target_customers || '25-45岁女性',
          priceRange: prefs?.price_range || '200-800元',
        },
        businessMetrics: metrics ? {
          userId,
          totalContents: metrics.total_contents || 0,
          avgViewsPerContent: metrics.avg_views || 0,
          avgInquiriesPerContent: metrics.avg_inquiries || 0,
          trend: (metrics.trend as 'up' | 'down' | 'stable') || 'stable',
          byContentType: metrics.by_content_type || getDefaultByContentType(),
        } : {
          userId,
          totalContents: 0,
          avgViewsPerContent: 0,
          avgInquiriesPerContent: 0,
          trend: 'stable' as const,
          byContentType: getDefaultByContentType(),
        },
        contentHistory: {
          totalPublished: (contents || []).length,
          recentContents: (contents || []).slice(0, 20).map((c: any) => ({
            id: c.id,
            userId: userId!,
            topic: c.topic,
            contentType: c.content_type,
            title: c.title,
            metrics: c.metrics || { views: 0, likes: 0, comments: 0, inquiries: 0 },
            publishedAt: c.published_at,
          })),
        },
        preferences: {
          userId,
          preferredContentTypes: (prefs?.preferred_content_types as any[]) || ['customer_case', 'knowledge'],
          avoidedTopics: (prefs?.avoided_topics as string[]) || [],
          maxDifficulty: (prefs?.max_difficulty as 'easy' | 'medium' | 'hard') || 'medium',
        },
        currentSituation: {
          season: getCurrentSeason(),
          trendingTopics: trendingFromDouyin,
        },
      };
    } else {
      // ═══ 未登录：模拟数据 ═══
      // 同样从 DouyinService 获取动态热搜
      const douyin = new DouyinService();
      let trendingForDemo = [];
      try {
        const hotTopics = await douyin.getHotTopics();
        trendingForDemo = hotTopics.slice(0, 6).map(t => ({
          keyword: t.keyword,
          searchVolume: t.heatValue,
          growthRate: Math.round(50 + Math.random() * 300),
        }));
      } catch {
        trendingForDemo = [
          { keyword: '夏季护肤技巧', searchVolume: 50000, growthRate: 200 },
          { keyword: '防晒指南', searchVolume: 40000, growthRate: 180 },
          { keyword: '清爽穿搭', searchVolume: 30000, growthRate: 150 },
        ];
      }

      context = {
        userProfile: {
          userId: 'demo_user',
          industry: (body.industry || 'beauty') as Industry,
          businessName: body.businessName || '演示美容院',
          location: '上海',
          services: [
            { id: '1', name: '补水护理', description: '深层补水', price: 299 },
            { id: '2', name: '抗衰护理', description: '紧致抗衰', price: 599 },
          ],
          targetCustomers: '25-45岁女性',
          priceRange: '200-800元',
        },
        businessMetrics: {
          userId: 'demo_user',
          totalContents: 15,
          avgViewsPerContent: 2500,
          avgInquiriesPerContent: 10,
          trend: 'up',
          byContentType: getDefaultByContentType(),
        },
        contentHistory: { totalPublished: 15, recentContents: [] },
        preferences: {
          userId: 'demo_user',
          preferredContentTypes: ['customer_case', 'knowledge'],
          avoidedTopics: [],
          maxDifficulty: 'medium',
        },
        currentSituation: {
          season: getCurrentSeason(),
          trendingTopics: trendingForDemo,
        },
      };
    }

    // ═══ 生成推荐（传入反馈洞察）═══
    const engine = new RecommendationEngine();
    const recommendations = await engine.generateRecommendations(context, 5, feedbackInsight);

    // ═══ 已登录时保存推荐历史 ═══
    if (userId) {
      for (const rec of recommendations) {
        try {
          const { data } = await supabase
            .from('recommendation_history')
            .insert({
              user_id: userId,
              topic: rec.topic,
              content_type: rec.contentType,
              title: rec.title,
              reason: rec.reason,
              score: rec.confidence,
              confidence: rec.confidence,
              expected_views: rec.expectedOutcome.views,
              expected_inquiries: rec.expectedOutcome.inquiries,
              difficulty: rec.difficulty,
              estimated_time: rec.estimatedTime,
            })
            .select()
            .single();

          // 用 Supabase 返回的真实 ID 替换前端 ID
          if (data) {
            rec.id = data.id;
          }
        } catch (err) {
          console.error('[API] 保存推荐历史失败:', err);
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        recommendations,
        context: {
          industry: context.userProfile.industry,
          businessName: context.userProfile.businessName,
          season: context.currentSituation.season,
        },
        feedbackInsight: feedbackInsight
          ? {
              totalFeedback: feedbackInsight.totalFeedback,
              satisfaction: feedbackInsight.overallSatisfaction,
              suggestions: feedbackInsight.suggestions,
            }
          : null,
      },
      headers: getRateLimitHeaders(rateLimit),
    });
  } catch (error) {
    console.error('[API] 推荐生成失败:', error);
    return NextResponse.json({ success: false, error: '生成失败，请重试' }, { status: 500 });
  }
}

/* ─── 工具函数 ─────────────────────────────── */

function getCurrentSeason(): 'spring' | 'summer' | 'autumn' | 'winter' {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}

function getDefaultByContentType() {
  return {
    customer_case: { count: 5, avgInquiries: 15 },
    knowledge: { count: 6, avgInquiries: 12 },
    environment_tour: { count: 2, avgInquiries: 5 },
    promotion: { count: 1, avgInquiries: 8 },
    behind_scenes: { count: 1, avgInquiries: 6 },
    product_showcase: { count: 0, avgInquiries: 0 },
  };
}
