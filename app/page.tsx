
'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import OnboardingModal from '@/components/OnboardingModal';
import ShareButton from '@/components/ShareButton';
import { createClient } from '@/lib/supabase/client';
import type { HotTopic, SearchResult } from '@/lib/douyinService';
import type { GeneratedScript } from '@/lib/scriptGenerator';
import type { FinalRecommendation } from '@/lib/types';
import { repairData } from '@/lib/textRepair';

type TabMode = 'recommend' | 'search';
type FeedbackValue = 'good' | 'neutral' | 'bad';

interface FeedbackInsight {
  totalFeedback: number;
  satisfaction: number;
  suggestions: string[];
}

interface ScriptModalProps {
  recommendation: FinalRecommendation;
  industry: string;
  businessName: string;
  onClose: () => void;
}

function formatNumber(value: number): string {
  if (value >= 10000) {
    return String((value / 10000).toFixed(1)) + 'w';
  }

  return value.toLocaleString();
}

function getContentTypeLabel(contentType: string): string {
  const labels: Record<string, string> = {
    customer_case: '客户案例',
    knowledge: '知识科普',
    environment_tour: '环境展示',
    promotion: '促销活动',
    behind_scenes: '幕后花絮',
    product_showcase: '产品展示',
  };

  return labels[contentType] || contentType;
}

function getDifficultyLabel(difficulty: string): string {
  const labels: Record<string, string> = {
    easy: '简单',
    medium: '中等',
    hard: '困难',
  };

  return labels[difficulty] || difficulty;
}

function getDifficultyColor(difficulty: string): string {
  const colors: Record<string, string> = {
    easy: 'bg-emerald-100 text-emerald-700',
    medium: 'bg-amber-100 text-amber-700',
    hard: 'bg-rose-100 text-rose-700',
  };

  return colors[difficulty] || 'bg-slate-100 text-slate-700';
}

