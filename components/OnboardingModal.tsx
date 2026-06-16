'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface OnboardingModalProps {
  user: User | null;
  onComplete: () => void;
}

type Step = 'welcome' | 'industry' | 'business' | 'complete';

export default function OnboardingModal({ user, onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState<Step>('welcome');
  const [industry, setIndustry] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  // 常见行业列表
  const industries = [
    { value: '美容', label: ' 美容美发', desc: '美容院、美甲店、理发店等' },
    { value: '酒吧', label: '🍷 酒吧酒馆', desc: '清吧、夜店、鸡尾酒吧等' },
    { value: '餐饮', label: ' 餐饮服务', desc: '餐厅、咖啡馆、奶茶店等' },
    { value: '健身', label: '💪 健身运动', desc: '健身房、瑜伽馆、舞蹈室等' },
    { value: '咖啡', label: '☕ 咖啡茶饮', desc: '咖啡店、茶馆、甜品店等' },
    { value: '教育', label: '📚 教育培训', desc: '培训机构、早教中心、兴趣班等' },
    { value: '宠物', label: '🐾 宠物服务', desc: '宠物店、宠物医院、宠物美容等' },
    { value: '酒店', label: ' 酒店民宿', desc: '酒店、民宿、度假村等' },
  ];

  useEffect(() => {
    // ESC 键关闭
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onComplete();
    };
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [onComplete]);

  const handleSaveProfile = async () => {
    if (!user || !industry.trim() || !businessName.trim()) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          industry,
          business_name: businessName,
          updated_at: new Date().toISOString(),
        });

      if (!error) {
        setStep('complete');
        setTimeout(onComplete, 1500);
      } else {
        console.error('保存资料失败:', error);
        alert('保存失败，请重试');
      }
    } catch (err) {
      console.error('保存资料异常:', err);
      alert('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const renderWelcome = () => (
    <div className="text-center py-8">
      <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-500 mx-auto mb-6 flex items-center justify-center text-white text-4xl shadow-lg shadow-indigo-500/30 animate-bounce-gentle">
        🎉
      </div>
      <h2 className="text-2xl font-bold text-slate-900 mb-3">欢迎使用店播 AI Agent！</h2>
      <p className="text-slate-600 max-w-md mx-auto leading-relaxed">
        我是你的智能短视频获客助手，能帮你分析热点趋势、推荐适合的选题、生成完整的拍摄脚本。
      </p>
      
      <div className="mt-8 grid grid-cols-3 gap-4 max-w-lg mx-auto">
        {[
          { icon: '🔥', title: '智能推荐', desc: '基于热点和季节推荐选题' },
          { icon: '️', title: 'AI 脚本', desc: '自动生成口播文案和分镜' },
          { icon: '📊', title: '持续优化', desc: '从反馈中学习越用越准' },
        ].map((item, i) => (
          <div key={i} className="bg-slate-50 rounded-xl p-4 border border-slate-200/50">
            <div className="text-2xl mb-2">{item.icon}</div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">{item.title}</h3>
            <p className="text-xs text-slate-500">{item.desc}</p>
          </div>
        ))}
      </div>

      <button
        onClick={() => setStep('industry')}
        className="mt-8 px-8 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-violet-700 transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
      >
        开始设置 →
      </button>
    </div>
  );

  const renderIndustrySelection = () => (
    <div className="py-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-slate-900 mb-2">选择你的行业</h2>
        <p className="text-sm text-slate-500">这将帮助我们为你生成更精准的推荐内容</p>
      </div>

      <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2">
        {industries.map((ind) => (
          <button
            key={ind.value}
            onClick={() => {
              setIndustry(ind.value);
              setStep('business');
            }}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              industry === ind.value
                ? 'border-indigo-500 bg-indigo-50 shadow-md'
                : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
            }`}
          >
            <div className="font-bold text-slate-900 mb-1">{ind.label}</div>
            <div className="text-xs text-slate-500">{ind.desc}</div>
          </button>
        ))}
      </div>

      <div className="mt-6 flex justify-between">
        <button
          onClick={() => setStep('welcome')}
          className="px-6 py-2.5 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
        >
          ← 返回
        </button>
        <button
          onClick={() => setStep('business')}
          disabled={!industry.trim()}
          className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          下一步 →
        </button>
      </div>
    </div>
  );

  const renderBusinessInput = () => (
    <div className="py-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-slate-900 mb-2">输入店铺名称</h2>
        <p className="text-sm text-slate-500">例如：美丽美容院、夜色酒吧、XX餐厅</p>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-semibold text-slate-700 mb-2">已选行业</label>
        <div className="px-4 py-3 bg-indigo-50 rounded-xl border border-indigo-200 text-indigo-700 font-medium">
          {industries.find(i => i.value === industry)?.label || industry}
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-semibold text-slate-700 mb-2">店铺名称</label>
        <input
          type="text"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && businessName.trim()) {
              handleSaveProfile();
            }
          }}
          placeholder="请输入你的店铺名称"
          className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-base text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 focus:bg-white outline-none transition-all"
          autoFocus
        />
      </div>

      <div className="flex justify-between">
        <button
          onClick={() => setStep('industry')}
          className="px-6 py-2.5 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
        >
          ← 返回
        </button>
        <button
          onClick={handleSaveProfile}
          disabled={!businessName.trim() || saving}
          className="px-8 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-violet-700 transition-all shadow-md shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
        >
          {saving ? '保存中...' : '完成设置 ✓'}
        </button>
      </div>
    </div>
  );

  const renderComplete = () => (
    <div className="text-center py-12">
      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 mx-auto mb-6 flex items-center justify-center text-white text-4xl shadow-lg shadow-emerald-500/30 animate-bounce-gentle">
        ✓
      </div>
      <h2 className="text-2xl font-bold text-slate-900 mb-3">设置完成！</h2>
      <p className="text-slate-600">
        现在你可以开始生成专属的短视频脚本了
      </p>
      <p className="text-sm text-slate-400 mt-4">即将自动跳转...</p>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)' }}
      onClick={onComplete}
    >
      <div
        className="animate-modal-in bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold shadow-md">
              {step === 'welcome' ? '👋' : step === 'industry' ? '🏢' : step === 'business' ? '' : '✨'}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {step === 'welcome' && '欢迎使用'}
                {step === 'industry' && '选择行业'}
                {step === 'business' && '输入信息'}
                {step === 'complete' && '设置完成'}
              </h2>
              <p className="text-xs text-slate-500">
                {step === 'welcome' && '首次使用向导'}
                {step === 'industry' && '第 1/2 步'}
                {step === 'business' && '第 2/2 步'}
                {step === 'complete' && '准备就绪'}
              </p>
            </div>
          </div>
          
          {/* Progress indicator */}
          <div className="flex items-center gap-1.5">
            {['welcome', 'industry', 'business', 'complete'].map((s, i) => (
              <div
                key={s}
                className={`h-2 rounded-full transition-all ${
                  ['welcome', 'industry', 'business', 'complete'].indexOf(step) >= i
                    ? 'w-6 bg-indigo-500'
                    : 'w-2 bg-slate-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {step === 'welcome' && renderWelcome()}
          {step === 'industry' && renderIndustrySelection()}
          {step === 'business' && renderBusinessInput()}
          {step === 'complete' && renderComplete()}
        </div>
      </div>
    </div>
  );
}
