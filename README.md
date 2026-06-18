<div align="center">

# 店播AI Agent 🤖

智能短视频获客助手，基于 Next.js 16 + Supabase + 通义千问

[![Cloudflare Pages](https://img.shields.io/badge/Cloudflare-Pages-blue?logo=cloudflare)](https://pages.cloudflare.com/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

[演示地址](https://dianbo-agent.pages.dev) · [部署文档](#-部署) · [功能说明](#-功能特性)

</div>

---

## ✨ 功能特性

### 🎯 智能推荐
- 多维度评分算法
- 行业热点话题推荐
- 季节性内容推荐
- 基于历史表现的智能排序

### 📝 AI 脚本生成
- 集成通义千问大模型
- 一键生成短视频脚本
- 支持多种内容风格
- 可自定义行业模板

### 👥 用户系统
- Supabase 认证
- 内容发布历史
- 用户偏好记录
- 反馈学习机制

### 📊 抖音热点数据
- 实时热点榜单
- 热点关键词分析
- 相关视频推荐
- 一键生成脚本

---

## 🛠 技术栈

| 技术 | 说明 |
|------|------|
| **框架** | Next.js 16 (App Router) |
| **语言** | TypeScript 5.x |
| **样式** | Tailwind CSS 4 |
| **数据库/认证** | Supabase |
| **AI 模型** | 通义千问 (DashScope) |
| **部署** | Cloudflare Pages / Vercel / 腾讯云 Docker |
| **部署工具** | OpenNext + Wrangler |

---

## 🚀 部署

### 方式一：Cloudflare Pages（推荐，国内可访问）

点击按钮一键部署：

[![Deploy to Cloudflare Pages](https://deploy.workers.cloudflare.com/button)](https://dash.cloudflare.com/?to=/:account/pages/new/provider/github)

详细步骤请查看 [Cloudflare部署指南.md](./Cloudflare部署指南.md)

### 方式二：腾讯云 Docker 部署（国内速度最快）

详细步骤请查看 [腾讯云快速部署指南.md](./腾讯云快速部署指南.md)

```bash
# 使用国内优化版，速度提升 5-10 倍
docker-compose -f docker-compose.cn.yml up -d --build
```

### 方式三：Vercel 部署（最快，但国内需翻墙）

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/sskks/customer-agent)

---

## 💻 本地开发

### 前置要求

- Node.js 20+
- npm 9+

### 快速开始

```bash
# 1. 克隆项目
git clone https://github.com/sskks/customer-agent.git
cd dianbo-agent

# 2. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local，填入你的 API Key

# 3. 安装依赖
npm install

# 4. 启动开发服务器
npm run dev
```

访问 http://localhost:3000 即可看到应用。

### 环境变量配置

```env
# 通义千问 API Key（必需）
QWEN_API_KEY=your-api-key-here

# Supabase 配置（必需）
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# 抖音热点 API Key（可选）
DOUYIN_HOT_API_KEY=your-api-key
```

---

## 📁 项目结构

```
dianbo-agent/
├── app/                    # Next.js App Router
│   ├── api/               # API 路由
│   ├── page.tsx           # 首页
│   └── layout.tsx         # 根布局
├── lib/                    # 核心库
│   ├── recommendationEngine.ts  # 推荐引擎
│   ├── scriptGenerator.ts       # 脚本生成器
│   ├── douyinService.ts         # 抖音热点服务
│   ├── feedbackEngine.ts        # 反馈学习引擎
│   └── types.ts                 # 类型定义
├── components/             # React 组件
├── public/                 # 静态资源
└── ... 配置文件
```

---

## 🔧 配置

### 获取 API Key

1. **通义千问**：https://dashscope.console.aliyun.com/
2. **Supabase**：https://supabase.com/dashboard/
3. **抖音热点**（可选）：https://xxapi.cn/

---

## 📈 路线图

- [x] MVP 核心推荐功能
- [x] AI 脚本生成集成
- [x] 用户系统 + 数据持久化
- [x] 反馈学习机制
- [x] 抖音热点数据集成
- [ ] 多语言支持
- [ ] 数据可视化仪表盘
- [ ] 团队协作功能
- [ ] API 开放平台

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

---

<div align="center">

**如果这个项目对你有帮助，欢迎给个 ⭐ Star！**

Made with ❤️ by sskks

</div>