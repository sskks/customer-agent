/**
 * 店播AI Agent - 核心类型定义
 */

export type Industry = 'beauty' | 'restaurant' | 'fitness' | 'bar' | 'hotel' | 'education' | 'medical' | 'retail';

export type ContentType = 
  | 'customer_case'
  | 'knowledge'
  | 'environment_tour'
  | 'promotion'
  | 'behind_scenes'
  | 'product_showcase';

export interface UserProfile {
  userId: string;
  industry: Industry;
  businessName: string;
  location: string;
  services: Service[];
  targetCustomers: string;
  priceRange: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
}

export interface ContentRecord {
  id: string;
  userId: string;
  topic: string;
  contentType: ContentType;
  title: string;
  metrics: ContentMetrics;
  publishedAt?: Date;
}

export interface ContentMetrics {
  views: number;
  likes: number;
  comments: number;
  inquiries: number;
}

export interface BusinessMetrics {
  userId: string;
  totalContents: number;
  avgViewsPerContent: number;
  avgInquiriesPerContent: number;
  trend: 'up' | 'down' | 'stable';
  bestPerformingContent?: ContentRecord;
  byContentType: Record<ContentType, {
    count: number;
    avgInquiries: number;
  }>;
}

export interface UserPreferences {
  userId: string;
  preferredContentTypes: ContentType[];
  avoidedTopics: string[];
  maxDifficulty: 'easy' | 'medium' | 'hard';
}

export interface TrendingTopic {
  keyword: string;
  searchVolume: number;
  growthRate: number;
}

export interface AgentContext {
  userProfile: UserProfile;
  businessMetrics: BusinessMetrics;
  contentHistory: {
    totalPublished: number;
    recentContents: ContentRecord[];
  };
  preferences: UserPreferences;
  currentSituation: {
    season: 'spring' | 'summer' | 'autumn' | 'winter';
    trendingTopics: TrendingTopic[];
  };
}

export interface ScoringFactor {
  factor: string;
  score: number;
  weight: number;
  explanation: string;
}

export interface RecommendationCandidate {
  topic: string;
  contentType: ContentType;
  score: number;
  reasons: string[];
  metadata: {
    scoringDetails: ScoringFactor[];
    estimatedEffort: {
      preparationTime: number;
      shootingTime: number;
      editingTime: number;
    };
  };
}

export interface FinalRecommendation {
  id: string;
  topic: string;
  contentType: ContentType;
  title: string;
  reason: string;
  expectedOutcome: {
    views: number;
    inquiries: number;
    confidence: number;
  };
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: number;
  confidence: number;
  needsConfirmation: boolean;
}

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  customer_case: '顾客案例',
  knowledge: '知识科普',
  environment_tour: '店内环境',
  promotion: '促销活动',
  behind_scenes: '幕后花絮',
  product_showcase: '产品展示'
};

export const SEASONAL_TOPICS: Record<string, string[]> = {
  spring: ['祛痘', '美白', '春季护肤'],
  summer: ['补水', '防晒', '清凉护理'],
  autumn: ['抗衰', '保湿', '秋季养生'],
  winter: ['滋润', '暖身护理', '冬季保养']
};

export const INDUSTRY_BENCHMARKS: Record<Industry, {
  avgViews: number;
  avgInquiries: number;
}> = {
  beauty: { avgViews: 2000, avgInquiries: 8 },
  restaurant: { avgViews: 3000, avgInquiries: 12 },
  fitness: { avgViews: 2500, avgInquiries: 10 },
  bar: { avgViews: 3500, avgInquiries: 15 },
  hotel: { avgViews: 2800, avgInquiries: 11 },
  education: { avgViews: 2200, avgInquiries: 9 },
  medical: { avgViews: 1800, avgInquiries: 7 },
  retail: { avgViews: 2600, avgInquiries: 10 }
};
