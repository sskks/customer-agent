/**
 * 店播AI Agent - 脚本生成服务
 * 使用通义千问 API 生成短视频拍摄脚本
 */

import { ContentType, Industry } from './types';

// LLM 配置
const QWEN_API_KEY = process.env.QWEN_API_KEY || '';
const QWEN_MODEL = 'qwen-plus'; // 使用 qwen-plus，平衡质量和成本

/* ─── 话题分类检测 ─────────────────────── */

const TOPIC_CATEGORIES: Record<string, string[]> = {
  '美妆护肤': ['补水', '防晒', '美白', '护肤', '面膜', '精华', '祛痘', '毛孔', '化妆', '美甲', '睫毛', '抗衰', '敏感肌', '美容', '皮肤', '粉底', '头皮护理', '肩颈'],
  '美食健康': ['美食', '火锅', '奶茶', '烧烤', '咖啡', '甜点', '餐厅', '外卖', '做饭', '减脂餐', '冰饮', '探店', '蛋糕', '小吃', '早餐'],
  '运动健身': ['健身', '瑜伽', '跑步', '减肥', '增肌', '拉伸', '私教', '体脂', '游泳', '拳击', '普拉提', '马甲线'],
  '穿搭时尚': ['穿搭', '衣服', '搭配', '小个子', '显瘦', '时尚', '包包', '鞋子', '裙子', '风格'],
  '科技数码': ['手机', '电脑', '游戏', 'AI', '数码', '编程', '英雄联盟', 'LOL', '王者荣耀', '电竞', '显卡', '键盘'],
  '生活方式': ['装修', '家居', '旅行', '露营', '养花', '宠物', '摄影', '手工', '收纳'],
  '教育学习': ['英语', '考研', '考公', '读书', '学习', '课程', '考试', '留学'],
};

/** 检测话题属于哪个行业分类 */
function detectTopicCategory(topic: string): string {
  const t = topic.toLowerCase();
  for (const [category, keywords] of Object.entries(TOPIC_CATEGORIES)) {
    if (keywords.some(kw => t.includes(kw))) return category;
  }
  return '综合';
}

/** 用户行业对应的分类关键词 */
const INDUSTRY_CATEGORIES: Record<string, string[]> = {
  beauty: ['美妆护肤'],
  restaurant: ['美食健康'],
  fitness: ['运动健身'],
};

/** 检测话题是否与用户行业匹配 */
function isTopicMatchIndustry(topic: string, industry: Industry): boolean {
  const topicCat = detectTopicCategory(topic);
  const industryCats = INDUSTRY_CATEGORIES[industry] || [];
  return industryCats.includes(topicCat);
}

/** 话题分类对应的创作风格指导 */
const TOPIC_STYLE_GUIDELINES: Record<string, string> = {
  '美妆护肤': '语气温和专业，突出美丽和自信，适合女性受众',
  '美食健康': '语气热情活泼，突出美食诱惑和味觉体验，适合年轻人群',
  '运动健身': '语气激励鼓舞，突出健康和改变，适合追求进步的人群',
  '穿搭时尚': '语气时尚前卫，突出个性和品味，适合关注潮流的人群',
  '科技数码': '语气客观理性，突出技术参数和真实体验，适合数码爱好者',
  '生活方式': '语气轻松自然，突出生活品质和仪式感，适合追求美好生活的群体',
  '教育学习': '语气严谨但不枯燥，突出实用方法和效果，适合自我提升人群',
  '综合': '语气自然亲切，内容实用接地气，适合大众受众',
};

// 脚本生成请求接口
export interface ScriptGenerationRequest {
  topic: string;
  contentType: ContentType;
  industry: Industry;
  businessName: string;
  services?: Array<{ name: string; description: string; price: number }>;
  targetCustomers?: string;
}

// 生成的脚本接口
export interface GeneratedScript {
  title: string;
  hookLine: string;           // 开头钩子（前3秒）
  mainContent: string;        // 主体内容
  callToAction: string;       // 行动号召
  duration: number;           // 预计时长（秒）
  sceneBreakdown: Scene[];    // 分镜脚本
  shootingTips: string[];     // 拍摄建议
}

