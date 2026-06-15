'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

function LoginForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const action = isLogin ? 'signin' : 'signup';

      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          email,
          password,
          full_name: fullName,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error || '操作失败');
        return;
      }

      if (!isLogin) {
        setMessage(result.message || '注册成功！正在跳转...');
        // 注册成功后等 2 秒再跳转（Supabase 可能需要时间完成触发器）
        setTimeout(() => router.push(redirect), 1500);
      } else {
        router.push(redirect);
      }
    } catch (err) {
      console.error('认证错误:', err);
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-indigo-500/20">
            A
          </div>
          <h1 className="text-2xl font-bold text-slate-900">店播 AI Agent</h1>
          <p className="text-sm text-slate-500 mt-1">智能短视频获客助手</p>
        </div>

        {/* 表单卡片 */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-8">
          {/* 切换标签 */}
          <div className="flex mb-8 bg-slate-100 rounded-xl p-1">
            <button
              onClick={() => { setIsLogin(true); setError(''); setMessage(''); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isLogin
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              登录
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(''); setMessage(''); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                !isLogin
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              注册
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 注册时显示姓名 */}
            {!isLogin && (
              <div className="animate-slide-up">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  姓名 / 昵称
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="你的名字"
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 focus:bg-white outline-none transition-all"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                邮箱
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
                className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 focus:bg-white outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                密码
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="至少 6 位"
                className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 focus:bg-white outline-none transition-all"
              />
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            {/* 成功提示 */}
            {message && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-3 rounded-xl">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-semibold text-sm hover:from-indigo-700 hover:to-violet-700 transition-all shadow-md shadow-indigo-500/20 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99]"
            >
              {loading ? '处理中...' : isLogin ? '登录' : '注册'}
            </button>
          </form>

          {/* 底部提示 */}
          <p className="text-center text-xs text-slate-400 mt-6">
            {isLogin ? '还没有账号？' : '已有账号？'}
            <button
              onClick={() => { setIsLogin(!isLogin); setError(''); setMessage(''); }}
              className="text-indigo-600 hover:text-indigo-700 font-medium ml-1"
            >
              {isLogin ? '立即注册' : '去登录'}
            </button>
          </p>
        </div>

        {/* 底部信息 */}
        <p className="text-center text-xs text-slate-400 mt-6">
          注册即表示同意服务条款和隐私政策
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
