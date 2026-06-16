/**
 * 店播AI Agent - 推荐引擎（支持反馈学习）
 * 当传入 FeedbackInsight 时，会根据用户历史反馈动态调整评分权重
 */

import {
  AgentContext,
  RecommendationCandidate,
  FinalRecommendation,
  ContentType,
  INDUSTRY_BENCHMARKS,
  SEASONAL_TOPICS,
  CONTENT_TYPE_LABELS,
  matchIndustryProfile,
  getDefaultIndustryProfile,
  IndustryProfile
} from './types';
import { FeedbackEngine, FeedbackInsight } from './feedbackEngine';

export class RecommendationEngine {

  /**
   * 生成推荐内容
   * @param context        用户上下文
   * @param topN           返回数量
   * @param feedbackInsight 反馈洞察（可选），来自 Supabase 的用户反馈数据
   */
  async generateRecommendations(
    context: AgentContext,
    topN: number = 5,
    feedbackInsight?: FeedbackInsight
  ): Promise<FinalRecommendation[]> {
    console.log('[RecommendationEngine] 开始生成推荐...');
    if (feedbackInsight && feedbackInsight.totalFeedback > 0) {
      console.log(`[RecommendationEngine] 已加载 ${feedbackInsight.totalFeedback} 条反馈，启用学习调整`);
    }

    // 生成候选
    const candidates = this.generateCandidates(context);

    // 评分（传入反馈洞察）
    const scored = this.scoreCandidates(candidates, context, feedbackInsight);

    // 取前N个并转换为最终格式
    const final = scored.slice(0, topN).map((candidate, index) =>
      this.convertToFinalRecommendation(candidate, context, index)
    );

    return final;
  }

  private generateCandidates(context: AgentContext): RecommendationCandidate[] {
    const candidates: RecommendationCandidate[] = [];

    // 获取行业档案
    const industryProfile = matchIndustryProfile(context.userProfile.industry) || getDefaultIndustryProfile();
    const season = context.currentSituation.season;

    // 来源1：热点话题（已在 route 层按行业筛选）
    const trendingCandidates = context.currentSituation.trendingTopics
      .slice(0, 3)
      .map(trend => ({
        topic: trend.keyword,
        contentType: 'knowledge' as ContentType,
        score: 0,
        reasons: [`热点话题：搜索量上涨${trend.growthRate}%`],
        metadata: {
          scoringDetails: [],
          estimatedEffort: {
            preparationTime: 0.5,
            shootingTime: 0.5,
            editingTime: 0.3
          }
        }
      }));
    candidates.push(...trendingCandidates);

    // 来源2：行业季节性话题（优先使用行业定制话题）
    const seasonalTopics = (industryProfile.seasonalTopics[season] || SEASONAL_TOPICS[season] || []);
    const seasonalCandidates = seasonalTopics.slice(0, 3).map(topic => ({
      topic,
      contentType: 'knowledge' as ContentType,
      score: 0,
      reasons: [`${season}季热门：${topic}`],
      metadata: {
        scoringDetails: [],
        estimatedEffort: {
          preparationTime: 0.5,
          shootingTime: 0.5,
          editingTime: 0.3
        }
      }
    }));
    candidates.push(...seasonalCandidates);

    // 来源3：行业最佳实践（使用行业定制选题）
    const bestPractices = industryProfile.bestPractices;

    const practiceCandidates = bestPractices.map(bp => ({
      topic: bp.topic,
      contentType: bp.type,
      score: 0,
      reasons: [`${context.userProfile.industry}行业最佳实践`],
      metadata: {
        scoringDetails: [],
        estimatedEffort: {
          preparationTime: 0.5,
          shootingTime: 0.5,
          editingTime: 0.5
        }
      }
    }));
    candidates.push(...practiceCandidates);

    return candidates;
  }

