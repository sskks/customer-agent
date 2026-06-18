'use client';

import { useState } from 'react';

interface ShareButtonProps {
  title: string;
  text: string;
  url?: string;
}

export default function ShareButton({ title, text, url }: ShareButtonProps) {
  const [showMenu, setShowMenu] = useState(false);
  const hasNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const shareData = {
    title,
    text,
    url: url || (typeof window !== 'undefined' ? window.location.href : ''),
  };

  const copyToClipboard = () => {
    const content = `${title}\n\n${text}\n\n${shareData.url}`;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(content).then(() => {
        alert('已复制到剪贴板！');
        setShowMenu(false);
      }).catch(() => {
        alert('复制失败，请手动复制');
      });
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('分享失败:', err);
      }
    } else {
      copyToClipboard();
    }
  };

  const shareToWeChat = () => {
    copyToClipboard();
    alert('内容已复制，请打开微信粘贴发送给朋友或朋友圈');
  };

  const shareToWeibo = () => {
    const weiboUrl = `https://service.weibo.com/share/share.php?url=${encodeURIComponent(shareData.url)}&title=${encodeURIComponent(title + ' - ' + text)}`;
    window.open(weiboUrl, '_blank', 'width=600,height=400');
  };

  const shareToQQ = () => {
    const qqUrl = `https://connect.qq.com/widget/shareqq/index.html?url=${encodeURIComponent(shareData.url)}&title=${encodeURIComponent(title)}&desc=${encodeURIComponent(text)}`;
    window.open(qqUrl, '_blank', 'width=600,height=400');
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 px-4 py-2 bg-white text-indigo-600 border border-indigo-200 rounded-xl hover:bg-indigo-50 transition-colors font-medium text-sm"
      >
        <span>📤</span>
        <span>分享</span>
      </button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />

          <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 z-50 animate-fade-in">
            <div className="py-2">
              {hasNativeShare && (
                <button
                  onClick={handleNativeShare}
                  className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"
                >
                  <span>📲</span>
                  <span>系统分享</span>
                </button>
              )}

              <button
                onClick={shareToWeChat}
                className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"
              >
                <span>💬</span>
                <span>微信分享</span>
              </button>

              <button
                onClick={shareToWeibo}
                className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"
              >
                <span>❤️</span>
                <span>新浪微博</span>
              </button>

              <button
                onClick={shareToQQ}
                className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"
              >
                <span>🐧</span>
                <span>QQ空间</span>
              </button>

              <div className="border-t border-slate-100 my-1" />

              <button
                onClick={copyToClipboard}
                className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"
              >
                <span>📋</span>
                <span>复制链接</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
