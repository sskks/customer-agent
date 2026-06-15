/**
 * 店播AI Agent - 核心类型定义
 */

export type Industry = string; // 支持用户自定义输入，不再限制固定选项

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
  spring: ['春季焕新', '换季护肤', '春游穿搭', '春季养生', '开学季', '踏青攻略'],
  summer: ['夏日防晒', '清凉穿搭', '冰饮推荐', '暑期健身', '露营攻略', '夏日美食'],
  autumn: ['秋季保湿', '换季穿搭', '贴秋膘美食', '秋季运动', '国庆出行', '丰收季节'],
  winter: ['冬季保暖', '年终盘点', '火锅季', '冬季进补', '新年计划', '温暖好物'],
};

export const INDUSTRY_BENCHMARKS: Record<Industry, {
  avgViews: number;
  avgInquiries: number;
}> = {
  beauty: { avgViews: 2000, avgInquiries: 8 },
  restaurant: { avgViews: 3000, avgInquiries: 12 },
  fitness: { avgViews: 2500, avgInquiries: 10 }
};
