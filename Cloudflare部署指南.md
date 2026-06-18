# 店播AI Agent - Cloudflare Pages 部署指南 🚀

**国内可访问，免费额度，自动部署**

---

## 📋 部署方式（两种选其一）

### 方式一：Wrangler CLI 本地部署（推荐，最快）

适合本地开发，直接部署。

#### 前置准备

1. 注册 Cloudflare 账号：https://dash.cloudflare.com/
2. 创建 Pages 项目

#### 部署步骤

```powershell
# 1. 安装 Wrangler CLI
npm install -g wrangler

# 2. 登录 Cloudflare
npx wrangler login

# 3. 构建 Next.js 应用（使用 OpenNext）
npm run pages:build

# 4. 部署到 Cloudflare Pages
npm run pages:deploy
```

首次部署时会提示创建项目，按提示操作即可。

---

### 方式二：GitHub 自动部署（推荐，最省心）

每次提交代码自动部署。

#### 第一步：在 Cloudflare 创建 Pages 项目

1. 打开 https://dash.cloudflare.com/
2. 点击左侧「Workers & Pages」
3. 点击「Create application」→「Pages」
4. 选择「Connect to Git」
5. 授权并选择你的 `customer-agent` 仓库
6. 点击「Begin setup」

#### 第二步：配置构建设置

| 配置项 | 值 |
|--------|-----|
| **Project name** | `dianbo-agent` |
| **Production branch** | `main` 或 `master` |
| **Build command** | `npx @opennextjs/cloudflare` |
| **Build output directory** | `.open-next` |

#### 第三步：配置环境变量（重要！）

在「Environment variables (advanced)」部分，点击「Add variable」添加以下变量：

| 变量名 | 值 | 环境 |
|--------|-----|------|
| `QWEN_API_KEY` | `sk-80d2d09cff77454c8aab0f416a6f61ad` | Production |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://zqwvmfncajrvafnfbfre.supabase.co` | Production + Preview |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Production + Preview |
| `DOUYIN_HOT_API_KEY` | `a3e1f9175744cfa4` | Production |
| `NODE_VERSION` | `20` | Production + Preview |

⚠️ **重要**：勾选「Encrypt」加密敏感变量

#### 第四步：开始部署

点击「Save and Deploy」

等待 3-5 分钟，部署完成后会获得一个访问地址：
```
https://dianbo-agent.pages.dev
```

---

## ✅ 部署成功后

### 访问你的应用

Cloudflare Pages 会给你一个默认域名：
```
https://[项目名].pages.dev
```

国内可以直接访问，无需翻墙！

### 配置自定义域名（可选）

1. 在 Pages 项目设置中，点击「Custom domains」
2. 点击「Set up a custom domain」
3. 输入你的域名（如 `dianbo.yourdomain.com`）
4. 按提示配置 DNS 解析
5. Cloudflare 会自动申请 SSL 证书

---

## 🔧 本地调试 Cloudflare Pages

```powershell
# 安装依赖
npm install

# 使用 OpenNext 构建
npm run pages:build

# 本地预览（模拟 Cloudflare Pages 环境）
npm run preview
```

---

## 📊 Cloudflare Pages 免费额度

| 项目 | 免费额度 |
|------|----------|
| 构建次数 | 500 次/月 |
| 带宽 | 无限 |
| 请求数 | 1000 万次/月 |
| Functions 执行时间 | 10 万 CPU 秒/月 |
| KV 存储 | 1 GB |

个人使用完全够用！

---

## ❓ 常见问题

### Q: 构建失败，提示内存不足？

A: Cloudflare Pages 构建有 8GB 内存限制，Next.js 16 构建通常没问题，如遇问题可：
1. 本地构建后用 `wrangler pages deploy` 上传
2. 减少构建时的并行数

### Q: API 路由不工作？

A: 确保使用的是 Next.js App Router，OpenNext 对 Pages Router 支持有限。本项目用的是 App Router，没问题。

### Q: 国内访问速度慢？

A: Cloudflare 在国内有节点，速度比 Vercel 快很多。如果还不够快：
1. 配置中国加速域名（需要企业版）
2. 或配合腾讯云 CDN 加速

### Q: 如何更新环境变量？

1. 在 Cloudflare Pages 项目设置 → 环境变量
2. 修改后需要重新部署才会生效

---

## 📝 部署检查清单

- [ ] Cloudflare 账号已注册
- [ ] GitHub 仓库代码已上传
- [ ] Pages 项目已创建
- [ ] 构建命令配置正确：`npx @opennextjs/cloudflare`
- [ ] 输出目录：`.open-next`
- [ ] 环境变量已配置（4 个 Key）
- [ ] 首次部署成功
- [ ] 可以访问 `*.pages.dev`
- [ ] 推荐功能测试正常
- [ ] 脚本生成功能测试正常

---

## 🔗 相关链接

- Cloudflare Dashboard: https://dash.cloudflare.com/
- OpenNext Cloudflare 文档: https://opennext.js.org/cloudflare
- Next.js 16 文档: https://nextjs.org/docs

---

**祝部署顺利！🎉**