export interface Scene {
  sceneNumber: number;
  duration: number;           // 场景时长（秒）
  visual: string;             // 画面描述
  audio: string;              // 台词/配音
  notes?: string;             // 备注（道具、角度等）
}

/**
 * 生成短视频脚本
 */
export async function generateScript(
  request: ScriptGenerationRequest
): Promise<GeneratedScript> {
  console.log('[ScriptGenerator] 开始生成脚本...', request);

  // 构建 Prompt
  const prompt = buildPrompt(request);

  // 调用 LLM API（传入 topic 用于无 Key 时的 mock）
  const response = await callQwenAPI(prompt, request.topic);

  // 解析响应
  const script = parseResponse(response);

  console.log('[ScriptGenerator] 脚本生成完成');
  return script;
}

/**
 * 构建 Prompt
 */
function buildPrompt(request: ScriptGenerationRequest): string {
  const { topic, contentType, industry, businessName, services, targetCustomers } = request;

  // 检测话题分类，判断是否与用户行业匹配
  const topicCategory = detectTopicCategory(topic);
  const topicMatchesIndustry = isTopicMatchIndustry(topic, industry);

  // 如果话题与用户行业匹配，用行业指导；否则用话题分类指导
  let styleGuideline: string;
  let contextInstruction: string;

  if (topicMatchesIndustry) {
    // 话题在用户行业范围内，使用通用行业指导
    styleGuideline = `语气自然专业，突出${industry}行业的特色和优势，适合目标客户群体`;
    contextInstruction = `请基于"${businessName}"（${industry}行业）的视角来创作内容。`;
  } else {
    // 话题超出用户行业范围 → 使用话题本身的分类风格
    styleGuideline = TOPIC_STYLE_GUIDELINES[topicCategory] || TOPIC_STYLE_GUIDELINES['综合'];
    contextInstruction = `这个话题属于"${topicCategory}"领域，请根据话题本身的特点来创作内容，不要强行关联到${industry}行业。内容应该自然、真实，围绕"${topic}"本身展开。`;
  }

  // 内容类型特定的结构指导
  const contentStructure: Record<ContentType, string> = {
    customer_case: '案例展示型：问题 → 解决方案 → 效果对比 → 客户反馈',
    knowledge: '知识科普型：痛点引入 → 专业讲解 → 实用建议 → 总结',
    environment_tour: '环境展示型：开场吸引 → 空间介绍 → 细节展示 → 邀请体验',
    promotion: '促销转化型：优惠信息 → 价值塑造 → 限时紧迫感 → 行动号召',
    behind_scenes: '幕后故事型：日常场景 → 工作细节 → 用心之处 → 情感共鸣',
    product_showcase: '产品展示型：产品亮相 → 核心卖点 → 使用演示 → 购买引导'
  };

  return `你是一位专业的短视频脚本策划师，擅长为本地商家创作高转化的抖音/小红书视频脚本。

## 任务要求
请为以下商家创作一个完整的短视频拍摄脚本：

**商家信息：**
- 店铺名称：${businessName}
- 行业类型：${industry}
- 目标客户：${targetCustomers || '一般消费者'}
- 服务项目：${services?.map(s => `${s.name}（${s.description}，${s.price}元）`).join('、') || '未提供'}

**视频主题：** ${topic}
**话题分类：** ${topicCategory}
**内容类型：** ${contentType}（${contentStructure[contentType]}）

## 创作指导

${contextInstruction}

1. **语气风格**：${styleGuideline}
2. **视频时长**：控制在 30-60 秒
3. **开头钩子**：前3秒必须抓住注意力（提问/反差/悬念/数据）
4. **主体内容**：简洁有力，每句话都有价值
5. **行动号召**：明确的下一步指引（评论/私信/到店）

## 输出格式

请严格按照以下 JSON 格式返回（不要包含其他文字）：

{
  "title": "视频标题（20字以内，吸引人）",
  "hookLine": "开头钩子台词（前3秒，一句话抓住注意力）",
  "mainContent": "主体内容台词（完整口播文案，150-250字）",
  "callToAction": "行动号召台词（最后5秒，引导互动）",
  "duration": 45,
  "sceneBreakdown": [
    {
      "sceneNumber": 1,
      "duration": 3,
      "visual": "画面描述（包括镜头、场景、人物动作）",
      "audio": "对应的台词或音效",
      "notes": "拍摄备注（可选）"
    }
  ],
  "shootingTips": [
    "拍摄建议1",
    "拍摄建议2",
    "拍摄建议3"
  ]
}

## 注意事项
- 台词要口语化，避免书面语
- 画面描述要具体，让拍摄者知道怎么拍
- 分镜数量建议 3-5 个场景
- 确保整体逻辑流畅，从吸引到转化一气呵成
- 内容必须围绕"${topic}"展开，不要偏离主题

现在请开始创作：`;
}

