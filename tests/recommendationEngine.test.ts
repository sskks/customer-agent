import { describe, expect, it } from 'vitest';
import { RecommendationEngine } from '@/lib/recommendationEngine';
import type { AgentContext } from '@/lib/types';

function createContext(): AgentContext {
  return {
    userProfile: {
      userId: 'user-1',
      industry: 'beauty',
      businessName: '测试门店',
      location: '上海',
      services: [],
      targetCustomers: '白领女性',
      priceRange: '200-500',
    },
    businessMetrics: {
      userId: 'user-1',
      totalContents: 10,
      avgViewsPerContent: 2200,
      avgInquiriesPerContent: 9,
      trend: 'up',
      byContentType: {
        customer_case: { count: 2, avgInquiries: 10 },
        knowledge: { count: 4, avgInquiries: 12 },
        environment_tour: { count: 1, avgInquiries: 4 },
        promotion: { count: 1, avgInquiries: 6 },
        behind_scenes: { count: 1, avgInquiries: 5 },
        product_showcase: { count: 1, avgInquiries: 7 },
      },
    },
    contentHistory: {
      totalPublished: 3,
      recentContents: [
        {
          id: 'c1',
          userId: 'user-1',
          topic: '补水护理',
          contentType: 'knowledge',
          title: '补水护理怎么讲',
          metrics: {
            views: 3200,
            likes: 120,
            comments: 30,
            inquiries: 14,
          },
        },
      ],
    },
    preferences: {
      userId: 'user-1',
      preferredContentTypes: ['knowledge', 'customer_case'],
      avoidedTopics: [],
      maxDifficulty: 'medium',
    },
    currentSituation: {
      season: 'summer',
      trendingTopics: [
        { keyword: '补水', searchVolume: 50000, growthRate: 180 },
        { keyword: '防晒', searchVolume: 42000, growthRate: 140 },
        { keyword: '美甲', searchVolume: 30000, growthRate: 100 },
      ],
    },
  };
}

describe('RecommendationEngine', () => {
  it('returns top N recommendations with expected shape', async () => {
    const engine = new RecommendationEngine();
    const recommendations = await engine.generateRecommendations(createContext(), 3);

    expect(recommendations).toHaveLength(3);
    expect(recommendations[0].id).toContain('rec_');
    expect(recommendations[0].confidence).toBeGreaterThan(0);
    expect(recommendations[0].expectedOutcome.views).toBeGreaterThan(0);
  });

  it('sorts recommendations by confidence descending', async () => {
    const engine = new RecommendationEngine();
    const recommendations = await engine.generateRecommendations(createContext(), 5);

    const confidences = recommendations.map((item) => item.confidence);
    const sorted = [...confidences].sort((a, b) => b - a);

    expect(confidences).toEqual(sorted);
  });
});
