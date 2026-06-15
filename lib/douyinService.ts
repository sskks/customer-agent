/**
 * 店播AI Agent - 抖音热搜数据服务
 *
 * 数据源优先级：
 * 1. xxapi.cn 抖音热搜 API（需注册获取 API Key）
 * 2. 内置模拟数据（开发/演示用，已做多样化处理）
 */

/* ─── 类型定义 ─────────────────────────── */

export interface HotTopic {
  rank: number;
  keyword: string;
  heatValue: number;
  category: string;
  videoCount?: number;
}

export interface DouyinVideo {
  id: string;
  title: string;
  author: string;
  playCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  duration: number;
  createTime: string;
}

export interface SearchResult {
  keyword: string;
  topics: HotTopic[];
  videos: DouyinVideo[];
  totalResults: number;
}

/* ─── 行业分类映射（用于关键词归类）─────────── */

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  '美妆护肤': ['补水', '防晒', '美白', '护肤', '面膜', '精华', '祛痘', '毛孔', '化妆', '美甲', '睫毛', '抗衰', '敏感肌', '美容', '皮肤', '粉底'],
  '美食健康': ['美食', '火锅', '奶茶', '烧烤', '咖啡', '甜点', '餐厅', '外卖', '做饭', '减脂餐', '冰饮', '探店', '蛋糕', '小吃', '早餐'],
  '运动健身': ['健身', '瑜伽', '跑步', '减肥', '增肌', '拉伸', '私教', '体脂', '游泳', '拳击', '普拉提', '马甲线'],
  '穿搭时尚': ['穿搭', '衣服', '搭配', '小个子', '显瘦', '时尚', '包包', '鞋子', '裙子', '风格'],
  '生活方式': ['装修', '家居', '旅行', '露营', '养花', '宠物', '摄影', '手工', '收纳', '咖啡'],
  '科技数码': ['手机', '电脑', '游戏', 'AI', '数码', '编程', '英雄联盟', 'LOL', '王者荣耀', '电竞', '显卡', '键盘'],
  '教育学习': ['英语', '考研', '考公', '读书', '学习', '课程', '考试', '留学'],
  '情感心理': ['恋爱', '婚姻', '心理', '情绪', '社交', '职场', '面试'],
};

function guessCategory(keyword: string): string {
  const kw = keyword.toLowerCase();
  for (const [category, words] of Object.entries(CATEGORY_KEYWORDS)) {
    if (words.some(w => kw.includes(w))) return category;
  }
  return '综合';
}

/* ─── 模拟热搜数据 ─────────────────────────── */

const MOCK_HOT_TOPICS: HotTopic[] = [
  { rank: 1,  keyword: '夏季补水护肤',   heatValue: 9825430,  category: '美妆护肤', videoCount: 128400 },
  { rank: 2,  keyword: '防晒的正确方法',   heatValue: 8732150,  category: '美妆护肤', videoCount: 95600 },
  { rank: 3,  keyword: '小个子穿搭',       heatValue: 7654320,  category: '穿搭时尚', videoCount: 203100 },
  { rank: 4,  keyword: '减脂餐食谱',       heatValue: 7123890,  category: '美食健康', videoCount: 156700 },
  { rank: 5,  keyword: '居家健身动作',     heatValue: 6891230,  category: '运动健身', videoCount: 89300 },
  { rank: 6,  keyword: '敏感肌修复',       heatValue: 6543210,  category: '美妆护肤', videoCount: 72100 },
  { rank: 7,  keyword: '奶茶店新品',       heatValue: 6234560,  category: '美食健康', videoCount: 45600 },
  { rank: 8,  keyword: '美甲款式推荐',     heatValue: 5987650,  category: '美妆护肤', videoCount: 167800 },
  { rank: 9,  keyword: '瑜伽入门教程',     heatValue: 5654320,  category: '运动健身', videoCount: 63200 },
  { rank: 10, keyword: '网红餐厅打卡',     heatValue: 5432100,  category: '美食健康', videoCount: 234500 },
  { rank: 11, keyword: '毛孔收缩方法',     heatValue: 5123450,  category: '美妆护肤', videoCount: 54300 },
  { rank: 12, keyword: '咖啡店装修',       heatValue: 4876540,  category: '生活方式', videoCount: 38900 },
  { rank: 13, keyword: '增肌饮食计划',     heatValue: 4654320,  category: '运动健身', videoCount: 41200 },
  { rank: 14, keyword: '头皮护理',         heatValue: 4432100,  category: '美妆护肤', videoCount: 29800 },
  { rank: 15, keyword: '私教课体验',       heatValue: 4210980,  category: '运动健身', videoCount: 21500 },
  { rank: 16, keyword: '火锅探店',         heatValue: 3987650,  category: '美食健康', videoCount: 312000 },
  { rank: 17, keyword: '抗衰护理',         heatValue: 3876540,  category: '美妆护肤', videoCount: 47600 },
  { rank: 18, keyword: '露营装备推荐',     heatValue: 3654320,  category: '生活方式', videoCount: 67800 },
  { rank: 19, keyword: '肩颈按摩',         heatValue: 3432100,  category: '美妆护肤', videoCount: 35400 },
  { rank: 20, keyword: '夏日冰饮',         heatValue: 3210980,  category: '美食健康', videoCount: 89700 },
];

