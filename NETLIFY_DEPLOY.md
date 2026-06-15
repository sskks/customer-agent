# Netlify vs Vercel 部署对比

## 📊 快速对比表

| 特性 | Vercel | Netlify |
|------|--------|---------|
| **Next.js 支持** | ⭐⭐⭐⭐⭐ 官方维护，完美支持 | ⭐⭐⭐⭐ 通过插件支持 |
| **部署速度** | 极快（优化更好） | 快 |
| **免费额度** | 100GB 带宽/月 | 100GB 带宽/月 |
| **环境变量** | ✅ 支持 | ✅ 支持 |
| **Serverless Functions** | ✅ 原生支持 | ✅ 支持 |
| **Edge Functions** | ✅ 原生支持 | ✅ 支持 |
| **自定义域名** | ✅ 免费 SSL | ✅ 免费 SSL |
| **预览部署** | ✅ 每个 PR 自动部署 | ✅ 每个 PR 自动部署 |
| **分析工具** | ✅ 内置 Web Vitals | ✅ 内置分析 |
| **学习曲线** | 简单 | 简单 |
| **适合项目** | Next.js 首选 | 通用静态/混合站点 |

---

## 🎯 推荐选择

### 选择 Vercel 如果：
- ✅ 你使用的是 Next.js（Vercel 是 Next.js 的创造者）
- ✅ 想要最佳的 Server-Side Rendering 性能
- ✅ 需要 Image Optimization 功能
- ✅ 希望零配置部署

### 选择 Netlify 如果：
- ✅ 你已经在使用 Netlify 管理其他项目
- ✅ 需要更丰富的插件生态系统
- ✅ 喜欢 Netlify 的表单处理功能
- ✅ 团队已经熟悉 Netlify 工作流

---

## 🚀 Netlify 部署步骤

### 方法一：通过 GitHub 连接（推荐）

#### 1. 准备代码仓库
```bash
# 如果还没有 Git 仓库
git init
git add .
git commit -m "Initial commit"

# 推送到 GitHub
git remote add origin https://github.com/你的用户名/dianbo-agent.git
git push -u origin main
```

#### 2. 在 Netlify 创建新站点
1. 访问 https://app.netlify.com/
2. 点击 **"Add new site"** → **"Import an existing project"**
3. 选择 **GitHub** 并授权
4. 选择你的 `dianbo-agent` 仓库
5. 配置构建设置：
   - **Branch to deploy**: `main`
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
6. 点击 **"Deploy site"**

#### 3. 安装 Next.js 插件
Netlify 会自动检测并使用 `@netlify/plugin-nextjs`，但你可以手动确保：

```bash
npm install --save-dev @netlify/plugin-nextjs
```

#### 4. 配置环境变量
在 Netlify 控制台：
1. 进入 **Site settings** → **Environment variables**
2. 添加以下变量：
   ```
   QWEN_API_KEY = sk-你的密钥
   NEXT_PUBLIC_SUPABASE_URL = https://你的项目ID.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = 你的anon密钥
   DOUYIN_HOT_API_KEY = (可选)
   ```
3. 点击 **"Save"**
4. **重新部署**：进入 **Deploys** → 点击最新部署 → **"Trigger deploy"** → **"Clear cache and deploy site"**

---

### 方法二：通过 Netlify CLI（快速测试）

#### 1. 安装 Netlify CLI
```bash
npm install -g netlify-cli
```

#### 2. 登录 Netlify
```bash
netlify login
```

#### 3. 初始化站点
```bash
netlify init
```
- 选择 **"Create & configure a new site"**
- 输入站点名称（可选，留空自动生成）
- 选择团队（如果有多个）

#### 4. 设置环境变量
```bash
netlify env:set QWEN_API_KEY "sk-你的密钥"
netlify env:set NEXT_PUBLIC_SUPABASE_URL "https://你的项目ID.supabase.co"
netlify env:set NEXT_PUBLIC_SUPABASE_ANON_KEY "你的anon密钥"
```

#### 5. 部署
```bash
# 预览部署（生成临时 URL）
netlify deploy

# 生产部署（绑定正式域名）
netlify deploy --prod
```

