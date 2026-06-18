import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Docker standalone 模式必需
  output: 'standalone',
  // 生产环境压缩优化
  compress: true,
  // 国内 CDN 资源优化（可选）
  // assetPrefix: process.env.NODE_ENV === 'production' ? 'https://your-cdn.com' : undefined,
};

export default nextConfig;