/**
 * 调用通义千问 API
 */
async function callQwenAPI(prompt: string, topic?: string): Promise<string> {
  if (!QWEN_API_KEY) {
    console.warn('[ScriptGenerator] 未配置 API Key，使用模拟数据');
    return getMockResponse(topic);
  }

  try {
    // 使用 fetch 调用阿里云 DashScope API
    const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${QWEN_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: QWEN_MODEL,
        input: {
          messages: [
            {
              role: 'system',
              content: '你是一位专业的短视频脚本策划师，擅长创作高转化的短视频内容。'
            },
            {
              role: 'user',
              content: prompt
            }
          ]
        },
        parameters: {
          result_format: 'message',
          temperature: 0.8,
          top_p: 0.9,
          max_tokens: 2000
        }
      })
    });

    if (!response.ok) {
      throw new Error(`API 请求失败: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.output.choices[0].message.content;

    return content;
  } catch (error) {
    console.error('[ScriptGenerator] API 调用失败:', error);
    // 降级到模拟数据
    return getMockResponse(topic);
  }
}

/**
 * 解析 LLM 响应
 */
function parseResponse(response: string): GeneratedScript {
  try {
    // 尝试提取 JSON（可能包含在 markdown 代码块中）
    let jsonStr = response.trim();
    
    // 如果包含在 ```json ... ``` 中，提取出来
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    } else {
      // 尝试直接查找 JSON 对象
      const objMatch = response.match(/\{[\s\S]*\}/);
      if (objMatch) {
        jsonStr = objMatch[0];
      }
    }

    const parsed = JSON.parse(jsonStr);
    
    return {
      title: parsed.title || '精彩视频',
      hookLine: parsed.hookLine || '你知道吗？',
      mainContent: parsed.mainContent || '这是一个很棒的内容',
      callToAction: parsed.callToAction || '快来联系我们吧！',
      duration: parsed.duration || 45,
      sceneBreakdown: parsed.sceneBreakdown || [],
      shootingTips: parsed.shootingTips || []
    };
  } catch (error) {
    console.error('[ScriptGenerator] 解析响应失败:', error);
    // 返回默认脚本
    return getDefaultScript();
  }
}

/**
 * 根据话题动态生成模拟脚本（无 API Key 时使用）
 */
function getMockResponse(topic?: string): string {
  const category = topic ? detectTopicCategory(topic) : '综合';
  const kw = topic || '今日热点';

  const mockScripts: Record<string, () => object> = {
    '美妆护肤': () => ({
      title: `${kw}秘籍大公开`,
      hookLine: '你是不是也一直在为这个问题困扰？',
      mainContent: `说到${kw}，很多人都在踩坑。第一，方法不对，再贵也白费。第二，每个人的情况不同，不能盲目跟风。第三，坚持才是关键，三天打鱼两天晒网肯定不行。今天给大家分享的这几个技巧，都是我从业多年总结出来的实战经验，简单好上手，效果看得见。`,
      callToAction: `评论区留言"${kw}"，送你专属方案！`,
      duration: 45,
      sceneBreakdown: [
        { sceneNumber: 1, duration: 3, visual: '近景：面对镜头，手持产品', audio: '你是不是也一直在为这个问题困扰？', notes: '表情夸张，引起共鸣' },
        { sceneNumber: 2, duration: 15, visual: '中景：讲解画面，背景整洁', audio: `说到${kw}，很多人都在踩坑...`, notes: '手势自然，语速适中' },
        { sceneNumber: 3, duration: 15, visual: '特写：展示细节', audio: '今天给大家分享的这几个技巧...', notes: '光线充足，突出质感' },
        { sceneNumber: 4, duration: 12, visual: '近景：微笑面对镜头', audio: `评论区留言"${kw}"，送你专属方案！`, notes: '笑容亲切，引导互动' },
      ],
      shootingTips: ['使用环形补光灯', '背景保持整洁', '语速控制在每分钟220字', '准备道具增加视觉丰富度'],
    }),
    '科技数码': () => ({
      title: `${kw}深度测评`,
      hookLine: `关于${kw}，这些真相你可能还不知道`,
      mainContent: `最近${kw}真的很火，但到底值不值得入手？我花了两周时间深度体验，今天给大家一个真实的反馈。先说优点，体验确实不错，有几个细节让我很惊喜。再说不足，有些方面确实还有提升空间。最后给不同需求的朋友一些建议，帮你少花冤枉钱。`,
      callToAction: '你们对什么感兴趣？评论区告诉我，下期安排！',
      duration: 50,
      sceneBreakdown: [
        { sceneNumber: 1, duration: 3, visual: '桌面摆放产品，俯拍', audio: `关于${kw}，这些真相你可能还不知道`, notes: '产品摆放整齐，光线好' },
        { sceneNumber: 2, duration: 20, visual: '使用中画面，多角度切换', audio: `最近${kw}真的很火...`, notes: '展示实际操作过程' },
        { sceneNumber: 3, duration: 15, visual: '对比画面或数据展示', audio: '先说优点...再说不足...', notes: '用字幕辅助说明' },
        { sceneNumber: 4, duration: 12, visual: '面对镜头总结', audio: '你们对什么感兴趣？评论区告诉我！', notes: '语气自然，像和朋友聊天' },
      ],
      shootingTips: ['产品展示用俯拍角度', '操作过程多角度拍摄', '关键数据用字幕标注', '保持自然口语化表达'],
    }),
    '美食健康': () => ({
      title: `这家${kw}绝了`,
      hookLine: `为了这个${kw}，我愿意排队两小时！`,
      mainContent: `今天来打卡一家超火的${kw}，先说环境，氛围感拉满。重点说味道，第一口就知道是用心在做的，食材新鲜，调味恰到好处。分量也很实在，性价比没得说。如果你也是${kw}爱好者，这家真的不能错过。`,
      callToAction: `你们最想吃什么${kw}？评论区告诉我，我去帮你们试！`,
      duration: 40,
      sceneBreakdown: [
        { sceneNumber: 1, duration: 3, visual: '食物特写，热气腾腾', audio: `为了这个${kw}，我愿意排队两小时！`, notes: '拍出食物的色泽和热气' },
        { sceneNumber: 2, duration: 12, visual: '店内环境，氛围镜头', audio: '先说环境，氛围感拉满', notes: '暖色调，突出氛围' },
        { sceneNumber: 3, duration: 15, visual: '品尝过程，表情反应', audio: `重点说味道，第一口就知道...`, notes: '表情要真实自然' },
        { sceneNumber: 4, duration: 10, visual: '面对镜头总结', audio: `你们最想吃什么？评论区告诉我！`, notes: '引导互动' },
      ],
      shootingTips: ['食物拍摄用45度角', '环境用暖色调灯光', '品尝时表情要真实', '可以拍一些制作过程'],
    }),
    '运动健身': () => ({
      title: `${kw}一个月变化记录`,
      hookLine: `坚持${kw}一个月，身体发生了什么变化？`,
      mainContent: `很多人问我${kw}到底有没有用，今天用一个月的真实记录告诉你答案。第一周最难熬，差点放弃。第二周开始适应，体能明显提升。第三周看到变化，朋友都说状态不一样了。第四周已经完全习惯，不做反而不舒服。总结一下，最重要的是开始和坚持，方法反而没那么重要。`,
      callToAction: `你在做${kw}吗？评论区打卡，我们一起坚持！`,
      duration: 45,
      sceneBreakdown: [
        { sceneNumber: 1, duration: 3, visual: '运动前状态，面对镜头', audio: `坚持${kw}一个月，身体发生了什么变化？`, notes: '精神饱满，引起好奇' },
        { sceneNumber: 2, duration: 20, visual: '运动过程混剪，多角度', audio: '第一周最难熬...第二周开始适应...', notes: '配动感音乐，节奏感强' },
        { sceneNumber: 3, duration: 12, visual: '对比画面或数据展示', audio: '第三周看到变化...第四周...', notes: '用字幕标注时间线' },
        { sceneNumber: 4, duration: 10, visual: '面对镜头总结', audio: '评论区打卡，一起坚持！', notes: '充满能量感' },
      ],
      shootingTips: ['运动过程多角度拍摄', '配动感背景音乐', '用字幕标注时间节点', '展示汗水和努力增加真实感'],
    }),
  };

  // 通用模板
  const genericMock = {
    title: `${kw}新手必看`,
    hookLine: `关于${kw}，这些技巧99%的人都不知道！`,
    mainContent: `今天来聊聊${kw}，很多人对这个话题有误解或者不了解。其实掌握了正确的方法，${kw}没有想象中那么难。第一个要点是打好基础，不要急于求成。第二个要点是找到适合自己的节奏，每个人的情况不同。第三个要点是持续积累，量变引起质变。希望今天的分享对你有帮助。`,
    callToAction: `你对${kw}有什么想了解的吗？评论区留言，下期为你解答！`,
    duration: 45,
    sceneBreakdown: [
      { sceneNumber: 1, duration: 3, visual: '面对镜头开场', audio: `关于${kw}，这些技巧99%的人都不知道！`, notes: '表情自信，引起好奇' },
      { sceneNumber: 2, duration: 20, visual: '讲解画面，配合图示', audio: `今天来聊聊${kw}...`, notes: '可以准备辅助图表' },
      { sceneNumber: 3, duration: 12, visual: '重点总结', audio: '第一个要点...第二个...第三个...', notes: '用字幕标注要点' },
      { sceneNumber: 4, duration: 10, visual: '面对镜头收尾', audio: `评论区留言，下期为你解答！`, notes: '语气诚恳' },
    ],
    shootingTips: ['保持光线充足', '声音清晰', '背景简洁', '可以准备辅助图表'],
  };

  const mockFn = mockScripts[category];
  const mock = mockFn ? mockFn() : genericMock;

  return JSON.stringify(mock);
}

/**
 * 默认脚本（解析失败时的兜底）
 */
function getDefaultScript(): GeneratedScript {
  return {
    title: '精彩内容分享',
    hookLine: '今天给大家分享一个超实用的技巧！',
    mainContent: '在我们的日常工作中，经常会遇到各种各样的问题。其实只要掌握了正确的方法，很多事情都能迎刃而解。今天就来聊聊这个话题，从入门到进阶，一步步带你了解其中的门道。首先要明确核心要点，其次要注意细节，最后就是多练习多总结。希望今天的分享对你有所帮助。',
    callToAction: '欢迎评论区留言交流，我们一起进步！',
    duration: 40,
    sceneBreakdown: [
      {
        sceneNumber: 1,
        duration: 5,
        visual: '开场：主播面对镜头打招呼',
        audio: '今天给大家分享一个超实用的技巧！',
        notes: '保持微笑，眼神直视镜头'
      },
      {
        sceneNumber: 2,
        duration: 25,
        visual: '主讲：配合手势或道具讲解',
        audio: '从入门到进阶，一步步带你了解...',
        notes: '可以配合手势或道具'
      },
      {
        sceneNumber: 3,
        duration: 10,
        visual: '结尾：引导互动',
        audio: '欢迎评论区留言交流，我们一起进步！',
        notes: '语气诚恳'
      }
    ],
    shootingTips: [
      '保持光线充足，避免逆光拍摄',
      '声音清晰，可以使用领夹麦克风',
      '背景简洁，突出主体'
    ]
  };
}
