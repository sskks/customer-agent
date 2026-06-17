'use client';

import { useState, useEffect, useCallback } from 'react';
import { FinalRecommendation } from '@/lib/types';
import { GeneratedScript } from '@/lib/scriptGenerator';
import { HotTopic, DouyinVideo, SearchResult } from '@/lib/douyinService';

/* ============================================================
 *  工具函数
 * ============================================================ */
const CONTENT_LABELS: Record<string, string> = {
  customer_case: '顾客案例', knowledge: '知识科普', environment_tour: '店内环境',
  promotion: '促销活动', behind_scenes: '幕后花絮', product_showcase: '产品展示'
};
const DIFFICULTY_LABELS: Record<string, string> = { easy: '简单', medium: '中等', hard: '困难' };

function formatNumber(n: number): string {
  if (n >= 10000) return (n / 10000).toFixed(1) + '万';
  return n.toLocaleString();
}

type TabMode = 'recommend' | 'search';

/* ============================================================
 *  脚本弹窗组件
 * ============================================================ */
function ScriptModal({ script, loading, onClose }: {
  script: GeneratedScript | null; loading: boolean; onClose: () => void;
}) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: 'blur(12px)', backgroundColor: 'rgba(15,23,42,0.4)' }}
      onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto animate-modal-in"
        style={{ boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}
        onClick={e => e.stopPropagation()}>
        {loading ? (
          <div className="p-12 text-center">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-100" />
              <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
              <div className="absolute inset-2 rounded-full border-4 border-violet-300 border-b-transparent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
            </div>
            <p className="text-lg font-medium text-slate-700 mb-2">AI 正在撰写脚本...</p>
            <div className="flex justify-center gap-1 mt-3">
              {[0, 150, 300].map((d, i) => (
                <span key={i} className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
              ))}
            </div>
          </div>
        ) : script ? (
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 pr-4">{script.title}</h2>
              <button onClick={onClose} className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-amber-500 text-lg">🎣</span>
                <span className="font-semibold text-amber-800 text-sm">开场钩子（前3秒）</span>
              </div>
              <p className="text-amber-900 font-medium">{script.hook}</p>
            </div>
            <div className="space-y-4 mb-6">
              {script.sections.map((section, i) => (
                <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold">{i + 1}</span>
                    <span className="font-semibold text-slate-800 text-sm">{section.title}</span>
                  </div>
                  <p className="text-slate-600 whitespace-pre-line text-sm leading-relaxed">{section.content}</p>
                </div>
              ))}
            </div>
            <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-indigo-500 text-lg">📢</span>
                <span className="font-semibold text-indigo-800 text-sm">结尾引导</span>
              </div>
              <p className="text-indigo-900">{script.cta}</p>
            </div>
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-slate-700 mb-2">推荐标签</h4>
              <div className="flex flex-wrap gap-2">
                {script.hashtags.map((tag, i) => (
                  <span key={i} className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-sm font-medium">{tag}</span>
                ))}
              </div>
            </div>
            {script.tips.length > 0 && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                <h4 className="text-sm font-semibold text-emerald-800 mb-2">💡 拍摄小贴士</h4>
                <ul className="space-y-1">
                  {script.tips.map((tip, i) => (
                    <li key={i} className="text-emerald-700 text-sm flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5">•</span>{tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* ============================================================
 *  骨架屏
 * ============================================================ */
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl p-6 animate-fade-in border border-slate-100" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      <div className="flex items-center gap-2 mb-4">
        <div className="h-6 w-16 rounded-full bg-slate-100 animate-shimmer" />
        <div className="h-6 w-20 rounded-full bg-slate-100 animate-shimmer" style={{ animationDelay: '0.1s' }} />
      </div>
      <div className="h-6 w-3/4 rounded bg-slate-100 mb-3 animate-shimmer" style={{ animationDelay: '0.2s' }} />
      <div className="h-4 w-1/2 rounded bg-slate-100 mb-4 animate-shimmer" style={{ animationDelay: '0.3s' }} />
      <div className="flex gap-4 mb-4">{[1,2,3,4].map(i => <div key={i} className="h-4 w-20 rounded bg-slate-50 animate-shimmer" style={{ animationDelay: `${0.1*i}s` }} />)}</div>
      <div className="flex justify-between items-center">
        <div className="flex gap-2"><div className="h-8 w-8 rounded-full bg-slate-50" /><div className="h-8 w-8 rounded-full bg-slate-50" /></div>
        <div className="h-10 w-28 rounded-xl bg-slate-100 animate-shimmer" />
      </div>
    </div>
  );
}

/* ============================================================
 *  热搜话题行
 * ============================================================ */
function HotTopicRow({ topic, onGenerateScript }: {
  topic: HotTopic;
  onGenerateScript: (topic: HotTopic) => void;
}) {
  const rankColors = ['text-red-500', 'text-orange-500', 'text-amber-500'];
  const rankColor = topic.rank <= 3 ? rankColors[topic.rank - 1] : 'text-slate-400';

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl hover:bg-slate-50 transition group">
      {/* 排名 */}
      <span className={`text-xl font-bold w-8 text-center ${rankColor}`}>{topic.rank}</span>

      {/* 话题信息 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-slate-900 truncate">{topic.keyword}</span>
          <span className="shrink-0 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-xs">{topic.category}</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span>🔥 {formatNumber(topic.heatValue)} 热度</span>
          {topic.videoCount && <span>📹 {formatNumber(topic.videoCount)} 条视频</span>}
        </div>
      </div>

      {/* 生成脚本按钮 */}
      <button
        onClick={() => onGenerateScript(topic)}
        className="shrink-0 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 transition-all opacity-0 group-hover:opacity-100"
        style={{ boxShadow: '0 2px 8px rgba(245,158,11,0.2)' }}
      >
        生成脚本
      </button>
    </div>
  );
}

/* ============================================================
 *  视频卡片
 * ============================================================ */
function VideoCard({ video }: { video: DouyinVideo }) {
  return (
    <div className="bg-white rounded-xl p-4 border border-slate-100 hover:border-indigo-200 transition" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <h4 className="font-semibold text-slate-800 text-sm mb-2 line-clamp-2">{video.title}</h4>
      <p className="text-xs text-slate-400 mb-3">@{video.author} · {video.createTime}</p>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
        <span>▶ {formatNumber(video.playCount)}</span>
        <span>❤ {formatNumber(video.likeCount)}</span>
        <span>💬 {formatNumber(video.commentCount)}</span>
        <span>↗ {formatNumber(video.shareCount)}</span>
        <span>⏱ {video.duration}s</span>
      </div>
    </div>
  );
}

/* ============================================================
 *  主页面
 * ============================================================ */
export default function Home() {
  const [tab, setTab] = useState<TabMode>('recommend');
  const [userEmail, setUserEmail] = useState<string>('');

  useEffect(() => {
    import('@/lib/supabase/client').then(({ createClient }) => {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) setUserEmail(user.email || '');
      });
    });
  }, []);

  const handleLogout = async () => {
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  // ---- 推荐 tab 状态 ----
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<FinalRecommendation[]>([]);
  const [industry, setIndustry] = useState('beauty');
  const [businessName, setBusinessName] = useState('');
  const [feedbackInsight, setFeedbackInsight] = useState<{ totalFeedback: number; satisfaction: number; suggestions: string[] } | null>(null);
  const [feedbackMap, setFeedbackMap] = useState<Record<string, 'good' | 'neutral' | 'bad'>>({});

  // ---- 搜索 tab 状态 ----
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [hotTopics, setHotTopics] = useState<HotTopic[]>([]);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [topicsLoaded, setTopicsLoaded] = useState(false);

  // ---- 脚本弹窗（共用）----
  const [selectedRec, setSelectedRec] = useState<FinalRecommendation | null>(null);
  const [script, setScript] = useState<GeneratedScript | null>(null);
  const [scriptLoading, setScriptLoading] = useState(false);

  /* 加载热搜榜 */
  useEffect(() => {
    if (tab === 'search' && !topicsLoaded) {
      setSearchLoading(true);
      fetch('/api/trending')
        .then(r => r.json())
        .then(result => {
          if (result.success) {
            setHotTopics(result.data.topics);
            setTopicsLoaded(true);
          }
        })
        .catch(() => {})
        .finally(() => setSearchLoading(false));
    }
  }, [tab, topicsLoaded]);

  /* 搜索热点 */
  const handleSearch = async () => {
    const kw = searchKeyword.trim();
    if (!kw) return;

    setSearchLoading(true);
    setSearchResult(null);
    try {
      const res = await fetch('/api/trending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: kw })
      });
      const result = await res.json();
      if (result.success) {
        setSearchResult(result.data);
        setHotTopics(result.data.topics);
      }
    } catch { /* 静默 */ }
    finally { setSearchLoading(false);
    }
  };

  /* 生成推荐 */
  const handleGenerate = async () => {
    if (!businessName.trim()) { alert('请输入店铺名称'); return; }
    setLoading(true);
    setRecommendations([]);
    try {
      const res = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ industry, businessName })
      });
      const result = await res.json();
      if (result.success) {
        setRecommendations(result.data.recommendations);
        setFeedbackInsight(result.data.feedbackInsight);
      } else { alert('生成失败，请重试'); }
    } catch { alert('生成失败，请重试'); }
    finally { setLoading(false); }
  };

  /* 提交反馈 */
  const handleFeedback = async (rec: FinalRecommendation, feedback: 'good' | 'neutral' | 'bad') => {
    setFeedbackMap(prev => ({ ...prev, [rec.id]: feedback }));
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'submit', recommendationId: rec.id, contentType: rec.contentType, topic: rec.topic, feedback })
      });
    } catch { /* 静默 */ }
  };

  /* 从推荐卡片生成脚本 */
  const handleGenerateScriptFromRec = useCallback(async (rec: FinalRecommendation) => {
    setSelectedRec(rec);
    setScript(null);
    setScriptLoading(true);
    try {
      const res = await fetch('/api/script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recommendation: rec, industry, businessName })
      });
      const result = await res.json();
      if (result.success) setScript(result.data);
    } catch { /* 静默 */ }
    finally { setScriptLoading(false); }
  }, [industry, businessName]);

  /* 从热搜话题直接生成脚本 */
  const handleGenerateScriptFromTopic = useCallback(async (topic: HotTopic) => {
    // 将热搜话题转化为推荐对象
    const rec: FinalRecommendation = {
      id: `hot_${topic.rank}_${Date.now()}`,
      topic: topic.keyword,
      contentType: 'knowledge',
      title: topic.keyword,
      reason: `抖音热搜第${topic.rank}名，热度 ${formatNumber(topic.heatValue)}，${topic.category}分类`,
      expectedOutcome: {
        views: Math.round(2000 + topic.heatValue / 10000),
        inquiries: Math.round(5 + topic.heatValue / 50000),
        confidence: 0.85
      },
      difficulty: 'medium',
      estimatedTime: 1.5,
      confidence: 0.85,
      needsConfirmation: false
    };
    setSelectedRec(rec);
    setScript(null);
    setScriptLoading(true);
    try {
      const res = await fetch('/api/script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recommendation: rec,
          industry,
          businessName: businessName || '我的店铺'
        })
      });
      const result = await res.json();
      if (result.success) setScript(result.data);
    } catch { /* 静默 */ }
    finally { setScriptLoading(false); }
  }, [industry, businessName]);

  const closeScript = useCallback(() => { setSelectedRec(null); setScript(null); }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 border-b border-slate-200/60" style={{ backdropFilter: 'blur(12px)' }}>
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-sm font-bold">AI</div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">店播AI Agent</h1>
              <p className="text-xs text-slate-400">智能短视频获客助手</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {feedbackInsight && feedbackInsight.totalFeedback > 0 && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200">
                <span className="text-xs text-emerald-600 font-medium">已学习 {feedbackInsight.totalFeedback} 条反馈</span>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
            )}
            <div className="flex items-center gap-2">
              {userEmail && (
                <span className="hidden sm:block text-xs text-slate-400 max-w-[140px] truncate">{userEmail}</span>
              )}
              <button onClick={handleLogout} className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition">
                退出
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Tab 切换 */}
        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit mb-6">
          <button
            onClick={() => setTab('recommend')}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition ${tab === 'recommend' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            今日推荐
          </button>
          <button
            onClick={() => setTab('search')}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition ${tab === 'search' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            🔥 搜索热点
          </button>
        </div>

        {/* ============================================================ */}
        {/*  推荐 Tab */}
        {/* ============================================================ */}
        {tab === 'recommend' && (
          <>
            {/* 输入卡片 */}
            <div className="bg-white rounded-2xl p-6 mb-8 border border-slate-100 animate-fade-in" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 6px 24px rgba(0,0,0,0.03)' }}>
              <h2 className="text-lg font-bold text-slate-900 mb-5">告诉我你的信息</h2>
              <div className="grid md:grid-cols-2 gap-4 mb-5">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">行业类型</label>
                  <select value={industry} onChange={e => setIndustry(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition">
                    <option value="beauty">美容院 / 美甲店</option>
                    <option value="restaurant">餐饮店 / 奶茶店</option>
                    <option value="fitness">健身房 / 瑜伽馆</option>
                    <option value="bar">酒吧 / 酒馆</option>
                    <option value="hotel">酒店 / 民宿</option>
                    <option value="education">教培机构</option>
                    <option value="medical">医疗 / 诊所</option>
                    <option value="retail">零售 / 电商</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">店铺名称</label>
                  <input type="text" value={businessName} onChange={e => setBusinessName(e.target.value)}
                    placeholder="例如：悦美美容院"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition" />
                </div>
              </div>
              <button onClick={handleGenerate} disabled={loading}
                className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ boxShadow: '0 4px 14px rgba(99,102,241,0.3)' }}>
                {loading ? '正在智能分析中...' : '生成今日推荐'}
              </button>
            </div>

            {/* 骨架屏 */}
            {loading && (
              <div className="space-y-4 mb-8">
                <div className="h-8 w-60 rounded-lg bg-slate-100 animate-shimmer mb-2" />
                <div className="h-4 w-80 rounded bg-slate-50 animate-shimmer" style={{ animationDelay: '0.1s' }} />
                {[0,1,2].map(i => <SkeletonCard key={i} />)}
              </div>
            )}

            {/* 反馈洞察 */}
            {!loading && feedbackInsight && feedbackInsight.totalFeedback > 0 && feedbackInsight.suggestions.length > 0 && (
              <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 animate-fade-in">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-indigo-500">🧠</span>
                  <span className="font-semibold text-indigo-800 text-sm">学习洞察</span>
                </div>
                {feedbackInsight.suggestions.map((s, i) => (
                  <p key={i} className="text-indigo-700 text-sm">{s}</p>
                ))}
              </div>
            )}

            {/* 推荐结果 */}
            {!loading && recommendations.length > 0 && (
              <div className="animate-fade-in">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-slate-900 mb-1">今日为你推荐</h2>
                  <p className="text-slate-500 text-sm">基于热点、季节和你的反馈数据智能生成</p>
                </div>
                <div className="space-y-4">
                  {recommendations.map((rec, index) => {
                    const fb = feedbackMap[rec.id];
                    return (
                      <div key={rec.id} className="bg-white rounded-2xl p-6 border border-slate-100 hover:border-indigo-200 transition-all animate-slide-up"
                        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 6px 24px rgba(0,0,0,0.03)', animationDelay: `${index * 80}ms` }}>
                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                          <span className="px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-xs font-bold">TOP {index + 1}</span>
                          <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">{CONTENT_LABELS[rec.contentType] ?? rec.contentType}</span>
                          {rec.needsConfirmation && <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-600 text-xs font-medium border border-amber-200">仅供参考</span>}
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">{rec.title}</h3>
                        <p className="text-slate-500 text-sm mb-4">{rec.reason}</p>
                        <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-400 mb-4">
                          <span>预期 {rec.expectedOutcome.views} 播放</span>
                          <span>{rec.expectedOutcome.inquiries} 个咨询</span>
                          <span>{DIFFICULTY_LABELS[rec.difficulty]}</span>
                          <span>{rec.estimatedTime} 小时</span>
                          <span>置信度 {(rec.confidence * 100).toFixed(0)}%</span>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleFeedback(rec, 'good')}
                              className={`w-8 h-8 flex items-center justify-center rounded-full transition ${fb === 'good' ? 'bg-emerald-100 text-emerald-600' : 'text-slate-300 hover:bg-slate-50 hover:text-emerald-500'}`} title="喜欢">
                              <svg className="w-4 h-4" fill={fb === 'good' ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z M4 22H2V11h2v11z" /></svg>
                            </button>
                            <button onClick={() => handleFeedback(rec, 'bad')}
                              className={`w-8 h-8 flex items-center justify-center rounded-full transition ${fb === 'bad' ? 'bg-red-100 text-red-500' : 'text-slate-300 hover:bg-slate-50 hover:text-red-400'}`} title="不喜欢">
                              <svg className="w-4 h-4" fill={fb === 'bad' ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 15V19a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3H10z M20 2h2v11h-2V2z" /></svg>
                            </button>
                            {fb && <span className={`ml-1 text-xs font-medium ${fb === 'good' ? 'text-emerald-500' : 'text-red-400'}`}>{fb === 'good' ? '已标记喜欢' : '已标记不喜欢'}</span>}
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); handleGenerateScriptFromRec(rec); }}
                            className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 transition-all"
                            style={{ boxShadow: '0 2px 8px rgba(245,158,11,0.3)' }}>
                            生成脚本
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-8 p-5 rounded-2xl bg-gradient-to-r from-slate-50 to-indigo-50/50 border border-slate-200/60">
                  <h3 className="font-semibold text-slate-800 mb-2 text-sm">下一步</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">点击"生成脚本"获取完整口播文案和分镜指导。也可以切换到"搜索热点"tab，从抖音热搜中找到灵感。</p>
                </div>
              </div>
            )}

            {/* 空状态 */}
            {!loading && recommendations.length === 0 && (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 animate-fade-in" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center">
                  <span className="text-4xl">🤖</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">欢迎使用店播AI Agent</h3>
                <p className="text-slate-500 mb-6 max-w-md mx-auto leading-relaxed">
                  输入店铺信息生成个性化推荐，或切换到"搜索热点"从抖音热搜中找灵感。
                </p>
              </div>
            )}
          </>
        )}

        {/* ============================================================ */}
        {/*  搜索热点 Tab */}
        {/* ============================================================ */}
        {tab === 'search' && (
          <div className="animate-fade-in">
            {/* 搜索栏 */}
            <div className="bg-white rounded-2xl p-4 mb-6 border border-slate-100 flex gap-3" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div className="flex-1 relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={e => setSearchKeyword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="搜索抖音热点，例如：补水、美甲、健身..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition"
                />
              </div>
              <button onClick={handleSearch} disabled={searchLoading || !searchKeyword.trim()}
                className="px-6 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                style={{ boxShadow: '0 2px 8px rgba(99,102,241,0.3)' }}>
                {searchLoading ? '搜索中...' : '搜索热点'}
              </button>
            </div>

            {/* 搜索结果概览 */}
            {searchResult && (
              <div className="mb-4 flex items-center gap-3 text-sm text-slate-500 animate-fade-in">
                <span>搜索 "<strong className="text-slate-700">{searchResult.keyword}</strong>"</span>
                <span className="w-px h-4 bg-slate-200" />
                <span>{searchResult.topics.length} 个相关话题</span>
                <span className="w-px h-4 bg-slate-200" />
                <span>{searchResult.videos.length} 条热门视频</span>
              </div>
            )}

            {/* Loading 骨架 */}
            {searchLoading && (
              <div className="space-y-3 mb-6">
                {[0,1,2,3,4].map(i => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-white border border-slate-100 animate-shimmer" style={{ animationDelay: `${i * 0.08}s` }}>
                    <div className="w-8 h-8 rounded-lg bg-slate-100" />
                    <div className="flex-1">
                      <div className="h-5 w-48 rounded bg-slate-100 mb-2" />
                      <div className="h-3 w-32 rounded bg-slate-50" />
                    </div>
                    <div className="h-9 w-24 rounded-xl bg-slate-100" />
                  </div>
                ))}
              </div>
            )}

            {/* 热搜话题列表 */}
            {!searchLoading && hotTopics.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <span>🔥</span>
                  {searchResult ? '相关热点话题' : '抖音热搜榜'}
                </h3>
                <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-50 overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                  {hotTopics.map(topic => (
                    <HotTopicRow key={topic.rank} topic={topic} onGenerateScript={handleGenerateScriptFromTopic} />
                  ))}
                </div>
              </div>
            )}

            {/* 相关热门视频 */}
            {!searchLoading && searchResult && searchResult.videos.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <span>📹</span>
                  相关热门视频
                </h3>
                <div className="grid md:grid-cols-2 gap-3">
                  {searchResult.videos.map(video => (
                    <VideoCard key={video.id} video={video} />
                  ))}
                </div>
              </div>
            )}

            {/* 搜索空状态 */}
            {!searchLoading && !topicsLoaded && hotTopics.length === 0 && (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-100" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
                  <span className="text-4xl">🔥</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">搜索抖音热点</h3>
                <p className="text-slate-500 max-w-md mx-auto leading-relaxed">
                  输入关键词搜索抖音热搜话题，找到当前最热门的内容方向，一键生成拍摄脚本。
                </p>
              </div>
            )}

            {/* 搜索无结果 */}
            {!searchLoading && topicsLoaded && hotTopics.length === 0 && searchResult && (
              <div className="bg-white rounded-2xl p-8 text-center border border-slate-100 animate-fade-in">
                <p className="text-slate-500">没有找到与"{searchResult.keyword}"相关的热搜话题，换个关键词试试？</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto py-6 border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-4 text-center text-xs text-slate-400">
          店播AI Agent v0.4 &mdash; 让每个本地商家都能轻松获客
        </div>
      </footer>

      {/* 脚本弹窗（共用） */}
      {selectedRec && <ScriptModal script={script} loading={scriptLoading} onClose={closeScript} />}
    </div>
  );
}
