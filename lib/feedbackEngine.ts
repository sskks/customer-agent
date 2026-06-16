/**
 * 店播AI Agent - 反馈学习引擎
 * 根据用户的反馈数据（点赞/踩/效果数据）动态调整推荐评分
 */

import { ContentType } from './types';

/** 单条反馈记录 */
export interface FeedbackRecord {
  id: string;
  recommendationId: string;
  contentType: ContentType;
  topic: string;
  feedback: 'good' | 'neutral' | 'bad';
  createdAt: Date;
}

/** 效果数据记录 */
export interface MetricsRecord {
  id: string;
  recommendationId: string;
  contentType: ContentType;
  topic: string;
  views: number;
  inquiries: number;
  recordedAt: Date;
}

/** 反馈分析洞察 */
export interface FeedbackInsight {
  totalFeedback: number;
  contentTypeWeights: Record<string, number>;
  topicWeights: Record<string, number>;
  satisfaction: number;
  suggestions: string[];
}

export class FeedbackEngine {

  /**
   * 分析反馈记录，生成内容类型和话题的权重洞察
   */
  static analyzeFeedback(records: FeedbackRecord[]): FeedbackInsight {
    if (records.length === 0) {
      return {
        totalFeedback: 0,
        contentTypeWeights: {},
        topicWeights: {},
        satisfaction: 0.5,
        suggestions: ['还没有反馈数据，开始使用推荐并给出反馈吧']
      };
    }

    const contentTypeWeights = this.calcContentTypeWeights(records);
    const topicWeights = this.calcTopicWeights(records);
    const satisfaction = this.calcOverallSatisfaction(records);
    const suggestions = this.generateSuggestions(records, contentTypeWeights);

    return {
      totalFeedback: records.length,
      contentTypeWeights,
      topicWeights,
      satisfaction,
      suggestions
    };
  }

  /**
   * 用反馈洞察调整推荐基础分数
   * @param baseScore   原始评分（0~1）
   * @param contentType 内容类型
   * @param topic       话题
   * @param insight     反馈洞察
   */
  static adjustScore(
    baseScore: number,
    contentType: string,
    topic: string,
    insight: FeedbackInsight
  ): number {
    // 内容类型权重调整（影响幅度 ±30%）
    const typeWeight = insight.contentTypeWeights[contentType] ?? 1;
    const typeAdjust = (typeWeight - 1) * 0.3;

    // 话题权重调整（影响幅度 ±20%）
    const topicWeight = insight.topicWeights[topic] ?? 1;
    const topicAdjust = (topicWeight - 1) * 0.2;

    const adjusted = baseScore + typeAdjust + topicAdjust;
    return Math.max(0, Math.min(1, adjusted));
  }

  /**
   * 计算内容类型权重
   * good → 1.5x, neutral → 1.0x, bad → 0.5x
   */
  private static calcContentTypeWeights(records: FeedbackRecord[]): Record<string, number> {
    const typeMap: Record<string, { good: number; neutral: number; bad: number; total: number }> = {};

    for (const r of records) {
      if (!typeMap[r.contentType]) {
        typeMap[r.contentType] = { good: 0, neutral: 0, bad: 0, total: 0 };
      }
      typeMap[r.contentType][r.feedback]++;
      typeMap[r.contentType].total++;
    }

    const weights: Record<string, number> = {};
    for (const [type, counts] of Object.entries(typeMap)) {
      // 加权平均：(good*1.5 + neutral*1.0 + bad*0.5) / total
      const weighted = (counts.good * 1.5 + counts.neutral * 1.0 + counts.bad * 0.5) / counts.total;
      weights[type] = weighted;
    }

    return weights;
  }

  /**
   * 计算话题偏好权重
   */
  private static calcTopicWeights(records: FeedbackRecord[]): Record<string, number> {
    const topicMap: Record<string, { good: number; neutral: number; bad: number; total: number }> = {};

    for (const r of records) {
      if (!topicMap[r.topic]) {
        topicMap[r.topic] = { good: 0, neutral: 0, bad: 0, total: 0 };
      }
      topicMap[r.topic][r.feedback]++;
      topicMap[r.topic].total++;
    }

    const weights: Record<string, number> = {};
    for (const [topic, counts] of Object.entries(topicMap)) {
      const weighted = (counts.good * 1.5 + counts.neutral * 1.0 + counts.bad * 0.5) / counts.total;
      weights[topic] = weighted;
    }

    return weights;
  }

  /**
   * 计算整体满意度
   * good=1, neutral=0.5, bad=0
   */
  private static calcOverallSatisfaction(records: FeedbackRecord[]): number {
    const scoreMap = { good: 1, neutral: 0.5, bad: 0 };
    const total = records.reduce((sum, r) => sum + scoreMap[r.feedback], 0);
    return total / records.length;
  }

  /**
   * 基于反馈生成改进建议
   */
  private static generateSuggestions(
    records: FeedbackRecord[],
    typeWeights: Record<string, number>
  ): string[] {
    const suggestions: string[] = [];

    // 找出表现最好的内容类型
    const sorted = Object.entries(typeWeights).sort((a, b) => b[1] - a[1]);
    if (sorted.length > 0) {
      const typeLabels: Record<string, string> = {
        customer_case: '顾客案例',
        knowledge: '知识科普',
        environment_tour: '店内环境',
        promotion: '促销活动',
        behind_scenes: '幕后花絮',
        product_showcase: '产品展示'
      };
      const best = sorted[0];
      suggestions.push(`你最常点赞的是「${typeLabels[best[0]] ?? best[0]}」类内容，已为你优先推荐`);

      if (sorted.length > 1) {
        const worst = sorted[sorted.length - 1];
        if (worst[1] < 0.8) {
          suggestions.push(`「${typeLabels[worst[0]] ?? worst[0]}」类内容你反馈较少，已降低推荐权重`);
        }
      }
    }

    // 满意度分析
    const satisfaction = this.calcOverallSatisfaction(records);
    if (satisfaction >= 0.8) {
      suggestions.push('推荐质量很好，继续保持当前方向');
    } else if (satisfaction < 0.4) {
      suggestions.push('推荐还不够精准，建议多给出反馈帮助改进');
    }

    return suggestions;
  }
}