/* ─── 服务类 ───────────────────────────── */

export class DouyinService {
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.DOUYIN_HOT_API_KEY;
  }

  async getHotTopics(keyword?: string): Promise<HotTopic[]> {
    if (this.apiKey) {
      try {
        return await this.fetchFromXxApi(keyword);
      } catch (err) {
        console.error('[DouyinService] xxapi 调用失败，回退到模拟数据:', err);
      }
    }
    return this.getMockTopics(keyword);
  }

  async searchVideos(keyword: string, count = 8): Promise<DouyinVideo[]> {
    return this.generateMockVideos(keyword, count);
  }

  async search(keyword: string): Promise<SearchResult> {
    const [topics, videos] = await Promise.all([
      this.getHotTopics(keyword),
      this.searchVideos(keyword),
    ]);
    return { keyword, topics, videos, totalResults: topics.length + videos.length };
  }

  /* ── xxapi.cn 真实接口 ─────────────────── */

  private async fetchFromXxApi(keyword?: string): Promise<HotTopic[]> {
    const res = await fetch('https://v2.xxapi.cn/api/douyinhot', {
      headers: { 'X-API-Key': this.apiKey! },
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error(`xxapi 请求失败: ${res.status}`);

    const json = await res.json();
    if (json.code !== 200 && json.code !== 0) {
      throw new Error(`xxapi 返回错误: ${json.msg || json.code}`);
    }

    let topics: HotTopic[] = (json.data || []).map((item: any, i: number) => ({
      rank: item.position || i + 1,
      keyword: item.word || '',
      heatValue: Number(item.hot_value) || 0,
      category: item.label || guessCategory(item.word || ''),
      videoCount: Number(item.video_count) || undefined,
    }));

    if (keyword) {
      const kw = keyword.toLowerCase();
      topics = topics.filter(
        (t) => t.keyword.toLowerCase().includes(kw) || t.category.toLowerCase().includes(kw)
      );
    }
    return topics;
  }

  /* ── 模拟数据 ──────────────────────────── */

  private getMockTopics(keyword?: string): HotTopic[] {
    let list = [...MOCK_HOT_TOPICS];
    if (keyword) {
      const kw = keyword.toLowerCase();
      list = list.filter(
        (t) => t.keyword.toLowerCase().includes(kw) || t.category.toLowerCase().includes(kw)
      );
    }
    list.forEach((t) => {
      t.heatValue = Math.round(t.heatValue * (0.95 + Math.random() * 0.1));
    });
    return list;
  }

  /**
   * 根据关键词智能生成模拟视频数据
   * 标题和作者根据关键词语义动态生成，不再套固定模板
   */
  private generateMockVideos(keyword: string, count: number): DouyinVideo[] {
    const category = guessCategory(keyword);

    // 根据分类选择不同的作者池
    const authorPools: Record<string, string[]> = {
      '美妆护肤': ['护肤师小雨', '化妆师CC', '成分党小周', '皮肤管理师Linda', '美妆博主阿梨'],
      '美食健康': ['吃货小分队', '厨房老王', '美食探店Jessica', '营养师小陈', '烘焙师阿梦'],
      '运动健身': ['健身教练大伟', '瑜伽老师小美', '跑步达人阿杰', 'CrossFit教练Kris', '体态管理师Lily'],
      '穿搭时尚': ['穿搭师小七', '时尚博主Mia', '衣橱整理师Coco', '日系穿搭Yuki', '极简风搭配师'],
      '生活方式': ['生活家小苏', '家居达人Lily', '旅行vlog阿亮', '手作工坊小陈', '露营爱好者老张'],
      '科技数码': ['数码测评阿杰', '游戏主播小鱼', '科技UP主Max', '程序员老李', '硬件发烧友小韩'],
      '教育学习': ['英语老师Annie', '考研学长小赵', '读书博主阿文', '留学顾问Sarah', '知识分享官小北'],
      '情感心理': ['心理咨询师小林', '职场导师Amy', '情感博主小柒', '社交达人老周'],
      '综合': ['生活记录者', '日常分享家', '内容创作者小陈', '视频博主阿明', '知识分享者'],
    };

    const authors = authorPools[category] || authorPools['综合'];

    // 根据关键词类型生成不同风格的标题
    const titleTemplates = this.getTitleTemplates(keyword, category);

    return Array.from({ length: count }, (_, i) => {
      const views = Math.floor(300000 + Math.random() * 3000000);
      return {
        id: `mock_${Date.now()}_${i}`,
        title: titleTemplates[i % titleTemplates.length],
        author: authors[i % authors.length],
        playCount: views,
        likeCount: Math.floor(views * (0.04 + Math.random() * 0.08)),
        commentCount: Math.floor(views * (0.002 + Math.random() * 0.006)),
        shareCount: Math.floor(views * (0.003 + Math.random() * 0.01)),
        duration: 25 + Math.floor(Math.random() * 70),
        createTime: new Date(Date.now() - Math.random() * 14 * 86400000)
          .toISOString()
          .split('T')[0],
      };
    });
  }

  /**
   * 根据关键词和分类生成多样化的标题
   */
  private getTitleTemplates(keyword: string, category: string): string[] {
    const kw = keyword;

    // 根据分类返回不同风格的标题
    const templatesByCategory: Record<string, ((kw: string) => string)[]> = {
      '美妆护肤': [
        (kw) => `${kw}踩坑实录！花了3000块总结出来的`,
        (kw) => `做了10年美容，关于${kw}我只说真话`,
        (kw) => `${kw}翻车了？其实是你的方法不对`,
        (kw) => `顾客问我${kw}到底有没有用，我这样回答`,
        (kw) => `${kw}前 vs 后，同事以为我换了头`,
        (kw) => `别再这样${kw}了！皮肤科医生都急了`,
        (kw) => `${kw}的正确步骤，90%的人第一步就错了`,
        (kw) => `我的店里做${kw}为什么回头率这么高`,
      ],
      '美食健康': [
        (kw) => `这家${kw}排队2小时值不值？实拍告诉你`,
        (kw) => `${kw}测评！吃了30家选出最好吃的`,
        (kw) => `在家做${kw}，成本只要外面的1/3`,
        (kw) => `${kw}的神仙吃法，看完口水流了一地`,
        (kw) => `老板说这道${kw}是他爷爷传下来的配方`,
        (kw) => `${kw}到底怎么做才好吃？老师傅手把手教`,
        (kw) => `挑战用最少的钱吃到最好的${kw}`,
        (kw) => `全网都在找的${kw}，我终于找到了`,
      ],
      '运动健身': [
        (kw) => `${kw}一个月，体脂从28%降到22%`,
        (kw) => `新手${kw}最容易犯的5个错误`,
        (kw) => `私教不会告诉你的${kw}秘诀`,
        (kw) => `每天15分钟${kw}，一个月看到变化`,
        (kw) => `${kw}到底该不该请私教？算笔账给你看`,
        (kw) => `从120斤到98斤，我的${kw}全记录`,
        (kw) => `${kw}的正确姿势，做错等于白练`,
        (kw) => `为什么你的${kw}没有效果？问题出在这里`,
      ],
      '科技数码': [
        (kw) => `${kw}深度评测：用了两周的真实感受`,
        (kw) => `${kw}到底值不值得买？看完再决定`,
        (kw) => `${kw}隐藏功能大揭秘，你可能一个都没用过`,
        (kw) => `花了一周时间帮你测了${kw}，结果意外`,
        (kw) => `${kw}入门指南，小白看这一篇就够了`,
        (kw) => `老玩家聊聊${kw}，这些坑我替你踩过了`,
        (kw) => `${kw}最强攻略，没有之一`,
        (kw) => `为什么${kw}突然火了？来聊聊背后的逻辑`,
      ],
      '穿搭时尚': [
        (kw) => `${kw}合集！这一套回头率200%`,
        (kw) => `155小个子的${kw}秘诀，显高10cm`,
        (kw) => `${kw}怎么搭都不对？可能是颜色没选对`,
        (kw) => `换季${kw}灵感，这8套直接抄`,
        (kw) => `月薪3000也能穿出高级感的${kw}`,
        (kw) => `${kw}红黑榜！这几件千万别买`,
        (kw) => `从路人到博主，我的${kw}进化史`,
        (kw) => `${kw}一衣多穿，一件单品5种搭配`,
      ],
    };

    // 通用标题模板
    const genericTemplates: ((kw: string) => string)[] = [
      (kw) => `${kw}新手入门，看这一条就够了`,
      (kw) => `做了3年${kw}的人告诉你这些真相`,
      (kw) => `${kw}避坑指南，花了2万块总结的`,
      (kw) => `${kw}最全攻略，建议收藏`,
      (kw) => `关于${kw}，这是我见过最靠谱的回答`,
      (kw) => `为什么越来越多人开始关注${kw}？`,
      (kw) => `${kw}前 vs ${kw}后，变化太大了`,
      (kw) => `手把手教你${kw}，零基础也能学会`,
    ];

    const categoryTemplates = templatesByCategory[category];
    if (categoryTemplates) {
      // 混合分类模板和通用模板
      return [...categoryTemplates.map(fn => fn(kw)), ...genericTemplates.slice(0, 3).map(fn => fn(kw))];
    }
    return genericTemplates.map(fn => fn(kw));
  }
}
