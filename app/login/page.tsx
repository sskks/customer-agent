'use client'

import { useState } from 'react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('error')
  const [supabase, setSupabase] = useState<any>(null)

  // 延迟初始化 Supabase 客户端（避免 SSR 问题）
  const getClient = async () => {
    if (supabase) return supabase
    const { createClient } = await import('@/lib/supabase/client')
    const client = createClient()
    setSupabase(client)
    return client
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const client = await getClient()
    const { error } = await client.auth.signInWithPassword({ email, password })

    if (error) {
      setMessageType('error')
      setMessage(error.message === 'Invalid login credentials' ? '邮箱或密码错误' : error.message)
    } else {
      window.location.href = '/'
    }
    setLoading(false)
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const client = await getClient()
    const { error } = await client.auth.signUp({ email, password })

    if (error) {
      setMessageType('error')
      setMessage(error.message)
    } else {
      setMessageType('success')
      setMessage('注册成功！请查收邮箱中的确认链接完成验证。')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xl font-bold mx-auto mb-4">
            AI
          </div>
          <h1 className="text-2xl font-bold text-slate-900">店播AI Agent</h1>
          <p className="text-slate-500 text-sm mt-1">智能短视频获客助手</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl p-8 border border-slate-100" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 6px 24px rgba(0,0,0,0.03)' }}>
          <h2 className="text-xl font-bold text-slate-900 mb-6">
            {mode === 'login' ? '登录' : '注册'}
          </h2>

          <form onSubmit={mode === 'login' ? handleLogin : handleSignup}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-600 mb-2">邮箱</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-600 mb-2">密码</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={mode === 'signup' ? '至少6位密码' : '输入密码'}
                required
                minLength={6}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition"
              />
            </div>

            {message && (
              <div className={`mb-4 p-3 rounded-xl text-sm ${
                messageType === 'success'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-red-50 text-red-600 border border-red-200'
              }`}>
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ boxShadow: '0 4px 14px rgba(99,102,241,0.3)' }}
            >
              {loading ? '处理中...' : mode === 'login' ? '登录' : '注册'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setMessage('') }}
              className="text-sm text-indigo-500 hover:text-indigo-700 transition"
            >
              {mode === 'login' ? '没有账号？立即注册' : '已有账号？去登录'}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          店播AI Agent v0.5 &mdash; 让每个本地商家都能轻松获客
        </p>
      </div>
    </div>
  )
}
