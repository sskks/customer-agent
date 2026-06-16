/**
 * 推荐API接口 - 集成反馈学习
 */

import { NextRequest, NextResponse } from 'next/server';
import { RecommendationEngine } from '@/lib/recommendationEngine';
import { FeedbackEngine } from '@/lib/feedbackEngine';
import { AgentContext } from '@/lib/types';
import { getFeedbackRecords, saveRecommendation } from '@/lib/store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 获取反馈数据
    const feedbackRecords = getFeedbackRecords();
    const feedbackInsight = FeedbackEngine.analyzeFeedback(feedbackRecords);

    // MVP版本：使用模拟数据构建上下文
    const context: AgentContext = {
      userProfile: {
        userId: 'demo_user',
        industry: body.industry || 'beauty',
        businessName: body.businessName || '演示美容院',
        location: '上海',
        services: [
          { id: '1', name: '补水护理', description: '深层补水', price: 299 },
          { id: '2', name: '抗衰护理', description: '紧致抗衰', price: 599 }
        ],
        targetCustomers: '25-45岁女性',
        priceRange: '200-800元'
      },
      businessMetrics: {
        userId: 'demo_user',
        totalContents: 15,
        avgViewsPerContent: 2500,
        avgInquiriesPerContent: 10,
        trend: 'up',
        byContentType: {
          customer_case: { count: 5, avgInquiries: 15 },
          knowledge: { count: 6, avgInquiries: 12 },
          environment_tour: { count: 2, avgInquiries: 5 },
          promotion: { count: 1, avgInquiries: 8 },
          behind_scenes: { count: 1, avgInquiries: 6 },
          product_showcase: { count: 0, avgInquiries: 0 }
        }
      },
      contentHistory: {
        totalPublished: 15,
        recentContents: []
      },
      preferences: {
        userId: 'demo_user',
        preferredContentTypes: ['customer_case', 'knowledge'],
        avoidedTopics: [],
        maxDifficulty: 'medium'
      },
      currentSituation: {
        season: 'summer',
        trendingTopics: [
          { keyword: '夏季补水', searchVolume: 50000, growthRate: 300 },
          { keyword: '防晒护理', searchVolume: 40000, growthRate: 250 },
          { keyword: '敏感肌修复', searchVolume: 30000, growthRate: 180 }
        ]
      }
    };

    // 生成推荐（传入反馈洞察用于评分调整）
    const engine = new RecommendationEngine();
    const recommendations = await engine.generateRecommendations(context, 5, feedbackInsight);

    // 保存推荐历史（用于后续反馈关联）
    recommendations.forEach(rec => {
      saveRecommendation('demo_user', rec);
    });

    return NextResponse.json({
      success: true,
      data: {
        recommendations,
        context: {
          industry: context.userProfile.industry,
          businessName: context.userProfile.businessName,
          season: context.currentSituation.season
        },
        feedbackInsight: {
          totalFeedback: feedbackInsight.totalFeedback,
          satisfaction: feedbackInsight.satisfaction,
          suggestions: feedbackInsight.suggestions
        }
      }
    });

  } catch (error) {
    console.error('[API] 推荐生成失败:', error);

    return NextResponse.json(
      {
        success: false,
        error: '生成失败，请重试'
      },
      { status: 500 }
    );
  }
}
