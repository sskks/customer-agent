'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

interface ContentRecord {
  id: string;
  topic: string;
  content_type: string;
  title: string;
  status: string;
  metrics: { views: number; likes: number; comments: number; inquiries: number };
  created_at: string;
  published_at?: string;
}

const CONTENT_TYPE_LABELS: Record<string, string> = {
  customer_case: '客户案例',
  knowledge: '知识科普',
  environment_tour: '门店环境',
  promotion: '促销活动',
  behind_scenes: '幕后花絮',
  product_showcase: '产品展示',
};

const STATUS_LABELS: Record<string, string> = {
  draft: '草稿',
  filming: '拍摄中',
  published: '已发布',
  archived: '已归档',
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-600',
  filming: 'bg-amber-100 text-amber-700',
  published: 'bg-emerald-100 text-emerald-700',
  archived: 'bg-slate-100 text-slate-500',
};

export default function HistoryPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [contents, setContents] = useState<ContentRecord[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editMetrics, setEditMetrics] = useState({ views: 0, inquiries: 0 });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [supabase] = useState(() => createClient());

  const loadContents = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('content_records')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data) {
        setContents(data as ContentRecord[]);
      }
    } catch (requestError) {
      console.error('Load content records failed:', requestError);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    let active = true;

    void supabase.auth.getUser().then(({ data: { user: currentUser } }) => {
      if (!active) {
        return;
      }

      setUser(currentUser);
      if (currentUser) {
        void loadContents();
      } else {
        setLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, [loadContents, supabase]);

  const handleSave = async (id: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('content_records')
        .update({
          metrics: editMetrics,
          status: 'published',
          published_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        throw error;
      }

      if (user) {
        await supabase.rpc('refresh_business_metrics', { p_user_id: user.id });
      }

      setMessage('效果数据已记录，系统会据此优化下一次推荐。');
      setEditingId(null);
      setTimeout(() => setMessage(''), 3000);
      void loadContents();
    } catch (requestError) {
      console.error('Save content metrics failed:', requestError);
      setMessage('保存失败，请稍后重试。');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="mb-4 text-slate-600">请先登录后查看内容效果追踪</p>
          <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-700">
            去登录
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200/60 bg-white/70 backdrop-blur-md">
        <div className="absolute left-0 right-0 top-0 h-0.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-amber-400" />
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-bold text-white shadow-sm">
              AI
            </div>
            <div>
              <h1 className="text-[15px] font-bold leading-tight text-slate-900">店播 AI Agent</h1>
              <p className="text-[11px] text-slate-400">智能短视频获客助手</p>
            </div>
          </Link>
          <Link href="/" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
            返回首页
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8">
          <h2 className="text-xl font-bold text-slate-900">内容效果追踪</h2>
          <p className="mt-1 text-sm text-slate-500">
            录入你已发布视频的真实效果数据，系统会据此学习并优化下一次推荐。
          </p>
        </div>

        {message ? (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 animate-fade-in">
            {message}
          </div>
        ) : null}

        {contents.length === 0 ? (
          <div className="rounded-2xl border border-slate-200/80 bg-white p-12 text-center">
            <div className="mb-4 text-5xl">AI</div>
            <h3 className="mb-2 text-lg font-semibold text-slate-900">还没有内容记录</h3>
            <p className="mb-6 text-sm text-slate-500">
              先生成推荐和脚本，发布内容后再回来录入效果数据。
            </p>
            <Link href="/" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
              去生成推荐
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {contents.map((content) => (
              <div
                key={content.id}
                className="rounded-2xl border border-slate-200/80 bg-white p-6 transition-all hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-[11px] font-medium text-violet-600">
                        {CONTENT_TYPE_LABELS[content.content_type] || content.content_type}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                          STATUS_COLORS[content.status] || 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {STATUS_LABELS[content.status] || content.status}
                      </span>
                    </div>
                    <h3 className="mb-1 text-base font-bold text-slate-900">{content.title}</h3>
                    <p className="text-sm text-slate-500">{content.topic}</p>

                    {content.status === 'published' ? (
                      <div className="mt-3 flex gap-4 text-sm">
                        <span className="text-slate-500">
                          播放 <span className="font-semibold text-slate-700">{(content.metrics.views || 0).toLocaleString()}</span>
                        </span>
                        <span className="text-slate-500">
                          咨询 <span className="font-semibold text-slate-700">{content.metrics.inquiries || 0} 条</span>
                        </span>
                      </div>
                    ) : null}
                  </div>

                  <div className="flex-shrink-0">
                    {editingId === content.id ? (
                      <div className="space-y-3">
                        <div>
                          <label className="mb-1 block text-xs text-slate-500">实际播放量</label>
                          <input
                            type="number"
                            value={editMetrics.views}
                            onChange={(event) => setEditMetrics((current) => ({
                              ...current,
                              views: parseInt(event.target.value, 10) || 0,
                            }))}
                            className="h-9 w-28 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs text-slate-500">实际咨询量</label>
                          <input
                            type="number"
                            value={editMetrics.inquiries}
                            onChange={(event) => setEditMetrics((current) => ({
                              ...current,
                              inquiries: parseInt(event.target.value, 10) || 0,
                            }))}
                            className="h-9 w-28 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30"
                            placeholder="0"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSave(content.id)}
                            disabled={saving}
                            className="h-9 rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
                          >
                            {saving ? '保存中...' : '保存'}
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="h-9 rounded-lg px-4 text-sm text-slate-500 hover:text-slate-700"
                          >
                            取消
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingId(content.id);
                          setEditMetrics({
                            views: content.metrics?.views || 0,
                            inquiries: content.metrics?.inquiries || 0,
                          });
                        }}
                        className="h-9 rounded-lg bg-slate-100 px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200"
                      >
                        {content.status === 'published' ? '修改数据' : '录入数据'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
