import type { ContentType, Industry } from './types';

export interface ScriptGenerationRequest {
  topic: string;
  contentType: ContentType;
  industry: Industry;
  businessName: string;
  services?: Array<{ name: string; description: string; price: number }>;
  targetCustomers?: string;
}

export interface GeneratedScript {
  title: string;
  hookLine: string;
  mainContent: string;
  callToAction: string;
  duration: number;
  sceneBreakdown: Scene[];
  shootingTips: string[];
}

export interface Scene {
  sceneNumber: number;
  duration: number;
  visual: string;
  audio: string;
  notes?: string;
}

const CONTENT_LABELS: Record<ContentType, string> = {
  customer_case: '客户案例',
  knowledge: '知识科普',
  environment_tour: '环境展示',
  promotion: '促销活动',
  behind_scenes: '幕后日常',
  product_showcase: '产品展示',
};

const INDUSTRY_GUIDES: Record<string, string> = {
  beauty: '围绕护肤效果、专业建议和门店服务体验展开。',
  restaurant: '围绕味觉体验、招牌特色和到店氛围展开。',
  fitness: '围绕训练效果、执行方法和陪伴感展开。',
};

function getIndustryGuide(industry: Industry): string {
  return INDUSTRY_GUIDES[industry] || '围绕用户痛点、解决方案和实际收益展开。';
}

function buildScenes(topic: string, businessName: string, contentType: ContentType): Scene[] {
  return [
    {
      sceneNumber: 1,
      duration: 4,
      visual: `主持人正面出镜，快速抛出与“${topic}”相关的常见误区。`,
      audio: `很多人做${topic}时，一开始就把重点搞错了。`,
      notes: '开场语速稍快，先抓住注意力。',
    },
    {
      sceneNumber: 2,
      duration: 12,
      visual: `切到${businessName}的服务或场景细节，展示真实操作画面。`,
      audio: `在${businessName}，我们通常会先判断顾客当前状态，再决定最适合的做法。`,
      notes: '画面尽量贴近真实服务过程。',
    },
    {
      sceneNumber: 3,
      duration: 15,
      visual: `用手势或道具拆解 2 到 3 个关键动作，突出${CONTENT_LABELS[contentType]}重点。`,
      audio: `真正有效的关键有三步：先判断、再调整、最后持续复盘，不要盲目跟风。`,
      notes: '这一段建议配字幕和步骤卡片。',
    },
    {
      sceneNumber: 4,
      duration: 9,
      visual: '镜头回到主持人，给出行动建议并邀请互动。',
      audio: `如果你也想把${topic}做对，评论区留言“${topic}”，我把更具体的建议发给你。`,
      notes: '结尾保持亲和力，给出清晰互动动作。',
    },
  ];
}

export async function generateScript(request: ScriptGenerationRequest): Promise<GeneratedScript> {
  const { topic, contentType, industry, businessName, targetCustomers } = request;
  const audience = targetCustomers || '正在寻找更合适方案的本地用户';
  const industryGuide = getIndustryGuide(industry);
  const sceneBreakdown = buildScenes(topic, businessName, contentType);

  return {
    title: `${topic}怎么做更有效？${businessName}实战拆解`,
    hookLine: `别再凭感觉做${topic}了，很多人第一步就走偏了。`,
    mainContent: `今天用一条视频讲清楚${topic}到底该怎么做。${industryGuide}我们在${businessName}接待${audience}时，最常见的问题不是不努力，而是方法不对、节奏不对、判断也不够准确。先看清自己的真实情况，再选择合适步骤，效果通常会稳定很多。尤其是新手，不要急着一步做到位，先把基础动作做对，再逐步加强，反而更容易看到变化。`,
    callToAction: `如果你也在关注${topic}，评论区留言“${topic}”，我把适合你的执行建议整理给你。`,
    duration: sceneBreakdown.reduce((total, scene) => total + scene.duration, 0),
    sceneBreakdown,
    shootingTips: [
      '尽量使用门店真实场景，增强可信度。',
      '每个关键步骤都配字幕，方便用户快速抓重点。',
      '口播控制在自然语速，避免堆太多专业术语。',
      '结尾明确引导评论或私信，方便承接线索。',
    ],
  };
}
