import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "店播AI Agent - 智能短视频获客助手",
    template: "%s | 店播AI Agent"
  },
  description: "专为本地商家设计的AI短视频内容推荐与脚本生成平台。基于抖音热点趋势，自动生成行业定制化拍摄脚本，帮助美容院、酒吧、餐厅等本地商家轻松获客。",
  keywords: [
    "短视频营销",
    "AI脚本生成",
    "本地商家获客",
    "抖音热点",
    "店播助手",
    "美容院营销",
    "酒吧营销",
    "餐饮营销",
    "健身营销",
    "内容创作工具"
  ],
  authors: [{ name: "店播AI团队" }],
  creator: "店播AI Agent",
  publisher: "店播AI Agent",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://dianbo-agent-nextjs.netlify.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: '/',
    title: '店播AI Agent - 智能短视频获客助手',
    description: '专为本地商家设计的AI短视频内容推荐与脚本生成平台',
    siteName: '店播AI Agent',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: '店播AI Agent - 智能短视频获客助手',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '店播AI Agent - 智能短视频获客助手',
    description: '专为本地商家设计的AI短视频内容推荐与脚本生成平台',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
