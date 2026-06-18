import { describe, expect, it } from 'vitest';
import { FeedbackEngine, type FeedbackRecord } from '@/lib/feedbackEngine';

describe('FeedbackEngine', () => {
  it('returns sensible defaults when there is no feedback', () => {
    const insight = FeedbackEngine.analyzeFeedback([]);

    expect(insight.totalFeedback).toBe(0);
    expect(insight.overallSatisfaction).toBe(0.5);
    expect(insight.suggestions.length).toBeGreaterThan(0);
  });

  it('increases adjusted score for preferred content and topics', () => {
    const records: FeedbackRecord[] = [
      {
        id: '1',
        userId: 'u1',
        recommendationId: 'r1',
        topic: '补水护理',
        contentType: 'knowledge',
        feedback: 'good',
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        userId: 'u1',
        recommendationId: 'r2',
        topic: '补水护理',
        contentType: 'knowledge',
        feedback: 'good',
        createdAt: new Date().toISOString(),
      },
    ];

    const insight = FeedbackEngine.analyzeFeedback(records);
    const adjusted = FeedbackEngine.adjustScore(0.5, 'knowledge', '补水护理', insight);

    expect(insight.totalFeedback).toBe(2);
    expect(adjusted).toBeGreaterThan(0.5);
  });
});
