/**
 * 店播AI Agent - 脚本生成服务
 * 调用通义千问 API 为推荐选题生成完整的短视频拍摄脚本
 */

import { FinalRecommendation, ContentType, Industry } from './types';

interface ScriptSection {
  title: string;
  content: string;
}

export interface GeneratedScript {
  title: string;
  hook: string;
  sections: ScriptSection[];
  cta: string;
  hashtags: string[];
  tips: string[];
}

export class ScriptGenerator {
  private apiKey: string | undefined;
  private baseUrl = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';

  constructor() {
    this.apiKey = process.env.QWEN_API_KEY;
  }

  /**
   * 为推荐选题生成拍摄脚本
   */
  async generate(
    recommendation: FinalRecommendation,
    industry: Industry,
    businessName: string
  ): Promise<GeneratedScript> {
    if (!this.apiKey) {
      console.log('[ScriptGenerator] 未配置 API Key，使用模拟脚本');
      return this.generateMockScript(recommendation, businessName);
    }

    try {
      const prompt = this.buildPrompt(recommendation, industry, businessName);
      const response = await this.callQwenAPI(prompt);
      return response;
    } catch (error) {
      console.error('[ScriptGenerator] API 调用失败，回退到模拟脚本:', error);
      return this.generateMockScript(recommendation, businessName);
    }
  }

  /**
   * 构建提示词
   */
  private buildPrompt(
    rec: FinalRecommendation,
    industry: Industry,
    businessName: string
  ): string {
    const industryLabels: Record<Industry, string> = {
      beauty: '美容/美甲店',
      restaurant: '餐饮/奶茶店',
      fitness: '健身/瑜伽馆'
    };

    const contentTypeGuidelines: Record<ContentType, string> = {
      customer_case: '以真实顾客故事为主线，展示前后对比效果，注意保护顾客隐私',
      knowledge: '以专业知识为核心，用通俗易懂的语言讲解，建立专业权威形象',
      environment_tour: '以店内环境为切入点，展示店面特色和氛围',
      promotion: '突出优惠力度和限时性，制造紧迫感',
      behind_scenes: '展示团队日常和工作流程，拉近与观众的距离',
      product_showcase: '详细展示产品特色和功效，配合使用演示'
    };

    return `你是一个专业的短视频脚本撰写专家。请为以下本地商家生成一个短视频拍摄脚本。

商家信息：
- 店名：${businessName}
- 行业：${industryLabels[industry]}
- 推荐选题：${rec.topic}
- 推荐标题：${rec.title}
- 内容类型：${rec.contentType}
- 预期时长：${rec.estimatedTime}小时

内容类型指导：${contentTypeGuidelines[rec.contentType]}

请生成一个完整的短视频脚本，包含以下部分，用JSON格式返回：
{
  "title": "视频标题（吸引眼球）",
  "hook": "开场3秒的钩子文案（必须吸引观众继续看）",
  "sections": [
    {"title": "段落标题", "content": "口播文案内容 + 镜头指示"}
  ],
  "cta": "结尾引导语（引导点赞关注或到店）",
  "hashtags": ["#标签1", "#标签2", "#标签3"],
  "tips": ["拍摄技巧提示1", "拍摄技巧提示2"]
}

要求：
1. 口播文案要口语化、自然、有感染力
2. 每个section控制在15秒左右
3. 总时长控制在45-90秒
4. 开头3秒一定要有强钩子
5. 适当加入互动引导（评论、点赞）
6. 只返回JSON，不要添加其他文字`;
  }

  /**
   * 调用通义千问 API
   */
  private async callQwenAPI(prompt: string): Promise<GeneratedScript> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: 'qwen-plus',
        messages: [
          { role: 'system', content: '你是一个专业的短视频脚本撰写专家，擅长为本地商家创作吸引眼球的短视频内容。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error(`API 请求失败: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('API 返回内容为空');
    }

    // 解析 JSON（处理可能的 markdown 代码块包裹）
    let jsonStr = content;
    const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim();
    }

    return JSON.parse(jsonStr) as GeneratedScript;
  }

  /**
   * 模拟脚本（无 API Key 时使用）
   */
  private generateMockScript(
    rec: FinalRecommendation,
    businessName: string
  ): GeneratedScript {
    return {
      title: `【${businessName}】${rec.title}`,
      hook: `你知道吗？90%的人都不知道${rec.topic}的正确方法！`,
      sections: [
        {
          title: '痛点引入',
          content: `【镜头：近景，面对镜头说话】\n很多顾客跟我说，之前做${rec.topic}总是踩坑，效果不理想...`
        },
        {
          title: '专业解答',
          content: `【镜头：中景，展示操作过程】\n其实在我们${businessName}，${rec.topic}有一套专业流程。首先...然后...最后...`
        },
        {
          title: '效果展示',
          content: `【镜头：前后对比画面】\n你看，做完${rec.topic}之后效果是不是很明显？这就是专业的力量。`
        }
      ],
      cta: `想要体验专业的${rec.topic}吗？评论区扣1，或者直接到店咨询！记得点赞关注，每天分享变美小知识~`,
      hashtags: [`#${rec.topic}`, `#${businessName}`, '#本地生活', '#变美日记', '#专业护理'],
      tips: [
        '拍摄时注意光线充足，正面光最佳',
        '口播时语速适中，不要太快',
        '前后对比镜头保持角度一致',
        '适当加入手势增加表现力'
      ]
    };
  }
}
