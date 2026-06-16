/**
 * 店播AI Agent - 抖音热点数据服务
 * 支持抖音开放平台 API（需 access_token）和模拟数据回退
 *
 * 官方 API 文档：
 * - 视频搜索: GET https://open.douyin.com/dy_open_api/v2/search/video/
 * - 热点词: https://developer.open-douyin.com 能力中心 → 查询热点视频
 */

/* ============================================================
 *  类型定义
 * ============================================================ */

/** 热搜话题 */
export interface HotTopic {
  rank: number;
  keyword: string;
  heatValue: number;        // 热度值
  category: string;         // 分类标签
  coverUrl?: string;        // 封面图
  videoCount?: number;      // 相关视频数
}

/** 搜索结果视频 */
export interface DouyinVideo {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  playCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  duration: number;         // 秒
  createTime: string;
}

/** 搜索结果 */
export interface SearchResult {
  keyword: string;
  topics: HotTopic[];       // 匹配的热搜话题
  videos: DouyinVideo[];    // 相关热门视频
  totalResults: number;
}

/* ============================================================
 *  模拟数据（无 API Token 时使用）
 * ============================================================ */

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

const MOCK_VIDEOS: DouyinVideo[] = [
  {
    id: 'v_001', title: '夏天这样补水，皮肤嫩到掐出水！', author: '护肤师小雅',
    coverUrl: '', playCount: 2350000, likeCount: 186000, commentCount: 8900,
    shareCount: 12300, duration: 45, createTime: '2026-06-10'
  },
  {
    id: 'v_002', title: '3个防晒误区，99%的人都踩了', author: '皮肤科李医生',
    coverUrl: '', playCount: 1890000, likeCount: 145000, commentCount: 12300,
    shareCount: 23400, duration: 60, createTime: '2026-06-09'
  },
  {
    id: 'v_003', title: '美容院都在用的补水手法，在家也能做', author: '美丽日记',
    coverUrl: '', playCount: 1560000, likeCount: 98000, commentCount: 5600,
    shareCount: 8700, duration: 38, createTime: '2026-06-11'
  },
  {
    id: 'v_004', title: '这个夏天，我终于学会了正确护肤', author: '素人变美记',
    coverUrl: '', playCount: 980000, likeCount: 76000, commentCount: 4200,
    shareCount: 5100, duration: 52, createTime: '2026-06-12'
  },
  {
    id: 'v_005', title: '敏感肌姐妹看过来！修复屏障的正确方法', author: '成分党小周',
    coverUrl: '', playCount: 1230000, likeCount: 112000, commentCount: 7800,
    shareCount: 15600, duration: 48, createTime: '2026-06-08'
  }
];

/* ============================================================
 *  抖音服务类
 * ============================================================ */

export class DouyinService {
  private accessToken: string | undefined;
  private baseUrl = 'https://open.douyin.com/dy_open_api/v2';

  constructor() {
    this.accessToken = process.env.DOUYIN_ACCESS_TOKEN;
  }

  /**
   * 获取热搜榜话题列表
   */
  async getHotTopics(keyword?: string): Promise<HotTopic[]> {
    if (this.accessToken) {
      try {
        return await this.fetchHotTopicsFromAPI(keyword);
      } catch (error) {
        console.error('[DouyinService] 热搜 API 调用失败，回退到模拟数据:', error);
      }
    }

    // 回退：模拟数据
    let topics = [...MOCK_HOT_TOPICS];
    if (keyword) {
      const kw = keyword.toLowerCase();
      topics = topics.filter(t =>
        t.keyword.toLowerCase().includes(kw) ||
        t.category.toLowerCase().includes(kw)
      );
    }
    // 加一点随机波动让每次结果不同
    topics.forEach(t => {
      t.heatValue = Math.round(t.heatValue * (0.95 + Math.random() * 0.1));
    });
    return topics;
  }

  /**
   * 搜索关键词相关的热门视频
   */
  async searchVideos(keyword: string, count: number = 10): Promise<DouyinVideo[]> {
    if (this.accessToken) {
      try {
        return await this.fetchVideosFromAPI(keyword, count);
      } catch (error) {
        console.error('[DouyinService] 视频搜索 API 调用失败，回退到模拟数据:', error);
      }
    }

    // 回退：模拟数据（根据关键词过滤和生成）
    return this.generateMockVideos(keyword, count);
  }

  /**
   * 综合搜索：返回匹配的热搜话题 + 相关视频
   */
  async search(keyword: string): Promise<SearchResult> {
    const [topics, videos] = await Promise.all([
      this.getHotTopics(keyword),
      this.searchVideos(keyword)
    ]);

    return {
      keyword,
      topics,
      videos,
      totalResults: topics.length + videos.length
    };
  }