  private scoreCandidates(
    candidates: RecommendationCandidate[],
    context: AgentContext,
    feedbackInsight?: FeedbackInsight
  ): RecommendationCandidate[] {
    const industryProfile = matchIndustryProfile(context.userProfile.industry) || getDefaultIndustryProfile();
    const industryKws = industryProfile.trendingKeywords.map(k => k.toLowerCase());

    /** 判断一个话题是否与本行业相关 */
    const isIndustryRelevant = (topic: string): boolean => {
      const lower = topic.toLowerCase();
      return industryKws.some(kw => lower.includes(kw) || kw.includes(lower));
    };

    return candidates.map(candidate => {
      let totalScore = 0;
      const details: string[] = [];

      const relevant = isIndustryRelevant(candidate.topic);

      // 因子1：行业相关性（权重 0.45）— 最重要
      if (relevant) {
        totalScore += 0.45;
        details.push('行业相关 +0.45');
      }

      // 因子2：热点匹配（权重 0.15，仅行业相关时生效）
      const isTrending = context.currentSituation.trendingTopics.some(
        t => candidate.topic.includes(t.keyword)
      );
      if (isTrending && relevant) {
        totalScore += 0.15;
        details.push('热点匹配 +0.15');
      }

      // 因子3：季节性（权重 0.15）
      const season = context.currentSituation.season;
      const seasonalTopics = industryProfile.seasonalTopics[season] || SEASONAL_TOPICS[season] || [];
      const isSeasonal = seasonalTopics.some(t => candidate.topic.includes(t));
      if (isSeasonal) {
        totalScore += 0.15;
        details.push('季节性 +0.15');
      }

      // 因子4：历史表现（权重 0.05）
      const historicalScore = this.getHistoricalScore(candidate.contentType, context);
      totalScore += historicalScore * 0.05;

      // 因子5：多样性 + 基础分（权重 0.20）
      totalScore += 0.20;
      details.push('基础 +0.20');

      // 因子6：反馈学习调整（可选）
      if (feedbackInsight && feedbackInsight.totalFeedback > 0) {
        const beforeAdjust = totalScore;
        totalScore = FeedbackEngine.adjustScore(
          totalScore,
          candidate.contentType,
          candidate.topic,
          feedbackInsight
        );
        const diff = totalScore - beforeAdjust;
        if (Math.abs(diff) > 0.01) {
          details.push(`反馈学习 ${diff > 0 ? '+' : ''}${diff.toFixed(2)}`);
        }
      }

      candidate.score = Math.min(totalScore, 1.0);
      candidate.metadata.scoringDetails = details.map(d => ({
        factor: d,
        score: candidate.score,
        weight: 1,
        explanation: d
      }));
      candidate.reasons.push(...details.slice(0, 2));

      return candidate;
    })
    .sort((a, b) => b.score - a.score);
  }

  private getHistoricalScore(contentType: ContentType, context: AgentContext): number {
    const history = context.contentHistory.recentContents.filter(
      c => c.contentType === contentType
    );

    if (history.length === 0) {
      return 0.5; // 无数据，给中等分
    }

    const avgInquiries = history.reduce((sum, c) => sum + c.metrics.inquiries, 0) / history.length;
    const benchmarkInquiries = matchIndustryProfile(context.userProfile.industry)?.benchmark?.avgInquiries
      || (INDUSTRY_BENCHMARKS[context.userProfile.industry] || { avgViews: 2000, avgInquiries: 8 }).avgInquiries;

    return Math.min(avgInquiries / benchmarkInquiries, 1.0);
  }

  private convertToFinalRecommendation(
    candidate: RecommendationCandidate,
    context: AgentContext,
    index: number
  ): FinalRecommendation {
    const effort = candidate.metadata.estimatedEffort;
    const totalTime = effort.preparationTime + effort.shootingTime + effort.editingTime;

    const difficulty = totalTime <= 1 ? 'easy' : totalTime <= 2 ? 'medium' : 'hard';

    const benchmark = matchIndustryProfile(context.userProfile.industry)?.benchmark
      || INDUSTRY_BENCHMARKS[context.userProfile.industry]
      || { avgViews: 2000, avgInquiries: 8 };

    return {
      id: `rec_${Date.now()}_${index}`,
      topic: candidate.topic,
      contentType: candidate.contentType,
      title: this.generateTitle(candidate),
      reason: candidate.reasons.slice(0, 2).join('；'),
      expectedOutcome: {
        views: Math.round(benchmark.avgViews * (0.8 + candidate.score * 0.4)),
        inquiries: Math.round(benchmark.avgInquiries * (0.5 + candidate.score * 0.5)),
        confidence: candidate.score
      },
      difficulty,
      estimatedTime: totalTime,
      confidence: candidate.score,
      needsConfirmation: candidate.score < 0.7
    };
  }

  private generateTitle(candidate: RecommendationCandidate): string {
    const templates: Record<ContentType, string[]> = {
      customer_case: [
        `顾客${candidate.topic}的真实案例`,
        `${candidate.topic}前后对比`,
        `她做了${candidate.topic}，结果惊艳了`
      ],
      knowledge: [
        `${candidate.topic}的3个误区`,
        `专业师告诉你：${candidate.topic}`,
        `${candidate.topic}必看指南`
      ],
      environment_tour: [
        `带你参观我们的${candidate.topic}`,
        `${candidate.topic}环境大公开`
      ],
      promotion: [
        `${candidate.topic}限时优惠`,
        `本周特惠：${candidate.topic}`
      ],
      behind_scenes: [
        `${candidate.topic}幕后故事`,
        `你不知道的${candidate.topic}`
      ],
      product_showcase: [
        `新品：${candidate.topic}`,
        `${candidate.topic}详细介绍`
      ]
    };

    const templateList = templates[candidate.contentType] || templates.knowledge;
    return templateList[Math.floor(Math.random() * templateList.length)];
  }
}
