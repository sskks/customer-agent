/**
 * 店播AI Agent - 推荐引擎（支持反馈学习）
 */

import {
  AgentContext,
  RecommendationCandidate,
  FinalRecommendation,
  ContentType,
  INDUSTRY_BENCHMARKS,
  SEASONAL_TOPICS,
  CONTENT_TYPE_LABELS
} from './types';
import { FeedbackEngine, FeedbackInsight } from './feedbackEngine';

export class RecommendationEngine {

  /**
   * 生成推荐内容
   * @param context 用户上下文
   * @param topN    返回数量
   * @param feedbackInsight 反馈洞察（可选），用于调整评分
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

    // 来源1：热点话题
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

    // 来源2：季节性话题
    const season = context.currentSituation.season;
    const seasonalTopics = SEASONAL_TOPICS[season] || [];
    const seasonalCandidates = seasonalTopics.slice(0, 2).map(topic => ({
      topic,
      contentType: 'knowledge' as ContentType,
      score: 0,
      reasons: [`${season}是这类内容的旺季`],
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

    // 来源3：最佳实践（覆盖所有内容类型）
    const bestPractices = [
      { topic: '顾客案例分享', type: 'customer_case' as ContentType },
      { topic: '专业知识科普', type: 'knowledge' as ContentType },
      { topic: '限时优惠活动', type: 'promotion' as ContentType },
      { topic: '店内环境展示', type: 'environment_tour' as ContentType },
      { topic: '团队幕后日常', type: 'behind_scenes' as ContentType },
      { topic: '明星产品推荐', type: 'product_showcase' as ContentType }
    ];

    const practiceCandidates = bestPractices.map(bp => ({
      topic: bp.topic,
      contentType: bp.type,
      score: 0,
      reasons: ['行业最佳实践'],
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
    return candidates.map(candidate => {
      let totalScore = 0;
      const details: string[] = [];

      // 因子1：热点匹配（权重0.35）
      const isTrending = context.currentSituation.trendingTopics.some(
        t => candidate.topic.includes(t.keyword)
      );
      if (isTrending) {
        totalScore += 0.35;
        details.push('热点匹配 +0.35');
      }

      // 因子2：季节性（权重0.25）
      const season = context.currentSituation.season;
      const seasonalTopics = SEASONAL_TOPICS[season] || [];
      const isSeasonal = seasonalTopics.some(t => candidate.topic.includes(t));
      if (isSeasonal) {
        totalScore += 0.25;
        details.push('季节性 +0.25');
      }

      // 因子3：历史表现（权重0.2）
      const historicalScore = this.getHistoricalScore(candidate.contentType, context);
      totalScore += historicalScore * 0.2;
      details.push(`历史表现 +${(historicalScore * 0.2).toFixed(2)}`);

      // 因子4：多样性（权重0.1）
      totalScore += 0.1;
      details.push('多样性 +0.10');

      // 因子5：反馈学习调整（权重0.1，外加 FeedbackEngine 的 ±30%/±20% 调整）
      totalScore += 0.1;
      details.push('基础分 +0.10');

      // 如果有反馈数据，用 FeedbackEngine 调整最终分数
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
        score: totalScore,
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
    const benchmark = INDUSTRY_BENCHMARKS[context.userProfile.industry].avgInquiries;

    return Math.min(avgInquiries / benchmark, 1.0);
  }

  private convertToFinalRecommendation(
    candidate: RecommendationCandidate,
    context: AgentContext,
    index: number
  ): FinalRecommendation {
    const effort = candidate.metadata.estimatedEffort;
    const totalTime = effort.preparationTime + effort.shootingTime + effort.editingTime;

    const difficulty = totalTime <= 1 ? 'easy' : totalTime <= 2 ? 'medium' : 'hard';

    const benchmark = INDUSTRY_BENCHMARKS[context.userProfile.industry];

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
