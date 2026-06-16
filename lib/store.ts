/**
 * 店播AI Agent - 简易内存存储
 * 用于在无数据库环境下存储反馈和推荐历史
 * 后续接入 Supabase 后应迁移到数据库存储
 */

import { FeedbackRecord, MetricsRecord } from './feedbackEngine';
import { FinalRecommendation } from './types';

/** 用户反馈列表 */
const feedbackStore: FeedbackRecord[] = [];

/** 推荐历史 */
const recommendationHistory: Array<{
  id: string;
  userId: string;
  recommendation: FinalRecommendation;
  createdAt: Date;
}> = [];

/** 效果指标数据 */
const metricsStore: MetricsRecord[] = [];

// ---- 反馈操作 ----

export function addFeedback(record: FeedbackRecord): void {
  feedbackStore.push(record);
}

export function getFeedbackRecords(): FeedbackRecord[] {
  return [...feedbackStore];
}

export function getFeedbackForRecommendation(recId: string): FeedbackRecord | undefined {
  return feedbackStore.find(r => r.recommendationId === recId);
}

// ---- 推荐历史操作 ----

export function saveRecommendation(userId: string, rec: FinalRecommendation): void {
  recommendationHistory.push({
    id: `rh_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    userId,
    recommendation: rec,
    createdAt: new Date()
  });
}

export function getRecommendationHistory(userId: string) {
  return recommendationHistory.filter(r => r.userId === userId);
}

// ---- 效果指标操作 ----

export function addMetrics(record: MetricsRecord): void {
  metricsStore.push(record);
}

export function getMetricsRecords(): MetricsRecord[] {
  return [...metricsStore];
}
