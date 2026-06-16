'use client';

import { useState } from 'react';

interface ShareButtonProps {
  title: string;
  text: string;
  url?: string;
}

export default function ShareButton({ title, text, url }: ShareButtonProps) {
  const [showMenu, setShowMenu] = useState(false);

  const shareData = {
    title: title,
    text: text,
    url: url || window.location.href,
  };

  // 使用原生 Web Share API（移动端优先支持）
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('分享失败:', err);
      }
    } else {
      // 降级到复制链接
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    const content = `${title}\n\n${text}\n\n${shareData.url}`;
    navigator.clipboard.writeText(content).then(() => {
      alert('已复制到剪贴板！');
      setShowMenu(false);
    }).catch(() => {
      alert('复制失败，请手动复制');
    });
  };

  // 分享到微信（生成二维码提示）
  const shareToWeChat = () => {
    copyToClipboard();
    alert('内容已复制，请打开微信粘贴发送给朋友或朋友圈');
  };

  // 分享到微博
  const shareToWeibo = () => {
    const weiboUrl = `https://service.weibo.com/share/share.php?url=${encodeURIComponent(shareData.url)}&title=${encodeURIComponent(title + ' - ' + text)}`;
    window.open(weiboUrl, '_blank', 'width=600,height=400');
  };

  // 分享到QQ
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
          {/* 遮罩层 */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />
          
          {/* 分享菜单 */}
          <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 z-50 animate-fade-in">
            <div className="py-2">
              {navigator.share && (
                <button
                  onClick={handleNativeShare}
                  className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"
                >
                  <span>📱</span>
                  <span>系统分享</span>
                </button>
              )}
              
              <button
                onClick={shareToWeChat}
                className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"
              >
                <span>💚</span>
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
                <span>💙</span>
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
