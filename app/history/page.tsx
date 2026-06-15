'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

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

export default function HistoryPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [contents, setContents] = useState<ContentRecord[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editMetrics, setEditMetrics] = useState({ views: 0, inquiries: 0 });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const supabase = createClient();

  const loadContents = async () => {
    try {
      const { data, error } = await supabase
        .from('content_records')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data) setContents(data as ContentRecord[]);
    } catch (err) {
      console.error('加载内容失败:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) loadContents();
      else setLoading(false);
    });
  }, []);

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

      if (error) throw error;

      // 刷新业务指标
      if (user) {
        await supabase.rpc('refresh_business_metrics', { p_user_id: user.id });
      }

      setMessage('效果数据已记录！Agent 会据此优化下次推荐');
      setEditingId(null);
      setTimeout(() => setMessage(''), 3000);
      loadContents();
    } catch (err) {
      console.error('保存失败:', err);
      setMessage('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const getContentTypeLabel = (type: string) =>
    ({ customer_case: '顾客案例', knowledge: '知识科普', environment_tour: '店内环境', promotion: '促销活动', behind_scenes: '幕后花絮', product_showcase: '产品展示' }[type] || type);

  const getStatusLabel = (status: string) =>
    ({ draft: '草稿', filming: '拍摄中', published: '已发布', archived: '已归档' }[status] || status);

  const getStatusColor = (status: string) =>
    ({ draft: 'bg-slate-100 text-slate-600', filming: 'bg-amber-100 text-amber-700', published: 'bg-emerald-100 text-emerald-700', archived: 'bg-slate-100 text-slate-500' }[status] || 'bg-slate-100 text-slate-600');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 mb-4">请先登录</p>
          <a href="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">去登录</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/70 backdrop-blur-md border-b border-slate-200/60">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-amber-400" />
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-sm font-bold shadow-sm">A</div>
              <div>
                <h1 className="text-[15px] font-bold text-slate-900 leading-tight">店播 AI Agent</h1>
                <p className="text-[11px] text-slate-400">智能短视频获客助手</p>
              </div>
            </a>
          </div>
          <div className="flex items-center gap-4">
            <a href="/" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">← 返回首页</a>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h2 className="text-xl font-bold text-slate-900">内容效果追踪</h2>
          <p className="text-sm text-slate-500 mt-1">
            录入你发布的视频实际数据，Agent 会学习并优化下次推荐
          </p>
        </div>

        {message && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-3 rounded-xl animate-fade-in">
            {message}
          </div>
        )}

        {contents.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
            <div className="text-5xl mb-4">📊</div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">还没有内容记录</h3>
            <p className="text-sm text-slate-500 mb-6">
              先生成推荐和脚本，拍摄完成后在这里录入效果数据
            </p>
            <a href="/" className="text-indigo-600 hover:text-indigo-700 font-medium text-sm">去生成推荐</a>
          </div>
        ) : (
          <div className="space-y-4">
            {contents.map((content) => (
              <div key={content.id} className="bg-white rounded-2xl border border-slate-200/80 p-6 hover:shadow-md transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[11px] font-medium text-violet-600 bg-violet-50 px-2.5 py-0.5 rounded-full">
                        {getContentTypeLabel(content.content_type)}
                      </span>
                      <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full ${getStatusColor(content.status)}`}>
                        {getStatusLabel(content.status)}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-1">{content.title}</h3>
                    <p className="text-sm text-slate-500">{content.topic}</p>

                    {/* 已录入的指标 */}
                    {content.status === 'published' && (
                      <div className="mt-3 flex gap-4 text-sm">
                        <span className="text-slate-500">
                          播放 <span className="font-semibold text-slate-700">{(content.metrics.views || 0).toLocaleString()}</span>
                        </span>
                        <span className="text-slate-500">
                          咨询 <span className="font-semibold text-slate-700">{content.metrics.inquiries || 0} 个</span>
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex-shrink-0">
                    {editingId === content.id ? (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">实际播放量</label>
                          <input
                            type="number"
                            value={editMetrics.views}
                            onChange={(e) => setEditMetrics((prev) => ({ ...prev, views: parseInt(e.target.value) || 0 }))}
                            className="w-28 h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 outline-none"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">实际咨询量</label>
                          <input
                            type="number"
                            value={editMetrics.inquiries}
                            onChange={(e) => setEditMetrics((prev) => ({ ...prev, inquiries: parseInt(e.target.value) || 0 }))}
                            className="w-28 h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 outline-none"
                            placeholder="0"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSave(content.id)}
                            disabled={saving}
                            className="h-9 px-4 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                          >
                            {saving ? '保存中...' : '保存'}
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="h-9 px-4 text-slate-500 hover:text-slate-700 rounded-lg text-sm"
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
                        className="h-9 px-4 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
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