---

## ⚠️ Netlify 部署注意事项

### 1. Next.js 版本兼容性
- Netlify 插件支持 Next.js 13-16
- 你的项目使用 Next.js 16.2.9 ✅ 兼容

### 2. Server-Side Rendering (SSR)
- Netlify 通过 AWS Lambda 函数处理 SSR
- API 路由会自动转换为 serverless functions
- **限制**：Lambda 函数最大执行时间 10 秒（默认），可升级到 26 秒

### 3. 图片优化
- Netlify 不支持 Next.js Image Optimization API
- **解决方案**：
  - 使用外部图片服务（Cloudinary、Imgix）
  - 或在 `next.config.ts` 中禁用：
    ```typescript
    const nextConfig = {
      images: {
        unoptimized: true,
      },
    };
    ```

### 4. 中间件（Middleware）
- 你的项目有 `middleware.ts`
- Netlify 插件会自动将其转换为 Edge Function
- **注意**：Edge Function 有 50ms CPU 时间限制

### 5. 构建输出
确保 `netlify.toml` 中配置正确：
```toml
[build]
  command = "npm run build"
  publish = ".next"
```

---

## 🔧 故障排查

### 问题 1：部署失败，提示 "Missing build directory"
**原因**：`.next` 目录未生成  
**解决**：
```bash
# 本地测试构建
npm run build

# 确认 .next 目录存在后重新部署
```

### 问题 2：运行时错误 "Cannot find module '@supabase/ssr'"
**原因**：依赖未正确安装  
**解决**：
```bash
# 清理并重新安装
rm -rf node_modules package-lock.json
npm install
git add package-lock.json
git commit -m "Update lock file"
git push
```

### 问题 3：API 调用返回 500 错误
**原因**：环境变量未配置  
**解决**：
1. 在 Netlify UI 检查环境变量是否正确设置
2. 确保没有多余的空格或引号
3. 重新触发部署使环境变量生效

### 问题 4：页面加载缓慢
**原因**：Lambda 冷启动  
**解决**：
- 升级到 Netlify Pro（保持 warm 实例）
- 或优化函数执行时间（减少依赖、缓存结果）

---

## 💰 成本对比

### Vercel Hobby（免费）
- 100GB 带宽/月
- 1000 小时 Serverless Function 执行时间/月
- 无限站点
- 自动 HTTPS

### Netlify Starter（免费）
- 100GB 带宽/月
- 125,000 请求/月（Serverless Functions）
- 无限站点
- 自动 HTTPS

**对于 MVP 阶段**：两者免费额度都足够使用。

---

## 🎯 最终建议

### 如果你是第一次部署 Next.js 项目
👉 **选择 Vercel**
- 零配置，开箱即用
- 最佳性能和兼容性
- 更好的错误提示和调试工具

### 如果你已经熟悉 Netlify
👉 **选择 Netlify**
- 统一的工作流
- 丰富的插件生态
- 表单处理、身份验证等额外功能

### 我的推荐
由于你的项目是 **Next.js 16**，我**强烈推荐使用 Vercel**，因为：
1. Vercel 是 Next.js 的创造者，支持最完善
2. Server-Side Rendering 性能更好
3. Image Optimization 原生支持
4. 中间件（middleware）无需转换
5. 部署速度更快，错误更少

但如果你更喜欢 Netlify 的界面或有其他项目在 Netlify 上管理，Netlify 也完全可以胜任！

---

## 📝 快速决策

回答以下问题：

1. **这是你第一个 Next.js 项目吗？**
   - 是 → 选 Vercel
   - 否，我有经验 → 继续

2. **你已经在用 Netlify 管理其他项目吗？**
   - 是 → 选 Netlify（统一管理更方便）
   - 否 → 继续

3. **你需要 Image Optimization 功能吗？**
   - 是 → 选 Vercel
   - 否 → 都可以

4. **你更看重什么？**
   - 性能和易用性 → Vercel
   - 插件生态和灵活性 → Netlify

---

**无论选择哪个平台，项目都能正常运行！** 🚀
