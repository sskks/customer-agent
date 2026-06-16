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

/**
 * 行业内容档案：为不同行业定制热搜关键词、季节性话题和最佳实践
 * 通过关键词匹配来识别用户输入的行业
 */
export interface IndustryProfile {
  matchKeywords: string[];
  trendingKeywords: string[];
  seasonalTopics: Record<string, string[]>;
  bestPractices: { topic: string; type: ContentType }[];
  benchmark: { avgViews: number; avgInquiries: number };
}

export const INDUSTRY_PROFILES: IndustryProfile[] = [
  {
    matchKeywords: ['美容', '护肤', '美甲', '美睫', '皮肤管理', 'spa', 'beauty', '美发', '造型', '化妆'],
    trendingKeywords: ['护肤', '补水', '防晒', '美白', '面膜', '祛痘', '抗衰', '美甲', '化妆', '毛孔', '头皮', '肩颈'],
    seasonalTopics: {
      spring: ['春季焕肤', '换季敏感修复', '春日美甲趋势', '春季补水攻略'],
      summer: ['夏日防晒指南', '清爽控油护肤', '夏季美甲款式', '晒后修复'],
      autumn: ['秋季保湿秘诀', '换季护肤', '秋冬美甲配色', '敏感肌修复'],
      winter: ['冬季深层保湿', '年终变美计划', '冬日抗衰', '新年焕肤'],
    },
    bestPractices: [
      { topic: '顾客变美案例', type: 'customer_case' },
      { topic: '护肤误区科普', type: 'knowledge' },
      { topic: '店内环境展示', type: 'environment_tour' },
      { topic: '限时护肤套餐', type: 'promotion' },
      { topic: '美容师日常', type: 'behind_scenes' },
      { topic: '明星产品推荐', type: 'product_showcase' },
    ],
    benchmark: { avgViews: 2000, avgInquiries: 8 },
  },
  {
    matchKeywords: ['酒吧', '清吧', '酒馆', '夜店', 'club', 'bar', '鸡尾酒', '调酒', 'livehouse'],
    trendingKeywords: ['酒吧', '鸡尾酒', '调酒', '微醺', '夜生活', '酒馆', '清吧', '驻唱', '氛围感', '特调'],
    seasonalTopics: {
      spring: ['春日微醺指南', '户外酒吧推荐', '春天适合喝什么酒', '露台酒吧'],
      summer: ['夏日冰饮特调', '露天酒吧攻略', '夏夜微醺', '冰镇鸡尾酒'],
      autumn: ['秋日威士忌推荐', '万圣节派对', '暖身热饮', '秋季新品酒单'],
      winter: ['圣诞跨年派对', '冬日热红酒', '年终聚会好去处', '暖心特调'],
    },
    bestPractices: [
      { topic: '调酒师炫技时刻', type: 'customer_case' },
      { topic: '鸡尾酒知识科普', type: 'knowledge' },
      { topic: '酒吧氛围实拍', type: 'environment_tour' },
      { topic: '限时活动预告', type: 'promotion' },
      { topic: '酒吧幕后故事', type: 'behind_scenes' },
      { topic: '招牌特调推荐', type: 'product_showcase' },
    ],
    benchmark: { avgViews: 3500, avgInquiries: 15 },
  },
  {
    matchKeywords: ['餐饮', '餐厅', '饭店', '美食', '火锅', '烧烤', '日料', '西餐', '中餐', '小吃', 'restaurant', '快餐', '面馆', '奶茶'],
    trendingKeywords: ['美食', '火锅', '烧烤', '奶茶', '探店', '美食打卡', '甜品', '小吃', '咖啡', '冰饮'],
    seasonalTopics: {
      spring: ['春日轻食', '踏青野餐美食', '春季新品菜单', '樱花限定'],
      summer: ['夏日冰饮', '夜宵烧烤季', '清凉甜品', '小龙虾季'],
      autumn: ['贴秋膘美食', '秋季暖胃', '大闸蟹季', '秋日热饮'],
      winter: ['火锅季来了', '冬日暖食', '年夜饭预订', '圣诞美食'],
    },
    bestPractices: [
      { topic: '食客好评合集', type: 'customer_case' },
      { topic: '食材挑选秘籍', type: 'knowledge' },
      { topic: '餐厅环境实拍', type: 'environment_tour' },
      { topic: '限时优惠套餐', type: 'promotion' },
      { topic: '后厨揭秘', type: 'behind_scenes' },
      { topic: '招牌菜推荐', type: 'product_showcase' },
    ],
    benchmark: { avgViews: 3000, avgInquiries: 12 },
  },
  {
    matchKeywords: ['健身', '瑜伽', '运动', '普拉提', '拳击', 'fitness', '私教', '游泳', '跑步'],
    trendingKeywords: ['健身', '瑜伽', '减肥', '减脂', '增肌', '私教', '体脂', '跑步', '普拉提', '马甲线'],
    seasonalTopics: {
      spring: ['春季运动计划', '户外跑步指南', '春日瑜伽', '踏青徒步'],
      summer: ['夏日燃脂攻略', '游泳健身', '暑期塑形', '户外运动'],
      autumn: ['秋季运动恢复', '马拉松备战', '秋冬室内健身', '秋季增肌'],
      winter: ['冬季健身指南', '新年健身计划', '室内运动推荐', '冬季保暖运动'],
    },
    bestPractices: [
      { topic: '会员蜕变故事', type: 'customer_case' },
      { topic: '健身动作教学', type: 'knowledge' },
      { topic: '场馆环境展示', type: 'environment_tour' },
      { topic: '限时体验课', type: 'promotion' },
      { topic: '教练日常训练', type: 'behind_scenes' },
      { topic: '精品课程推荐', type: 'product_showcase' },
    ],
    benchmark: { avgViews: 2500, avgInquiries: 10 },
  },
  {
    matchKeywords: ['咖啡', '咖啡厅', 'cafe', '咖啡馆', '烘焙', '甜品'],
    trendingKeywords: ['咖啡', '拿铁', '手冲', '咖啡厅', '探店', '烘焙', '甜品', '下午茶'],
    seasonalTopics: {
      spring: ['春日限定饮品', '户外咖啡时光', '樱花拿铁', '春游下午茶'],
      summer: ['冰咖啡合集', '夏日冷萃', '露天咖啡座', '冰饮推荐'],
      autumn: ['秋日暖饮', '南瓜拿铁', '落叶咖啡角', '秋季甜品'],
      winter: ['冬日热可可', '圣诞限定', '暖手咖啡', '年终下午茶'],
    },
    bestPractices: [
      { topic: '顾客打卡分享', type: 'customer_case' },
      { topic: '咖啡豆知识科普', type: 'knowledge' },
      { topic: '咖啡店氛围展示', type: 'environment_tour' },
      { topic: '新品限时尝鲜', type: 'promotion' },
      { topic: '咖啡师日常', type: 'behind_scenes' },
      { topic: '招牌饮品推荐', type: 'product_showcase' },
    ],
    benchmark: { avgViews: 2800, avgInquiries: 10 },
  },
  {
    matchKeywords: ['教育', '培训', '学校', '机构', '课程', '辅导', '留学', '考研', '考公', '英语'],
    trendingKeywords: ['英语', '考研', '考公', '学习', '课程', '考试', '留学', '面试', '职场'],
    seasonalTopics: {
      spring: ['开学季规划', '春季课程推荐', '考试冲刺', '新学期目标'],
      summer: ['暑期集训', '夏令营', '暑期充电', '留学准备'],
      autumn: ['秋季课程', '考研备战', '开学季', '职场提升'],
      winter: ['年终总结', '寒假班', '新年学习计划', '考前冲刺'],
    },
    bestPractices: [
      { topic: '学员进步案例', type: 'customer_case' },
      { topic: '学习方法分享', type: 'knowledge' },
      { topic: '教学环境展示', type: 'environment_tour' },
      { topic: '限时优惠课程', type: 'promotion' },
      { topic: '老师备课日常', type: 'behind_scenes' },
      { topic: '精品课程推荐', type: 'product_showcase' },
    ],
    benchmark: { avgViews: 2000, avgInquiries: 9 },
  },
  {
    matchKeywords: ['宠物', '猫', '狗', 'pet', '宠物店', '宠物医院', '萌宠'],
    trendingKeywords: ['宠物', '猫咪', '狗狗', '萌宠', '宠物护理', '铲屎官', '宠物医院', '宠物美容'],
    seasonalTopics: {
      spring: ['春季驱虫', '带宠物踏青', '换毛季护理', '春日遛狗'],
      summer: ['宠物防暑', '夏日洗澡', '宠物游泳', '驱虫防护'],
      autumn: ['秋季增肥', '宠物体检', '换季护理', '秋日遛狗'],
      winter: ['宠物保暖', '冬日护理', '新年宠物照', '年终体检'],
    },
    bestPractices: [
      { topic: '萌宠变美前后', type: 'customer_case' },
      { topic: '养宠知识科普', type: 'knowledge' },
      { topic: '宠物店环境', type: 'environment_tour' },
      { topic: '限时洗护套餐', type: 'promotion' },
      { topic: '宠物美容师日常', type: 'behind_scenes' },
      { topic: '热门品种推荐', type: 'product_showcase' },
    ],
    benchmark: { avgViews: 4000, avgInquiries: 12 },
  },
  {
    matchKeywords: ['酒店', '民宿', '住宿', '旅馆', 'hotel', '客栈', '度假'],
    trendingKeywords: ['酒店', '民宿', '旅行', '度假', '住宿推荐', '探店', '打卡'],
    seasonalTopics: {
      spring: ['春游住宿推荐', '踏青民宿', '周末短途游', '赏花住宿'],
      summer: ['暑期度假', '海边酒店', '避暑民宿', '亲子旅行'],
      autumn: ['国庆住宿攻略', '秋日度假', '红叶民宿', '黄金周出行'],
      winter: ['跨年住宿', '温泉酒店', '冬日度假', '圣诞元旦'],
    },
    bestPractices: [
      { topic: '住客好评分享', type: 'customer_case' },
      { topic: '周边游玩攻略', type: 'knowledge' },
      { topic: '房间环境实拍', type: 'environment_tour' },
      { topic: '限时特价房', type: 'promotion' },
      { topic: '民宿主人日常', type: 'behind_scenes' },
      { topic: '特色房型推荐', type: 'product_showcase' },
    ],
    benchmark: { avgViews: 3500, avgInquiries: 14 },
  },
];

/** 根据用户输入的行业关键词，匹配最佳行业档案 */
export function matchIndustryProfile(industry: string): IndustryProfile | null {
  const input = industry.toLowerCase();
  for (const profile of INDUSTRY_PROFILES) {
    if (profile.matchKeywords.some(kw => input === kw.toLowerCase())) return profile;
  }
  for (const profile of INDUSTRY_PROFILES) {
    if (profile.matchKeywords.some(kw => input.includes(kw.toLowerCase()) || kw.toLowerCase().includes(input))) return profile;
  }
  return null;
}

/** 通用行业默认档案 */
export function getDefaultIndustryProfile(): IndustryProfile {
  return {
    matchKeywords: [],
    trendingKeywords: [],
    seasonalTopics: SEASONAL_TOPICS,
    bestPractices: [
      { topic: '顾客案例分享', type: 'customer_case' },
      { topic: '专业知识科普', type: 'knowledge' },
      { topic: '店内环境展示', type: 'environment_tour' },
      { topic: '限时优惠活动', type: 'promotion' },
      { topic: '团队幕后日常', type: 'behind_scenes' },
      { topic: '明星产品推荐', type: 'product_showcase' },
    ],
    benchmark: { avgViews: 2000, avgInquiries: 8 },
  };
}