function ScriptModal({ recommendation, industry, businessName, onClose }: ScriptModalProps) {
  const [loading, setLoading] = useState(true);
  const [script, setScript] = useState<GeneratedScript | null>(null);
  const [error, setError] = useState('');

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
      if (!response.ok || !result.success) {
        setScript(null);
        setError(result.error || '脚本生成失败，请稍后重试');
        return;
      }

      setScript(result.data.script);
    } catch (requestError) {
      console.error('Generate script failed:', requestError);
      setScript(null);
      setError('网络异常，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [businessName, industry, recommendation.contentType, recommendation.topic]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void generateScript();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [generateScript]);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 px-4 py-6 backdrop-blur-sm" onClick={onClose}>
      <div
        className="max-h-[88vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">脚本生成结果</h2>
            <p className="mt-1 text-sm text-slate-500">{recommendation.title}</p>
          </div>
          <button onClick={onClose} className="rounded-lg px-3 py-2 text-sm text-slate-500 transition hover:bg-slate-100 hover:text-slate-700">
            关闭
          </button>
        </div>

        <div className="max-h-[calc(88vh-72px)] overflow-y-auto px-6 py-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
              <p className="text-base font-medium text-slate-900">正在生成脚本</p>
              <p className="mt-2 text-sm text-slate-500">通常需要几秒钟，请稍候。</p>
            </div>
          ) : null}

          {!loading && error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
              <p className="text-base font-medium text-rose-700">{error}</p>
              <button onClick={() => void generateScript()} className="mt-4 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700">
                重试
              </button>
            </div>
          ) : null}

          {!loading && script ? (
            <div className="space-y-6">
              <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">标题</p>
                    <p className="mt-1 text-sm font-medium text-slate-900">{script.title}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">时长</p>
                    <p className="mt-1 text-sm font-medium text-slate-900">{script.duration} 秒</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">镜头数</p>
                    <p className="mt-1 text-sm font-medium text-slate-900">{script.sceneBreakdown.length}</p>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-sm font-semibold text-slate-900">开场钩子</h3>
                <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-slate-800">{script.hookLine}</p>
              </section>

              <section>
                <h3 className="text-sm font-semibold text-slate-900">口播文案</h3>
                <div className="mt-2 whitespace-pre-wrap rounded-xl border border-slate-200 bg-white p-4 text-sm leading-7 text-slate-700">{script.mainContent}</div>
              </section>

              <section>
                <h3 className="text-sm font-semibold text-slate-900">行动号召</h3>
                <p className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-7 text-slate-800">{script.callToAction}</p>
              </section>

              <section>
                <h3 className="text-sm font-semibold text-slate-900">分镜脚本</h3>
                <div className="mt-3 space-y-3">
                  {script.sceneBreakdown.map((scene) => (
                    <div key={scene.sceneNumber} className="rounded-xl border border-slate-200 bg-white p-4">
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-sm font-semibold text-slate-900">镜头 {scene.sceneNumber}</p>
                        <p className="text-xs text-slate-500">{scene.duration} 秒</p>
                      </div>
                      <div className="mt-3 space-y-2 text-sm text-slate-700">
                        <p><span className="font-medium text-slate-900">画面：</span>{scene.visual}</p>
                        <p><span className="font-medium text-slate-900">台词：</span>{scene.audio}</p>
                        {scene.notes ? <p><span className="font-medium text-slate-900">备注：</span>{scene.notes}</p> : null}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-sm font-semibold text-slate-900">拍摄建议</h3>
                <ul className="mt-3 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  {script.shootingTips.map((tip, index) => (
                    <li key={tip + index}>- {tip}</li>
                  ))}
                </ul>
              </section>

              <div className="flex flex-wrap gap-3 border-t border-slate-200 pt-4">
                <button
                  onClick={() => {
                    const text = script.title + '\n\n' + script.mainContent + '\n\n' + script.callToAction;
                    void navigator.clipboard.writeText(text);
                  }}
                  className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
                >
                  复制文案
                </button>
                <button
                  onClick={() => {
                    const sceneText = script.sceneBreakdown
                      .map((scene) => '镜头 ' + scene.sceneNumber + ' (' + scene.duration + 's)\n画面: ' + scene.visual + '\n台词: ' + scene.audio + (scene.notes ? '\n备注: ' + scene.notes : ''))
                      .join('\n\n');
                    const blob = new Blob([script.title + '\n\n' + sceneText], { type: 'text/plain;charset=utf-8' });
                    const blobUrl = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = blobUrl;
                    link.download = script.title + '.txt';
                    link.click();
                    URL.revokeObjectURL(blobUrl);
                  }}
                  className="rounded-xl border border-indigo-200 bg-white px-4 py-2.5 text-sm font-medium text-indigo-600 transition hover:bg-indigo-50"
                >
                  下载 TXT
                </button>
                <ShareButton title={script.title} text={script.hookLine + '\n\n' + script.mainContent.slice(0, 120) + '...'} url={typeof window !== 'undefined' ? window.location.href : ''} />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<FinalRecommendation[]>([]);
  const [industry, setIndustry] = useState('beauty');
  const [businessName, setBusinessName] = useState('');
  const [selectedRecommendation, setSelectedRecommendation] = useState<FinalRecommendation | null>(null);
  const [feedbackInsight, setFeedbackInsight] = useState<FeedbackInsight | null>(null);
  const [feedbackMap, setFeedbackMap] = useState<Record<string, FeedbackValue>>({});
  const [feedbackLoading, setFeedbackLoading] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [supabase] = useState(() => createClient());
  const [tab, setTab] = useState<TabMode>('recommend');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [hotTopics, setHotTopics] = useState<HotTopic[]>([]);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [topicsLoaded, setTopicsLoaded] = useState(false);

  const loadProfile = useCallback(async (userId?: string) => {
    try {
      const profileUserId = userId ?? (await supabase.auth.getUser()).data.user?.id;
      if (!profileUserId) {
        return;
      }

      const { data: profile, error } = await supabase.from('profiles').select('*').eq('id', profileUserId).maybeSingle();
      if (error) {
        console.error('Load profile failed:', error);
        return;
      }

      if (!profile) {
        setShowOnboarding(true);
        return;
      }

      setIndustry(profile.industry || 'beauty');
      setBusinessName(profile.business_name || '');
      setShowOnboarding(!profile.industry || !profile.business_name);
    } catch (profileError) {
      console.error('Load profile failed:', profileError);
    }
  }, [supabase]);

  useEffect(() => {
    let active = true;

    void supabase.auth.getUser().then(({ data: { user: currentUser } }) => {
      if (!active) {
        return;
      }

      setUser(currentUser);
      setAuthLoading(false);
      if (currentUser) {
        void loadProfile(currentUser.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) {
        return;
      }

      setUser(session?.user ?? null);
      setAuthLoading(false);
      if (session?.user) {
        void loadProfile(session.user.id);
      } else {
        setShowOnboarding(false);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [loadProfile, supabase]);

  const handleTabChange = useCallback(async (nextTab: TabMode) => {
    setTab(nextTab);

    if (nextTab !== 'search' || topicsLoaded || searchLoading) {
      return;
    }

    setSearchLoading(true);
    try {
      const response = await fetch('/api/trending');
      const result = await response.json();
      if (response.ok && result.success) {
        setHotTopics(repairData(result.data.topics || []));
        setTopicsLoaded(true);
      }
    } catch (requestError) {
      console.error('Load trending failed:', requestError);
    } finally {
      setSearchLoading(false);
    }
  }, [searchLoading, topicsLoaded]);

  const handleSearch = useCallback(async () => {
    const keyword = searchKeyword.trim();
    if (!keyword) {
      return;
    }

    setSearchLoading(true);
    setSearchResult(null);

    try {
      const response = await fetch('/api/trending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword }),
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setSearchResult(repairData(result.data));
        setHotTopics(repairData(result.data.topics || []));
        setTopicsLoaded(true);
      }
    } catch (requestError) {
      console.error('Search trending failed:', requestError);
    } finally {
      setSearchLoading(false);
    }
  }, [searchKeyword]);

  const handleGenerateScriptFromTopic = useCallback((topic: HotTopic) => {
    setSelectedRecommendation({
      id: 'topic-' + topic.rank + '-' + Date.now(),
      topic: topic.keyword,
      contentType: 'knowledge',
      title: topic.keyword,
      reason: '热榜第 ' + topic.rank + ' 名 · 热度 ' + formatNumber(topic.heatValue) + ' · ' + topic.category,
      expectedOutcome: {
        views: Math.round(2000 + topic.heatValue / 10000),
        inquiries: Math.round(5 + topic.heatValue / 50000),
        confidence: 0.85,
      },
      difficulty: 'medium',
      estimatedTime: 1.5,
      confidence: 0.85,
      needsConfirmation: false,
    });
  }, []);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRecommendations([]);
    setFeedbackMap({});
    setFeedbackInsight(null);
  }, [supabase]);

  const handleFeedback = useCallback(async (recommendationId: string, feedback: FeedbackValue) => {
    setFeedbackLoading(recommendationId);
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'submit', recommendationId, feedback }),
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setFeedbackMap((current) => ({ ...current, [recommendationId]: feedback }));
      }
    } catch (requestError) {
      console.error('Submit feedback failed:', requestError);
    } finally {
      setFeedbackLoading(null);
    }
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!businessName.trim()) {
      alert('请输入店铺名称');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ industry, businessName }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        alert(result.error || '生成失败，请稍后重试');
        return;
      }

      setRecommendations(repairData(result.data.recommendations || []));
      setFeedbackInsight(result.data.feedbackInsight || null);
    } catch (requestError) {
      console.error('Generate recommendations failed:', requestError);
      alert('生成失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [businessName, industry]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-sm font-bold text-white">AI</div>
            <div>
              <h1 className="text-sm font-semibold text-slate-900">店播 AI Agent</h1>
              <p className="text-xs text-slate-500">本地商家短视频选题与脚本助手</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {user ? <Link href="/history" className="text-sm font-medium text-indigo-600 transition hover:text-indigo-700">效果追踪</Link> : null}
            {authLoading ? (
              <div className="h-5 w-20 animate-pulse rounded bg-slate-200" />
            ) : user ? (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs font-medium text-slate-700">{user.user_metadata?.full_name || user.email?.split('@')[0]}</p>
                  <p className="text-[10px] text-slate-400">{user.email}</p>
                </div>
                <button onClick={() => void handleLogout()} className="rounded-lg px-3 py-1.5 text-xs text-slate-500 transition hover:bg-slate-100 hover:text-slate-700">退出</button>
              </div>
            ) : (
              <Link href="/login" className="rounded-xl px-4 py-2 text-sm font-medium text-indigo-600 transition hover:bg-indigo-50 hover:text-indigo-700">登录 / 注册</Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8 flex w-fit gap-1 rounded-xl bg-slate-100 p-1">
          <button onClick={() => void handleTabChange('recommend')} className={`rounded-lg px-5 py-2 text-sm font-medium transition ${tab === 'recommend' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>今日推荐</button>
          <button onClick={() => void handleTabChange('search')} className={`rounded-lg px-5 py-2 text-sm font-medium transition ${tab === 'search' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>搜索热点</button>
        </div>

        {tab === 'recommend' ? (
          <div className="space-y-8">
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="p-6 sm:p-8">
                <h2 className="text-lg font-semibold text-slate-900">告诉我你的业务信息</h2>
                <p className="mt-1 text-sm text-slate-500">填写行业和店铺名称，系统会生成更贴近业务场景的短视频推荐。</p>
                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">行业</label>
                    <input type="text" value={industry} onChange={(event) => setIndustry(event.target.value)} placeholder="例如：美容院、餐饮店、健身房" className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20" />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">店铺名称</label>
                    <input type="text" value={businessName} onChange={(event) => setBusinessName(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { void handleGenerate(); } }} placeholder="例如：美丽美容院" className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20" />
                  </div>
                </div>
                <button onClick={() => void handleGenerate()} disabled={loading} className="mt-6 h-12 w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-sm font-semibold text-white transition hover:from-indigo-700 hover:to-violet-700 disabled:cursor-not-allowed disabled:opacity-60">{loading ? '生成中...' : '生成今日推荐'}</button>
              </div>
            </section>

            {loading ? (
              <section className="space-y-4">
                {[0, 1, 2].map((item) => (
                  <div key={item} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="h-5 w-32 animate-pulse rounded bg-slate-200" />
                    <div className="mt-4 h-4 w-3/4 animate-pulse rounded bg-slate-100" />
                    <div className="mt-3 h-4 w-2/3 animate-pulse rounded bg-slate-100" />
                  </div>
                ))}
              </section>
            ) : null}

            {!loading && feedbackInsight && feedbackInsight.totalFeedback > 0 ? (
              <section className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-violet-50 p-5">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-sm font-semibold text-indigo-900">学习洞察</h3>
                  <span className="text-xs text-indigo-600">已分析 {feedbackInsight.totalFeedback} 条反馈</span>
                  <span className="text-xs text-indigo-600">满意度 {(feedbackInsight.satisfaction * 100).toFixed(0)}%</span>
                </div>
                <div className="mt-3 space-y-1 text-sm text-indigo-800">
                  {feedbackInsight.suggestions.map((item) => <p key={item}>- {item}</p>)}
                </div>
              </section>
            ) : null}

            {!loading && recommendations.length > 0 ? (
              <section>
                <div className="mb-5">
                  <h2 className="text-xl font-semibold text-slate-900">推荐结果</h2>
                  <p className="mt-1 text-sm text-slate-500">结合热点趋势、季节特征和你的业务信息生成。</p>
                </div>
                <div className="space-y-4">
                  {recommendations.map((recommendation, index) => (
                    <div key={recommendation.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-indigo-200 hover:shadow-md">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="mb-3 flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-600">#{index + 1}</span>
                            <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-[11px] font-medium text-violet-600">{getContentTypeLabel(recommendation.contentType)}</span>
                            {recommendation.needsConfirmation ? <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-700">建议确认后执行</span> : null}
                          </div>
                          <h3 className="text-base font-semibold text-slate-900">{recommendation.title}</h3>
                          <p className="mt-2 text-sm leading-6 text-slate-500">{recommendation.reason}</p>
                          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                            <span>播放 <span className="font-semibold text-slate-700">{recommendation.expectedOutcome.views.toLocaleString()}</span></span>
                            <span>咨询 <span className="font-semibold text-slate-700">{recommendation.expectedOutcome.inquiries}</span></span>
                            <span>难度 <span className={`${getDifficultyColor(recommendation.difficulty)} rounded px-1.5 py-0.5 font-medium`}>{getDifficultyLabel(recommendation.difficulty)}</span></span>
                            <span>耗时 <span className="font-semibold text-slate-700">{recommendation.estimatedTime}h</span></span>
                            <span>置信度 <span className="font-semibold text-slate-700">{(recommendation.confidence * 100).toFixed(0)}%</span></span>
                          </div>
                        </div>
                        <button onClick={() => setSelectedRecommendation(recommendation)} className="h-10 rounded-xl bg-indigo-600 px-5 text-sm font-medium text-white transition hover:bg-indigo-700">生成脚本</button>
                      </div>

                      {user ? (
                        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                          <span className="text-xs text-slate-500">这条推荐是否有帮助？</span>
                          <div className="flex items-center gap-2">
                            {(['good', 'neutral', 'bad'] as FeedbackValue[]).map((value) => (
                              <button
                                key={value}
                                onClick={() => void handleFeedback(recommendation.id, value)}
                                disabled={feedbackLoading === recommendation.id || Boolean(feedbackMap[recommendation.id])}
                                className={`${feedbackMap[recommendation.id] === value ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'} rounded-lg px-3 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50`}
                              >
                                {value === 'good' ? '喜欢' : value === 'neutral' ? '一般' : '不感兴趣'}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {!loading && recommendations.length === 0 ? (
              <section className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-lg font-semibold text-white">AI</div>
                <h2 className="mt-5 text-xl font-semibold text-slate-900">店播 AI Agent</h2>
                <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-500">输入行业和店铺名称后，系统会给出更适合你业务的短视频选题，并支持继续生成拍摄脚本。</p>
              </section>
            ) : null}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(event) => setSearchKeyword(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      void handleSearch();
                    }
                  }}
                  placeholder="搜索抖音热点，例如：补水、美甲、健身"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <button
                onClick={() => void handleSearch()}
                disabled={searchLoading || !searchKeyword.trim()}
                className="h-11 shrink-0 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 text-sm font-semibold text-white transition hover:from-indigo-700 hover:to-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {searchLoading ? '搜索中...' : '搜索热点'}
              </button>
            </div>

            {searchResult ? (
              <div className="text-sm text-slate-500">
                搜索 “<span className="font-medium text-slate-700">{searchResult.keyword}</span>”，找到 {searchResult.topics.length} 个相关热点和 {searchResult.videos.length} 条参考视频。
              </div>
            ) : null}

            {searchLoading ? (
              <div className="space-y-3">
                {[0, 1, 2].map((item) => (
                  <div key={item} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="h-5 w-40 animate-pulse rounded bg-slate-200" />
                    <div className="mt-3 h-4 w-60 animate-pulse rounded bg-slate-100" />
                  </div>
                ))}
              </div>
            ) : null}

            {!searchLoading && hotTopics.length > 0 ? (
              <section>
                <h2 className="mb-3 text-base font-semibold text-slate-900">热点话题</h2>
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  {hotTopics.map((topic) => (
                    <div key={String(topic.rank) + topic.keyword} className="flex flex-col gap-4 border-b border-slate-100 p-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3">
                          <span className="w-8 text-center text-lg font-semibold text-slate-400">{topic.rank}</span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">{topic.keyword}</p>
                            <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
                              <span>{topic.category}</span>
                              <span>热度 {formatNumber(topic.heatValue)}</span>
                              {topic.videoCount ? <span>视频 {formatNumber(topic.videoCount)}</span> : null}
                            </div>
                          </div>
                        </div>
                      </div>
                      <button onClick={() => handleGenerateScriptFromTopic(topic)} className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-indigo-700">生成脚本</button>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {!searchLoading && searchResult && searchResult.videos.length > 0 ? (
              <section>
                <h2 className="mb-3 text-base font-semibold text-slate-900">参考视频</h2>
                <div className="grid gap-3 md:grid-cols-2">
                  {searchResult.videos.map((video) => (
                    <div key={video.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                      <h3 className="line-clamp-2 text-sm font-semibold text-slate-900">{video.title}</h3>
                      <p className="mt-2 text-xs text-slate-500">@{video.author} · {video.createTime}</p>
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500">
                        <span>播放 {formatNumber(video.playCount)}</span>
                        <span>点赞 {formatNumber(video.likeCount)}</span>
                        <span>评论 {formatNumber(video.commentCount)}</span>
                        <span>分享 {formatNumber(video.shareCount)}</span>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedRecommendation({
                            id: 'video-' + video.id + '-' + Date.now(),
                            topic: video.title,
                            contentType: 'knowledge',
                            title: video.title,
                            reason: '参考视频 @' + video.author + ' · 播放 ' + formatNumber(video.playCount),
                            expectedOutcome: {
                              views: video.playCount,
                              inquiries: Math.max(1, Math.round(video.likeCount * 0.05)),
                              confidence: 0.8,
                            },
                            difficulty: 'medium',
                            estimatedTime: Math.max(1, Math.round((video.duration / 60) * 10) / 10),
                            confidence: 0.8,
                            needsConfirmation: false,
                          });
                        }}
                        className="mt-4 rounded-lg bg-indigo-50 px-4 py-2 text-xs font-medium text-indigo-600 transition hover:bg-indigo-100"
                      >
                        参考此视频生成脚本
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {!searchLoading && hotTopics.length === 0 && !searchResult ? (
              <section className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                <h2 className="text-xl font-semibold text-slate-900">搜索抖音热点</h2>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500">你可以直接查看系统加载的热榜，也可以输入关键词搜索更垂直的热点话题，再基于热点生成脚本。</p>
              </section>
            ) : null}
          </div>
        )}
      </main>

      {selectedRecommendation ? <ScriptModal recommendation={selectedRecommendation} industry={industry} businessName={businessName} onClose={() => setSelectedRecommendation(null)} /> : null}
      {showOnboarding && user ? <OnboardingModal user={user} onComplete={() => { setShowOnboarding(false); void loadProfile(user.id); }} /> : null}
    </div>
  );
}
