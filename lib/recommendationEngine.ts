
import {
  type AgentContext,
  type ContentType,
  type FinalRecommendation,
  INDUSTRY_BENCHMARKS,
  type RecommendationCandidate,
  SEASONAL_TOPICS,
  getDefaultIndustryProfile,
  matchIndustryProfile,
} from './types';
import { FeedbackEngine, type FeedbackInsight } from './feedbackEngine';

const TITLE_TEMPLATES: Record<ContentType, string[]> = {
  customer_case: ['客户案例拆解：{topic}', '{topic} 的真实转化案例'],
  knowledge: ['围绕 {topic} 做一期实用科普', '{topic} 的高频问题讲透'],
  environment_tour: ['带看 {topic} 相关空间与细节', '{topic} 场景展示视频'],
  promotion: ['用 {topic} 设计一条转化视频', '{topic} 限时活动脚本'],
  behind_scenes: ['{topic} 背后的真实日常', '围绕 {topic} 的幕后记录'],
  product_showcase: ['{topic} 产品卖点展示', '{topic} 商品亮点短视频'],
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export class RecommendationEngine {
  async generateRecommendations(
    context: AgentContext,
    topN = 5,
    feedbackInsight?: FeedbackInsight
  ): Promise<FinalRecommendation[]> {
    const candidates = this.generateCandidates(context);
    const scored = this.scoreCandidates(candidates, context, feedbackInsight);
    return scored.slice(0, topN).map((candidate, index) => this.convertToFinalRecommendation(candidate, context, index));
  }

  private generateCandidates(context: AgentContext): RecommendationCandidate[] {
    const industryProfile = matchIndustryProfile(context.userProfile.industry) || getDefaultIndustryProfile();
    const season = context.currentSituation.season;

    const trendingCandidates = context.currentSituation.trendingTopics.slice(0, 3).map((topic) => ({
      topic: topic.keyword,
      contentType: 'knowledge' as ContentType,
      score: 0,
      reasons: ['热点趋势上升 ' + topic.growthRate + '%'],
      metadata: { scoringDetails: [], estimatedEffort: { preparationTime: 0.5, shootingTime: 0.5, editingTime: 0.5 } },
    }));

    const seasonalCandidates = (industryProfile.seasonalTopics[season] || SEASONAL_TOPICS[season] || []).slice(0, 3).map((topic) => ({
      topic,
      contentType: 'knowledge' as ContentType,
      score: 0,
      reasons: ['当前季节适配：' + season],
      metadata: { scoringDetails: [], estimatedEffort: { preparationTime: 0.5, shootingTime: 0.5, editingTime: 0.3 } },
    }));

    const bestPracticeCandidates = industryProfile.bestPractices.map((practice) => ({
      topic: practice.topic,
      contentType: practice.type,
      score: 0,
      reasons: ['行业常见高表现内容：' + context.userProfile.industry],
      metadata: { scoringDetails: [], estimatedEffort: { preparationTime: 0.5, shootingTime: 0.7, editingTime: 0.5 } },
    }));

    return [...trendingCandidates, ...seasonalCandidates, ...bestPracticeCandidates];
  }

  private scoreCandidates(
    candidates: RecommendationCandidate[],
    context: AgentContext,
    feedbackInsight?: FeedbackInsight
  ): RecommendationCandidate[] {
    const industryProfile = matchIndustryProfile(context.userProfile.industry) || getDefaultIndustryProfile();
    const keywords = industryProfile.trendingKeywords.map((item) => item.toLowerCase());
    const seasonTopics = industryProfile.seasonalTopics[context.currentSituation.season] || SEASONAL_TOPICS[context.currentSituation.season] || [];

    return candidates.map((candidate) => {
      let score = 0.2;
      const details: string[] = ['基础分 +0.20'];
      const topicText = candidate.topic.toLowerCase();

      const industryRelevant = keywords.length === 0 || keywords.some((keyword) => topicText.includes(keyword) || keyword.includes(topicText));
      if (industryRelevant) {
        score += 0.45;
        details.push('行业相关 +0.45');
      }

      const trendingMatched = context.currentSituation.trendingTopics.some((topic) => candidate.topic.includes(topic.keyword));
      if (trendingMatched) {
        score += 0.15;
        details.push('热点匹配 +0.15');
      }

      const seasonalMatched = seasonTopics.some((topic) => candidate.topic.includes(topic));
      if (seasonalMatched) {
        score += 0.15;
        details.push('季节适配 +0.15');
      }

      const historicalScore = this.getHistoricalScore(candidate.contentType, context);
      score += historicalScore * 0.05;
      details.push('历史表现 +' + (historicalScore * 0.05).toFixed(2));

      if (feedbackInsight && feedbackInsight.totalFeedback > 0) {
        const adjusted = FeedbackEngine.adjustScore(score, candidate.contentType, candidate.topic, feedbackInsight);
        const delta = adjusted - score;
        score = adjusted;
        if (Math.abs(delta) > 0.01) {
          details.push('反馈学习 ' + (delta > 0 ? '+' : '') + delta.toFixed(2));
        }
      }

      const finalScore = clamp(score, 0, 1);
      return {
        ...candidate,
        score: finalScore,
        reasons: [...candidate.reasons, ...details.slice(0, 2)],
        metadata: {
          ...candidate.metadata,
          scoringDetails: details.map((detail) => ({ factor: detail, score: finalScore, weight: 1, explanation: detail })),
        },
      };
    }).sort((left, right) => right.score - left.score);
  }

  private getHistoricalScore(contentType: ContentType, context: AgentContext): number {
    const sameTypeHistory = context.contentHistory.recentContents.filter((item) => item.contentType === contentType);
    if (sameTypeHistory.length === 0) {
      return 0.5;
    }

    const avgInquiries = sameTypeHistory.reduce((sum, item) => sum + item.metrics.inquiries, 0) / sameTypeHistory.length;
    const benchmark = matchIndustryProfile(context.userProfile.industry)?.benchmark || INDUSTRY_BENCHMARKS[context.userProfile.industry] || { avgViews: 2000, avgInquiries: 8 };
    return clamp(avgInquiries / Math.max(benchmark.avgInquiries, 1), 0, 1);
  }

  private convertToFinalRecommendation(candidate: RecommendationCandidate, context: AgentContext, index: number): FinalRecommendation {
    const benchmark = matchIndustryProfile(context.userProfile.industry)?.benchmark || INDUSTRY_BENCHMARKS[context.userProfile.industry] || { avgViews: 2000, avgInquiries: 8 };
    const effort = candidate.metadata.estimatedEffort;
    const totalTime = effort.preparationTime + effort.shootingTime + effort.editingTime;
    const difficulty = totalTime <= 1 ? 'easy' : totalTime <= 2 ? 'medium' : 'hard';

    return {
      id: 'rec_' + Date.now() + '_' + index,
      topic: candidate.topic,
      contentType: candidate.contentType,
      title: this.generateTitle(candidate),
      reason: candidate.reasons.slice(0, 3).join(' | '),
      expectedOutcome: {
        views: Math.round(benchmark.avgViews * (0.8 + candidate.score * 0.4)),
        inquiries: Math.round(benchmark.avgInquiries * (0.5 + candidate.score * 0.5)),
        confidence: candidate.score,
      },
      difficulty,
      estimatedTime: Number(totalTime.toFixed(1)),
      confidence: candidate.score,
      needsConfirmation: candidate.score < 0.7,
    };
  }

  private generateTitle(candidate: RecommendationCandidate): string {
    const templates = TITLE_TEMPLATES[candidate.contentType] || TITLE_TEMPLATES.knowledge;
    return templates[0].replace('{topic}', candidate.topic);
  }
}
