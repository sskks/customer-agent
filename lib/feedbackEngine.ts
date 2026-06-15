/**
 * 反馈学习引擎
 * 根据用户的反馈数据，动态调整推荐评分权重
 * 核心思路：用户喜欢什么类型，就多推什么类型
 */

export interface FeedbackRecord {
  id: string;
  userId: string;
  recommendationId: string;
  topic: string;
  contentType: string;
  feedback: 'good' | 'neutral' | 'bad';
  actualMetrics?: {
    views: number;
    inquiries: number;
  };
  createdAt: string;
}

export interface FeedbackInsight {
  /** 每种内容类型的偏好权重（0-2，1为默认） */
  contentTypeWeights: Record<string, number>;
  /** 每种主题的偏好权重 */
  topicWeights: Record<string, number>;
  /** 用户总体满意度（0-1） */
  overallSatisfaction: number;
  /** 反馈总数 */
  totalFeedback: number;
  /** 推荐改进方向 */
  suggestions: string[];
}

/**
 * 分析反馈数据，生成学习洞察
 */
export class FeedbackEngine {
  /**
   * 从反馈记录中学习用户偏好
   */
  static analyzeFeedback(records: FeedbackRecord[]): FeedbackInsight {
    if (records.length === 0) {
      return {
        contentTypeWeights: {},
        topicWeights: {},
        overallSatisfaction: 0.5,
        totalFeedback: 0,
        suggestions: ['多收集反馈数据，推荐会越来越精准'],
      };
    }

    // 1. 计算内容类型权重
    const contentTypeWeights = this.calcContentTypeWeights(records);

    // 2. 计算主题权重
    const topicWeights = this.calcTopicWeights(records);

    // 3. 计算整体满意度
    const overallSatisfaction = this.calcOverallSatisfaction(records);

    // 4. 生成改进建议
    const suggestions = this.generateSuggestions(records, contentTypeWeights);

    return {
      contentTypeWeights,
      topicWeights,
      overallSatisfaction,
      totalFeedback: records.length,
      suggestions,
    };
  }

  /**
   * 根据反馈调整推荐评分
   * @param baseScore 基础评分（0-1）
   * @param contentType 内容类型
   * @param topic 主题
   * @param insight 反馈洞察
   * @returns 调整后的评分
   */
  static adjustScore(
    baseScore: number,
    contentType: string,
    topic: string,
    insight: FeedbackInsight
  ): number {
    // 内容类型权重调整（最高 +30%，最低 -30%）
    const typeWeight = insight.contentTypeWeights[contentType] ?? 1;
    const typeAdjust = (typeWeight - 1) * 0.3;

    // 主题权重调整（最高 +20%，最低 -20%）
    const topicWeight = insight.topicWeights[topic] ?? 1;
    const topicAdjust = (topicWeight - 1) * 0.2;

    // 应用调整，限制在 0-1 范围
    const adjusted = baseScore + typeAdjust + topicAdjust;
    return Math.max(0, Math.min(1, adjusted));
  }

  /**
   * 计算每种内容类型的偏好权重
   * good = 1.5 权重，neutral = 1.0，bad = 0.5
   */
  private static calcContentTypeWeights(records: FeedbackRecord[]): Record<string, number> {
    const stats: Record<string, { total: number; weightedSum: number }> = {};

    for (const rec of records) {
      const type = rec.contentType;
      if (!stats[type]) stats[type] = { total: 0, weightedSum: 0 };

      stats[type].total += 1;
      const weight = rec.feedback === 'good' ? 1.5 : rec.feedback === 'bad' ? 0.5 : 1.0;
      stats[type].weightedSum += weight;

      // 如果有实际效果数据，进一步调整
      if (rec.actualMetrics) {
        const { views, inquiries } = rec.actualMetrics;
        // 播放量 > 2000 或咨询 > 8 视为好内容
        if (views > 2000 || inquiries > 8) {
          stats[type].weightedSum += 0.3;
        }
      }
    }

    const result: Record<string, number> = {};
    for (const [type, { total, weightedSum }] of Object.entries(stats)) {
      result[type] = Math.max(0.3, Math.min(2.0, weightedSum / total));
    }

    return result;
  }

  /**
   * 计算主题级别的偏好权重
   */
  private static calcTopicWeights(records: FeedbackRecord[]): Record<string, number> {
    const stats: Record<string, { total: number; goodCount: number }> = {};

    for (const rec of records) {
      const topic = rec.topic;
      if (!stats[topic]) stats[topic] = { total: 0, goodCount: 0 };
      stats[topic].total += 1;
      if (rec.feedback === 'good') stats[topic].goodCount += 1;
    }

    const result: Record<string, number> = {};
    for (const [topic, { total, goodCount }] of Object.entries(stats)) {
      const goodRatio = goodCount / total;
      // good > 60% 加权，good < 20% 减权
      result[topic] = goodRatio > 0.6 ? 1.3 : goodRatio < 0.2 ? 0.7 : 1.0;
    }

    return result;
  }

  /**
   * 计算整体满意度
   */
  private static calcOverallSatisfaction(records: FeedbackRecord[]): number {
    let score = 0;
    for (const rec of records) {
      score += rec.feedback === 'good' ? 1 : rec.feedback === 'neutral' ? 0.5 : 0;
    }
    return score / records.length;
  }

  /**
   * 根据反馈数据生成改进建议
   */
  private static generateSuggestions(
    records: FeedbackRecord[],
    contentTypeWeights: Record<string, number>
  ): string[] {
    const suggestions: string[] = [];

    // 找出表现最好的类型
    const entries = Object.entries(contentTypeWeights);
    if (entries.length > 0) {
      const best = entries.reduce((a, b) => (a[1] > b[1] ? a : b));
      const worst = entries.reduce((a, b) => (a[1] < b[1] ? a : b));

      if (best[1] > 1.3) {
        const typeLabels: Record<string, string> = {
          customer_case: '顾客案例',
          knowledge: '知识科普',
          environment_tour: '店内环境',
          promotion: '促销活动',
          behind_scenes: '幕后花絮',
          product_showcase: '产品展示',
        };
        suggestions.push(`你偏好的「${typeLabels[best[0]] || best[0]}」类内容效果最好，会优先推荐`);
      }

      if (worst[1] < 0.7) {
        suggestions.push(`减少了效果不佳的内容类型的推荐比例`);
      }
    }

    // 根据满意度给建议
    const satisfaction = this.calcOverallSatisfaction(records);
    if (satisfaction > 0.7) {
      suggestions.push('推荐精准度较高，继续保持！');
    } else if (satisfaction < 0.4 && records.length >= 5) {
      suggestions.push('推荐可能需要调整方向，建议多给反馈帮助优化');
    }

    if (records.length < 5) {
      suggestions.push('反馈数据较少，多点击反馈让推荐更精准');
    }

    return suggestions;
  }
}
