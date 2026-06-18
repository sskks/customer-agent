'use client';

import { useState, useEffect, useCallback } from 'react';
import { FinalRecommendation } from '@/lib/types';
import { GeneratedScript } from '@/lib/scriptGenerator';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { HotTopic, DouyinVideo, SearchResult } from '@/lib/douyinService';
import OnboardingModal from '@/components/OnboardingModal';
import ShareButton from '@/components/ShareButton';

type TabMode = 'recommend' | 'search';

function formatNumber(n: number): string {
  if (n >= 10000) return (n / 10000).toFixed(1) + '万';
  return n.toLocaleString();
}

/* ═══════════════════════════════════════════════════
   ScriptModal — 毛玻璃弹窗
   ═══════════════════════════════════════════════════ */

interface ScriptModalProps {
  recommendation: FinalRecommendation;
  industry: string;
  businessName: string;
  onClose: () => void;
}

function ScriptModal({ recommendation, industry, businessName, onClose }: ScriptModalProps) {
  const [loading, setLoading] = useState(true);
  const [script, setScript] = useState<GeneratedScript | null>(null);
  const [error, setError] = useState<string>('');

  const generateScript = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: recommendation.topic,
          contentType: recommendation.contentType,
          industry,
          businessName,
        }),
      });
      const result = await response.json();
      if (result.success) setScript(result.data.script);
      else setError(result.error || '生成失败');
    } catch (err) {
      console.error('生成脚本失败:', err);
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  }, [recommendation, industry, businessName]);

  useEffect(() => {
    generateScript();
  }, [generateScript]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ background: 'rgba(15, 23, 42, 0.35)', backdropFilter: 'blur(12px)' }}
      onClick={onClose}
    >
      <div
        className="animate-modal-in bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[88vh] overflow-hidden flex flex-col border border-slate-200/60"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ─── Header ─── */}
        <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-lg font-bold shadow-md">
              S
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">拍摄脚本</h2>
              <p className="text-sm text-slate-500 mt-0.5">{recommendation.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* ─── Content ─── */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              {/* 动态加载图标 */}
              <div className="relative w-20 h-20 mb-6">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 animate-pulse-glow" />
                <div className="absolute inset-2 rounded-xl bg-white/90 backdrop-blur-sm flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
              </div>
              <p className="text-slate-700 font-medium text-lg">AI 正在创作你的专属脚本</p>
              <p className="text-sm text-slate-400 mt-2">预计耗时 5 – 10 秒</p>
              
              {/* 进度提示 */}
              <div className="mt-8 flex items-center gap-2 text-xs text-slate-500">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                <span className="ml-2">分析热点 · 生成文案 · 设计分镜</span>
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center py-20">
              <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center text-red-500 text-2xl mb-4">!</div>
              <p className="text-slate-700 font-medium mb-1">生成失败</p>
              <p className="text-sm text-slate-500 mb-6">{error}</p>
              <button onClick={generateScript} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium text-sm">
                重试
              </button>
            </div>
          ) : script ? (
            <div className="space-y-8">
              {/* ── 概览卡片 ── */}
              <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-2xl p-6 border border-indigo-100/50">
                <h3 className="text-sm font-semibold text-indigo-700 uppercase tracking-wider mb-4">脚本概览</h3>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: '视频标题', value: script.title },
                    { label: '预计时长', value: `${script.duration} 秒` },
                    { label: '分镜数量', value: `${script.sceneBreakdown.length} 个场景` },
                  ].map((item) => (
                    <div key={item.label}>
                      <p className="text-xs text-indigo-500/70 mb-1">{item.label}</p>
                      <p className="text-sm font-semibold text-slate-800">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── 开头钩子 ── */}
              <div className="relative pl-5 border-l-[3px] border-amber-400">
                <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">开头钩子 · 前3秒</span>
                <p className="text-lg font-semibold text-slate-800 mt-2 leading-relaxed">{script.hookLine}</p>
              </div>

              {/* ── 完整文案 ── */}
              <section>
                <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs">P</span>
                  完整口播文案
                </h4>
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                  <p className="text-slate-700 leading-[1.85] whitespace-pre-wrap text-[15px]">{script.mainContent}</p>
                </div>
              </section>

              {/* ── 行动号召 ── */}
              <div className="relative pl-5 border-l-[3px] border-emerald-400">
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">行动号召 · 最后5秒</span>
                <p className="text-lg font-semibold text-slate-800 mt-2 leading-relaxed">{script.callToAction}</p>
              </div>

              {/* ── 分镜脚本 ── */}
              <section>
                <h4 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-violet-100 text-violet-600 flex items-center justify-center text-xs">F</span>
                  分镜脚本
                </h4>
                <div className="space-y-3">
                  {script.sceneBreakdown.map((scene) => (
                    <div key={scene.sceneNumber} className="group bg-white rounded-xl border border-slate-200/80 p-5 hover:border-indigo-200 hover:shadow-md transition-all">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                          {scene.sceneNumber}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs text-slate-400 font-medium">{scene.duration}秒</span>
                          <div className="mt-2 space-y-1.5">
                            <div>
                              <span className="text-xs font-semibold text-indigo-600 mr-1.5">画面</span>
                              <span className="text-sm text-slate-700">{scene.visual}</span>
                            </div>
                            <div>
                              <span className="text-xs font-semibold text-violet-600 mr-1.5">台词</span>
                              <span className="text-sm text-slate-700">{scene.audio}</span>
                            </div>
                            {scene.notes && (
                              <p className="text-xs text-slate-400 italic mt-1">{scene.notes}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* ── 拍摄建议 ── */}
              <section>
                <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-amber-100 text-amber-600 flex items-center justify-center text-xs">T</span>
                  拍摄建议
                </h4>
                <div className="bg-amber-50/50 rounded-xl p-5 border border-amber-100/50">
                  <ul className="space-y-2">
                    {script.shootingTips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 flex-shrink-0" />
                        <span className="text-sm text-slate-700 leading-relaxed">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>

              {/* ── 操作按钮 ── */}
              <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-100">
                <button
                  onClick={() => {
                    const content = `【${script.title}】\n\n${script.mainContent}\n\n${script.callToAction}`;
                    navigator.clipboard.writeText(content);
                    alert('已复制到剪贴板！');
                  }}
                  className="flex-1 min-w-[120px] py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium text-sm"
                >
                  📋 复制文案
                </button>
                
                <button
                  onClick={() => {
                    const scriptContent = script.sceneBreakdown.map(s =>
                      `场景${s.sceneNumber}（${s.duration}秒）\n画面：${s.visual}\n台词：${s.audio}${s.notes ? `\n备注：${s.notes}` : ''}`
                    ).join('\n\n');
                    const fullContent = `${script.title}\n\n${scriptContent}`;
                    const blob = new Blob([fullContent], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${script.title}.txt`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="flex-1 min-w-[120px] py-2.5 bg-white text-indigo-600 border border-indigo-200 rounded-xl hover:bg-indigo-50 transition-colors font-medium text-sm"
                >
                  💾 下载TXT
                </button>
                
                <ShareButton
                  title={script.title}
                  text={`${script.hookLine}\n\n${script.mainContent.substring(0, 100)}...`}
                  url={window.location.href}
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   Home — 主页面
   ═══════════════════════════════════════════════════ */

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<FinalRecommendation[]>([]);
  const [industry, setIndustry] = useState('beauty');
  const [businessName, setBusinessName] = useState('');
  const [selectedRecommendation, setSelectedRecommendation] = useState<FinalRecommendation | null>(null);
  const [feedbackInsight, setFeedbackInsight] = useState<{ totalFeedback: number; satisfaction: number; suggestions: string[] } | null>(null);

  // ─── 反馈状态 ───
  const [feedbackMap, setFeedbackMap] = useState<Record<string, 'good' | 'neutral' | 'bad'>>({});
  const [feedbackLoading, setFeedbackLoading] = useState<string | null>(null);

  // ─── 用户认证状态 ───
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const supabase = createClient();

  // ─── Tab 切换 ───
  const [tab, setTab] = useState<TabMode>('recommend');

  // ─── 搜索热点状态 ───
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [hotTopics, setHotTopics] = useState<HotTopic[]>([]);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [topicsLoaded, setTopicsLoaded] = useState(false);

  useEffect(() => {
    // 获取当前用户
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setAuthLoading(false);

      // 如果已登录，加载用户资料
      if (user) loadProfile();
    });

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!error && profile) {
        setIndustry(profile.industry || 'beauty');
        setBusinessName(profile.business_name || '');
        
        // 如果用户没有设置行业或店铺名称，显示新手引导
        if (!profile.industry || !profile.business_name) {
          setShowOnboarding(true);
        }
      } else {
        // 新用户，显示新手引导
        setShowOnboarding(true);
      }
    } catch (err) {
      console.error('加载用户资料失败:', err);
    }
  };

  // ─── 加载热搜榜 ───
  useEffect(() => {
    if (tab === 'search' && !topicsLoaded) {
      setSearchLoading(true);
      fetch('/api/trending')
        .then((r) => r.json())
        .then((result) => {
          if (result.success) {
            setHotTopics(result.data.topics);
            setTopicsLoaded(true);
          }
        })
        .catch(() => {})
        .finally(() => setSearchLoading(false));
    }
  }, [tab, topicsLoaded]);

  const handleSearch = async () => {
    const kw = searchKeyword.trim();
    if (!kw) return;
    setSearchLoading(true);
    setSearchResult(null);
    try {
      const res = await fetch('/api/trending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: kw }),
      });
      const result = await res.json();
      if (result.success) {
        setSearchResult(result.data);
        setHotTopics(result.data.topics);
      }
    } catch {
      /* 静默 */
    } finally {
      setSearchLoading(false);
    }
  };

  const handleGenerateScriptFromTopic = useCallback(
    (topic: HotTopic) => {
      const rec: FinalRecommendation = {
        id: `hot_${topic.rank}_${Date.now()}`,
        topic: topic.keyword,
        contentType: 'knowledge',
        title: topic.keyword,
        reason: `抖音热搜第${topic.rank}名 · 热度 ${formatNumber(topic.heatValue)} · ${topic.category}`,
        expectedOutcome: {
          views: Math.round(2000 + topic.heatValue / 10000),
          inquiries: Math.round(5 + topic.heatValue / 50000),
          confidence: 0.85,
        },
        difficulty: 'medium',
        estimatedTime: 1.5,
        confidence: 0.85,
        needsConfirmation: false,
      };
      setSelectedRecommendation(rec);
    },
    []
  );

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRecommendations([]);
    setFeedbackMap({});
  };

  const handleFeedback = async (recId: string, feedback: 'good' | 'neutral' | 'bad') => {
    setFeedbackLoading(recId);
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit',
          recommendationId: recId,
          feedback,
        }),
      });
      const result = await response.json();
      if (result.success) {
        setFeedbackMap((prev) => ({ ...prev, [recId]: feedback }));
      }
    } catch (err) {
      console.error('提交反馈失败:', err);
    } finally {
      setFeedbackLoading(null);
    }
  };

  const handleGenerate = useCallback(async () => {
    if (!businessName.trim()) { alert('请输入店铺名称'); return; }
    setLoading(true);
    try {
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ industry, businessName }),
      });
      const result = await response.json();
      if (result.success) {
        setRecommendations(result.data.recommendations);
        if (result.data.feedbackInsight) {
          setFeedbackInsight(result.data.feedbackInsight);
        }
      }
      else alert('生成失败，请重试');
    } catch (error) {
      console.error('生成失败:', error);
      alert('生成失败，请重试');
    } finally {
      setLoading(false);
    }
  }, [industry, businessName]);

  const getDifficultyLabel = (d: string) =>
    ({ easy: '简单', medium: '中等', hard: '困难' }[d] || d);

  const getContentTypeLabel = (t: string) =>
    ({ customer_case: '顾客案例', knowledge: '知识科普', environment_tour: '店内环境', promotion: '促销活动', behind_scenes: '幕后花絮', product_showcase: '产品展示' }[t] || t);

  const getDifficultyColor = (d: string) =>
    ({ easy: 'bg-emerald-100 text-emerald-700', medium: 'bg-amber-100 text-amber-700', hard: 'bg-red-100 text-red-700' }[d] || 'bg-slate-100 text-slate-600');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* ════════ Header ════════ */}
      <header className="sticky top-0 z-30 bg-white/70 backdrop-blur-md border-b border-slate-200/60">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-amber-400" />
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-sm font-bold shadow-sm">
              A
            </div>
            <div>
              <h1 className="text-[15px] font-bold text-slate-900 leading-tight">店播 AI Agent</h1>
              <p className="text-[11px] text-slate-400">智能短视频获客助手</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <a
                href="/history"
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                效果追踪
              </a>
            )}
            {authLoading ? (
              <div className="w-20 h-5 bg-slate-200 rounded animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs font-medium text-slate-700">{user.user_metadata?.full_name || user.email?.split('@')[0]}</p>
                  <p className="text-[10px] text-slate-400">{user.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-xs text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  退出
                </button>
              </div>
            ) : (
              <a
                href="/login"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700 px-4 py-2 rounded-xl hover:bg-indigo-50 transition-colors"
              >
                登录 / 注册
              </a>
            )}
          </div>
        </div>
      </header>

      {/* ════════ Main ════════ */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-10">
        {/* ─── Tab 切换 ─── */}
        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit mb-8">
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

        {/* ════════════════════════════════════════════
            推荐 Tab
            ════════════════════════════════════════════ */}
        {tab === 'recommend' && (<>
        {/* ─── 输入区 ─── */}
        <section className="animate-slide-up">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-6 sm:p-8">
              <h2 className="text-lg font-bold text-slate-900 mb-1">告诉我你的信息</h2>
              <p className="text-sm text-slate-500 mb-6">选择行业并输入店铺名称，AI 将为你定制推荐内容</p>

              <div className="grid sm:grid-cols-2 gap-5 mb-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">行业类型</label>
                  <input
                    type="text"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder="例如：美容院、餐饮店、健身房..."
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 focus:bg-white outline-none transition-all"
                  />
                  <p className="text-[11px] text-slate-400 mt-1.5">输入你的行业，AI 会据此生成适合的脚本风格</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">店铺名称</label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleGenerate(); }}
                    placeholder="例如：美丽美容院"
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 focus:bg-white outline-none transition-all"
                  />
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full h-12 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-semibold text-sm hover:from-indigo-700 hover:to-violet-700 transition-all shadow-md shadow-indigo-500/20 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99]"
              >
                {loading ? '分析中...' : '生成今日推荐'}
              </button>
            </div>
          </div>
        </section>

        {/* ─── 加载骨架 ─── */}
        {loading && (
          <div className="mt-10 animate-fade-in">
            <div className="mb-6">
              <div className="h-7 w-48 bg-slate-200 rounded-lg animate-shimmer mb-2" />
              <div className="h-4 w-72 bg-slate-100 rounded animate-shimmer" />
            </div>
            <div className="space-y-4">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-slate-200/80 p-6 overflow-hidden"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* 标签占位 */}
                      <div className="flex gap-2 mb-3">
                        <div className="h-5 w-12 bg-indigo-100 rounded-full animate-shimmer" />
                        <div className="h-5 w-16 bg-violet-100 rounded-full animate-shimmer" />
                      </div>
                      {/* 标题占位 */}
                      <div className="h-5 w-64 bg-slate-200 rounded animate-shimmer mb-2" />
                      {/* 描述占位 */}
                      <div className="h-4 w-96 bg-slate-100 rounded animate-shimmer mb-4" />
                      {/* 指标占位 */}
                      <div className="flex gap-4">
                        {[0, 1, 2, 3, 4].map((j) => (
                          <div key={j} className="h-3 w-14 bg-slate-100 rounded animate-shimmer" />
                        ))}
                      </div>
                    </div>
                    {/* 按钮占位 */}
                    <div className="ml-4 h-10 w-24 bg-indigo-100 rounded-xl animate-shimmer" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── 推荐结果 ─── */}
        {!loading && recommendations.length > 0 && (
          <section className="mt-10">
            {/* 反馈学习洞察 */}
            {feedbackInsight && feedbackInsight.totalFeedback > 0 && feedbackInsight.suggestions.length > 0 && (
              <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100/50 animate-fade-in">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-indigo-500">🧠</span>
                  <span className="text-sm font-semibold text-indigo-800">学习洞察</span>
                  <span className="text-xs text-indigo-500">已分析 {feedbackInsight.totalFeedback} 条反馈</span>
                </div>
                {feedbackInsight.suggestions.map((s, i) => (
                  <p key={i} className="text-sm text-indigo-700/80">{s}</p>
                ))}
              </div>
            )}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900">今日为你推荐</h2>
              <p className="text-sm text-slate-500 mt-1">基于热点趋势、季节特点和你的业务情况</p>
            </div>

            <div className="space-y-4">
              {recommendations.map((rec, index) => (
                <div
                  key={rec.id}
                  className={`animate-slide-up delay-${(index + 1) * 75} bg-white rounded-2xl border border-slate-200/80 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-500/5 transition-all group overflow-hidden`}
                >
                  <div className="flex">
                    {/* 左侧排名色条 */}
                    <div className={`w-1 flex-shrink-0 ${index === 0 ? 'bg-gradient-to-b from-indigo-500 to-violet-500' : index === 1 ? 'bg-gradient-to-b from-violet-400 to-indigo-400' : 'bg-slate-300'}`} />

                    <div className="flex-1 p-5 sm:p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          {/* 标签 */}
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                              #{index + 1}
                            </span>
                            <span className="text-[11px] font-medium text-violet-600 bg-violet-50 px-2.5 py-0.5 rounded-full">
                              {getContentTypeLabel(rec.contentType)}
                            </span>
                            {rec.needsConfirmation && (
                              <span className="text-[11px] font-medium text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full">
                                仅供参考
                              </span>
                            )}
                          </div>

                          {/* 标题 & 理由 */}
                          <h3 className="text-base font-bold text-slate-900 mb-1.5 group-hover:text-indigo-700 transition-colors">
                            {rec.title}
                          </h3>
                          <p className="text-sm text-slate-500 mb-4 leading-relaxed">{rec.reason}</p>

                          {/* 指标 */}
                          <div className="flex flex-wrap gap-x-5 gap-y-1.5">
                            {[
                              { label: '播放', value: rec.expectedOutcome.views.toLocaleString(), color: 'text-slate-700' },
                              { label: '咨询', value: `${rec.expectedOutcome.inquiries}个`, color: 'text-slate-700' },
                              { label: '难度', value: getDifficultyLabel(rec.difficulty), color: '' },
                              { label: '耗时', value: `${rec.estimatedTime}h`, color: 'text-slate-700' },
                              { label: '置信度', value: `${(rec.confidence * 100).toFixed(0)}%`, color: 'text-slate-700' },
                            ].map((m) => (
                              <span key={m.label} className="text-xs text-slate-400">
                                {m.label}{' '}
                                {m.label === '难度' ? (
                                  <span className={`${getDifficultyColor(rec.difficulty)} px-1.5 py-0.5 rounded text-[11px] font-medium`}>
                                    {m.value}
                                  </span>
                                ) : (
                                  <span className={`font-semibold ${m.color}`}>{m.value}</span>
                                )}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* 生成脚本按钮 */}
                        <button
                          onClick={() => setSelectedRecommendation(rec)}
                          className="flex-shrink-0 h-10 px-5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-all shadow-sm hover:shadow-md hover:shadow-indigo-500/20 active:scale-95"
                        >
                          生成脚本
                        </button>
                      </div>

                      {/* 反馈区域 */}
                      {user && (
                        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-xs text-slate-400">这个推荐对你有帮助吗？</span>
                          <div className="flex items-center gap-2">
                            {feedbackMap[rec.id] ? (
                              <span className="text-xs text-slate-500 animate-fade-in">
                                {feedbackMap[rec.id] === 'good' ? '已标记喜欢' : feedbackMap[rec.id] === 'bad' ? '已标记不感兴趣' : '已记录'}
                              </span>
                            ) : null}
                            <button
                              onClick={() => handleFeedback(rec.id, 'good')}
                              disabled={feedbackLoading === rec.id || !!feedbackMap[rec.id]}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all ${
                                feedbackMap[rec.id] === 'good'
                                  ? 'bg-emerald-100 text-emerald-600'
                                  : 'hover:bg-slate-100 text-slate-400 hover:text-emerald-500'
                              } disabled:opacity-50`}
                              title="喜欢这个推荐"
                            >
                              {feedbackMap[rec.id] === 'good' ? '👍' : '👍'}
                            </button>
                            <button
                              onClick={() => handleFeedback(rec.id, 'neutral')}
                              disabled={feedbackLoading === rec.id || !!feedbackMap[rec.id]}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all ${
                                feedbackMap[rec.id] === 'neutral'
                                  ? 'bg-slate-100 text-slate-600'
                                  : 'hover:bg-slate-100 text-slate-400 hover:text-slate-600'
                              } disabled:opacity-50`}
                              title="一般"
                            >
                              😐
                            </button>
                            <button
                              onClick={() => handleFeedback(rec.id, 'bad')}
                              disabled={feedbackLoading === rec.id || !!feedbackMap[rec.id]}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all ${
                                feedbackMap[rec.id] === 'bad'
                                  ? 'bg-red-100 text-red-500'
                                  : 'hover:bg-slate-100 text-slate-400 hover:text-red-500'
                              } disabled:opacity-50`}
                              title="不感兴趣"
                            >
                              👎
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 下一步提示 */}
            <div className="mt-8 bg-gradient-to-r from-indigo-50 to-violet-50 rounded-2xl p-6 border border-indigo-100/50">
              <h3 className="text-sm font-bold text-indigo-800 mb-2">下一步建议</h3>
              <ul className="text-sm text-indigo-700/80 space-y-1.5">
                <li>选择你感兴趣的推荐，点击「生成脚本」获取完整拍摄方案</li>
                <li>点击 👍 👎 给反馈，Agent 会学习你的偏好</li>
                <li>拍完视频后记录实际数据，推荐会越来越精准</li>
              </ul>
            </div>
          </section>
        )}

        {/* ─── 空状态 ─── */}
        {!loading && recommendations.length === 0 && (
          <section className="mt-16 text-center animate-fade-in">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 mx-auto mb-6 flex items-center justify-center text-white text-3xl shadow-lg shadow-indigo-500/20">
              AI
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              店播 AI Agent
            </h2>
            <p className="text-slate-500 max-w-md mx-auto leading-relaxed">
              我是你的智能短视频获客助手，能帮你分析热点趋势、推荐适合的选题、生成完整的拍摄脚本，并持续学习优化。
            </p>

            <div className="grid sm:grid-cols-3 gap-4 mt-10 max-w-2xl mx-auto">
              {[
                { title: '智能推荐', desc: '基于热点和季节推荐选题' },
                { title: 'AI 脚本', desc: '自动生成口播文案和分镜' },
                { title: '持续优化', desc: '从反馈中学习越用越准' },
              ].map((f, i) => (
                <div key={i} className="bg-white rounded-xl border border-slate-200/80 p-5 text-left hover:shadow-md hover:border-indigo-200 transition-all">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold mb-3">
                    {i + 1}
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">{f.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </section>
        )}
        </>)}

        {/* ════════════════════════════════════════════
            搜索热点 Tab
            ════════════════════════════════════════════ */}
        {tab === 'search' && (
          <div className="animate-fade-in">
            {/* 搜索栏 */}
            <div className="bg-white rounded-2xl p-4 mb-6 border border-slate-200/80 shadow-sm flex gap-3">
              <div className="flex-1 relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                  placeholder="搜索抖音热点，例如：补水、美甲、健身..."
                  className="w-full pl-10 pr-4 h-11 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 focus:bg-white outline-none transition-all"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={searchLoading || !searchKeyword.trim()}
                className="px-6 h-11 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm shrink-0"
              >
                {searchLoading ? '搜索中...' : '搜索热点'}
              </button>
            </div>

            {/* 搜索结果概览 */}
            {searchResult && (
              <div className="mb-4 flex items-center gap-3 text-sm text-slate-500 animate-fade-in">
                <span>搜索 &ldquo;<strong className="text-slate-700">{searchResult.keyword}</strong>&rdquo;</span>
                <span className="w-px h-4 bg-slate-200" />
                <span>{searchResult.topics.length} 个相关话题</span>
                <span className="w-px h-4 bg-slate-200" />
                <span>{searchResult.videos.length} 条热门视频</span>
              </div>
            )}

            {/* Loading 骨架 */}
            {searchLoading && (
              <div className="space-y-3 mb-6">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-white border border-slate-200/80 animate-shimmer" style={{ animationDelay: `${i * 80}ms` }}>
                    <div className="w-8 h-8 rounded-lg bg-slate-100 shrink-0" />
                    <div className="flex-1">
                      <div className="h-5 w-48 rounded bg-slate-100 mb-2" />
                      <div className="h-3 w-32 rounded bg-slate-50" />
                    </div>
                    <div className="h-9 w-24 rounded-xl bg-indigo-50 shrink-0" />
                  </div>
                ))}
              </div>
            )}

            {/* 热搜话题列表 */}
            {!searchLoading && hotTopics.length > 0 && (
              <div className="mb-8">
                <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <span>🔥</span>
                  {searchResult ? '相关热点话题' : '抖音热搜榜'}
                </h3>
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm divide-y divide-slate-100 overflow-hidden">
                  {hotTopics.map((topic) => {
                    const rankColor = topic.rank <= 3
                      ? ['text-red-500', 'text-orange-500', 'text-amber-500'][topic.rank - 1]
                      : 'text-slate-400';
                    return (
                      <div key={topic.rank} className="flex items-center gap-4 p-4 hover:bg-slate-50/50 transition group">
                        <span className={`text-lg font-bold w-8 text-center ${rankColor}`}>{topic.rank}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-slate-900 text-sm truncate">{topic.keyword}</span>
                            <span className="shrink-0 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[11px] font-medium">{topic.category}</span>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-slate-400">
                            <span>🔥 {formatNumber(topic.heatValue)} 热度</span>
                            {topic.videoCount != null && <span>📹 {formatNumber(topic.videoCount)} 条视频</span>}
                          </div>
                        </div>
                        <button
                          onClick={() => handleGenerateScriptFromTopic(topic)}
                          className="shrink-0 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 transition-all shadow-sm"
                        >
                          生成脚本
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 相关热门视频 */}
            {!searchLoading && searchResult && searchResult.videos.length > 0 && (
              <div className="mb-8">
                <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <span>📹</span>
                  相关热门视频
                </h3>
                <div className="grid md:grid-cols-2 gap-3">
                  {searchResult.videos.map((video) => (
                    <div key={video.id} className="bg-white rounded-xl p-4 border border-slate-200/80 hover:border-indigo-200 transition shadow-sm">
                      <h4 className="font-semibold text-slate-800 text-sm mb-2 line-clamp-2">{video.title}</h4>
                      <p className="text-[11px] text-slate-400 mb-3">@{video.author} · {video.createTime}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-400 mb-3">
                        <span>▶ {formatNumber(video.playCount)}</span>
                        <span>❤ {formatNumber(video.likeCount)}</span>
                        <span>💬 {formatNumber(video.commentCount)}</span>
                        <span>↗ {formatNumber(video.shareCount)}</span>
                        <span>⏱ {video.duration}s</span>
                      </div>
                      <button
                        onClick={() => {
                          const rec: FinalRecommendation = {
                            id: `vid_${video.id}_${Date.now()}`,
                            topic: video.title,
                            contentType: 'knowledge',
                            title: video.title,
                            reason: `@${video.author} 的热门视频 · ${formatNumber(video.playCount)} 播放 · ${formatNumber(video.likeCount)} 赞`,
                            expectedOutcome: { views: video.playCount, inquiries: Math.round(video.likeCount * 0.05), confidence: 0.8 },
                            difficulty: 'medium',
                            estimatedTime: Math.round(video.duration / 60 * 10) / 10,
                            confidence: 0.8,
                            needsConfirmation: false,
                          };
                          setSelectedRecommendation(rec);
                        }}
                        className="w-full py-2 rounded-lg text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition"
                      >
                        参考此视频生成脚本
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 搜索无结果 */}
            {!searchLoading && topicsLoaded && hotTopics.length === 0 && searchResult && (
              <div className="bg-white rounded-2xl p-8 text-center border border-slate-200/80 animate-fade-in">
                <p className="text-slate-500 text-sm">没有找到与 &ldquo;{searchResult.keyword}&rdquo; 相关的热搜话题，换个关键词试试？</p>
              </div>
            )}

            {/* 空状态 */}
            {!searchLoading && !topicsLoaded && hotTopics.length === 0 && (
              <section className="mt-8 text-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-100 to-red-100 mx-auto mb-6 flex items-center justify-center">
                  <span className="text-4xl">🔥</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">搜索抖音热点</h2>
                <p className="text-slate-500 max-w-md mx-auto leading-relaxed text-sm">
                  输入关键词搜索抖音热搜话题，找到当前最热门的内容方向，一键生成拍摄脚本。
                </p>
              </section>
            )}
          </div>
        )}
      </main>

      {/* ════════ ScriptModal ════════ */}
      {selectedRecommendation && (
        <ScriptModal
          recommendation={selectedRecommendation}
          industry={industry}
          businessName={businessName}
          onClose={() => setSelectedRecommendation(null)}
        />
      )}

      {/* ════════ OnboardingModal ════════ */}
      {showOnboarding && user && (
        <OnboardingModal
          user={user}
          onComplete={() => setShowOnboarding(false)}
        />
      )}

      {/* ════════ Footer ════════ */}
      <footer className="border-t border-slate-200/60 py-5">
        <p className="text-center text-xs text-slate-400">
          店播 AI Agent V2.0 — 让每个本地商家都能轻松获客
        </p>
      </footer>
    </div>
  );
}