  /* ============================================================
   *  官方 API 调用
   * ============================================================ */

  /**
   * 调用抖音开放平台获取热搜话题
   * 能力：查询热点视频 → 获取热点词及热度值
   */
  private async fetchHotTopicsFromAPI(keyword?: string): Promise<HotTopic[]> {
    const response = await fetch(`${this.baseUrl}/hot/topic/list/`, {
      method: 'GET',
      headers: {
        'access-token': this.accessToken!,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`抖音 API 请求失败: ${response.status}`);
    }

    const data = await response.json();

    if (data.error_code !== 0) {
      throw new Error(`抖音 API 错误: ${data.description || data.error_code}`);
    }

    let topics: HotTopic[] = (data.data?.topic_list || []).map((item: any, index: number) => ({
      rank: index + 1,
      keyword: item.word || item.topic_name,
      heatValue: item.hot_value || item.heat_value || 0,
      category: item.category || item.label || '综合',
      coverUrl: item.cover_url || item.word_cover || '',
      videoCount: item.video_count || 0
    }));

    if (keyword) {
      const kw = keyword.toLowerCase();
      topics = topics.filter(t =>
        t.keyword.toLowerCase().includes(kw) ||
        t.category.toLowerCase().includes(kw)
      );
    }

    return topics;
  }

  /**
   * 调用抖音开放平台视频搜索 API
   * GET https://open.douyin.com/dy_open_api/v2/search/video/
   */
  private async fetchVideosFromAPI(keyword: string, count: number): Promise<DouyinVideo[]> {
    const params = new URLSearchParams({
      keyword,
      count: String(count),
      cursor: '0',
      sort_type: '1'  // 按热度排序
    });

    const response = await fetch(`${this.baseUrl}/search/video/?${params}`, {
      method: 'GET',
      headers: {
        'access-token': this.accessToken!,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`抖音视频搜索 API 请求失败: ${response.status}`);
    }

    const data = await response.json();

    if (data.error_code !== 0) {
      throw new Error(`抖音 API 错误: ${data.description || data.error_code}`);
    }

    return (data.data?.video_list || []).map((item: any) => ({
      id: item.item_id || item.id,
      title: item.title || '',
      author: item.author?.nickname || '',
      coverUrl: item.cover || item.cover_url || '',
      playCount: item.statistics?.play_count || item.play_count || 0,
      likeCount: item.statistics?.digg_count || item.digg_count || 0,
      commentCount: item.statistics?.comment_count || item.comment_count || 0,
      shareCount: item.statistics?.share_count || item.share_count || 0,
      duration: item.duration || item.video_duration || 0,
      createTime: item.create_time ? new Date(item.create_time * 1000).toISOString().split('T')[0] : ''
    }));
  }

  /* ============================================================
   *  模拟数据生成
   * ============================================================ */

  private generateMockVideos(keyword: string, count: number): DouyinVideo[] {
    const kw = keyword.toLowerCase();
    // 先尝试匹配现有视频
    let matched = MOCK_VIDEOS.filter(v =>
      v.title.toLowerCase().includes(kw)
    );
    // 不够则生成补充
    if (matched.length < count) {
      const extra = this.createMockVideosForKeyword(keyword, count - matched.length);
      matched = [...matched, ...extra];
    }
    return matched.slice(0, count);
  }

  private createMockVideosForKeyword(keyword: string, count: number): DouyinVideo[] {
    const templates = [
      `关于${keyword}，这个方法太绝了`,
      `${keyword}的正确打开方式`,
      `90%的人都不知道${keyword}的秘诀`,
      `做了3年${keyword}，分享几个心得`,
      `${keyword}避坑指南，看完少走弯路`,
      `手把手教你${keyword}`,
      `${keyword}前后对比，效果太惊艳`,
      `${keyword}必看！新手入门教程`
    ];
    const authors = ['专业师小雅', '行业老手老张', '探店达人小美', '创业者小李', '资深玩家阿杰'];

    return Array.from({ length: count }, (_, i) => {
      const baseViews = Math.floor(500000 + Math.random() * 2000000);
      return {
        id: `mock_${Date.now()}_${i}`,
        title: templates[i % templates.length],
        author: authors[i % authors.length],
        coverUrl: '',
        playCount: baseViews,
        likeCount: Math.floor(baseViews * (0.05 + Math.random() * 0.08)),
        commentCount: Math.floor(baseViews * (0.002 + Math.random() * 0.005)),
        shareCount: Math.floor(baseViews * (0.003 + Math.random() * 0.008)),
        duration: 30 + Math.floor(Math.random() * 60),
        createTime: new Date(Date.now() - Math.random() * 7 * 86400000).toISOString().split('T')[0]
      };
    });
  }
}
