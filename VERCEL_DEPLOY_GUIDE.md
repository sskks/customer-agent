# Vercel 部署指南

## 🎯 快速开始（3 分钟部署）

### 选项 A：通过 Web 界面（最简单，推荐）

1. **访问**: https://vercel.com/new
2. **拖拽上传**: 将整个项目文件夹拖拽到浏览器窗口
3. **等待部署**: Vercel 会自动构建并部署
4. **配置环境变量**: 
   - 进入项目 → Settings → Environment Variables
   - 添加以下变量（见下方列表）
5. **重新部署**: Deployments → Redeploy

### 选项 B：通过 GitHub（适合持续更新）

```bash
# 1. 创建 GitHub 仓库后推送
git remote add origin https://github.com/你的用户名/dianbo-agent.git
git push -u origin main

# 2. 访问 https://vercel.com/new 导入仓库
# 3. Vercel 会自动检测 Next.js 并部署
# 4. 配置环境变量后重新部署
```

---

## 🔑 必需的环境变量

在 Vercel 控制台 → Settings → Environment Variables 中添加：

```
QWEN_API_KEY=sk-80d2d09cff77454c8aab0f416a6f61ad
NEXT_PUBLIC_SUPABASE_URL=https://zqwvmfncajrvafnfbfre.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpxd3ZtZm5jYWpydmFmbmZiZnJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0NzQ1NzQsImV4cCI6MjA5NzA1MDU3NH0.omVfUcf9y4JuWGhVaLeD-aGq6I-8WeXBF8N8KYRVI1Y
```

**可选变量**（不配置时使用模拟数据）：
```
DOUYIN_HOT_API_KEY=你的xxapi.cn密钥
```

---

## ⚠️ 部署前检查清单

- [ ] 已在 Supabase 执行数据库迁移脚本（移除 industry CHECK 约束）
- [ ] 已确认 `.env.local` 中的 Supabase 密钥有效
- [ ] 已确认 Qwen API Key 有效
- [ ] 本地运行 `npm run build` 成功

---

## 🔍 部署后验证

访问你的部署 URL（如 `https://dianbo-agent.vercel.app`），按以下顺序测试：

1. **首页加载** - 应正常显示
2. **用户注册** - 填写邮箱密码，应注册成功
3. **生成推荐** - 输入行业和店铺名，应显示 5 条推荐
4. **搜索热点** - 切换到搜索标签，输入关键词，应返回结果
5. **生成脚本** - 点击推荐的"生成脚本"按钮，应显示完整脚本
6. **提交反馈** - 点击 👍 或 👎，应显示"已记录"

---

## 🐛 常见问题

### 问题 1：部署失败 "Build failed"
**原因**: 依赖安装失败或 TypeScript 错误  
**解决**:
```bash
# 本地测试构建
npm run build

# 如果有错误，修复后重新推送
git add . && git commit -m "Fix build errors" && git push
```

### 问题 2：运行时 "Missing environment variable"
**原因**: 环境变量未配置  
**解决**: 
1. 进入 Vercel 项目 → Settings → Environment Variables
2. 确认所有必需变量已添加
3. 点击 **"Redeploy"** 使变量生效

### 问题 3：API 调用返回 500
**原因**: Qwen API Key 无效或 Supabase 连接失败  
**解决**:
1. 检查 Vercel Functions 日志（项目页面 → Functions 标签）
2. 确认环境变量值正确（无多余空格或引号）
3. 测试 Supabase 连接：访问 https://zqwvmfncajrvafnfbfre.supabase.co/rest/v1/

### 问题 4：页面样式丢失
**原因**: CSS 未正确加载  
**解决**:
1. 硬刷新浏览器（Ctrl+Shift+R 或 Cmd+Shift+R）
2. 检查浏览器控制台是否有 CORS 错误
3. 重新部署：Vercel 项目页面 → Deployments → Redeploy

---

## 📊 监控和维护

### 查看部署日志
- 实时日志: Vercel 项目 → Logs 标签
- 函数日志: Vercel 项目 → Functions 标签

### 查看分析数据
- Vercel 项目 → Analytics 标签
- 关注指标: Page Views, Response Time, Error Rate

### 回滚部署
如果新版本有问题：
1. 进入 Vercel 项目 → Deployments
2. 找到上一个稳定版本
3. 点击 **"Promote to Production"**

---

## 💰 成本说明

**Vercel Hobby 计划（免费）**:
- 100GB 带宽/月
- 1000 小时 Serverless Function 执行时间/月
- 无限部署次数
- 自动 HTTPS

**对于 MVP 阶段**，免费额度完全足够。预计月度成本：
- 带宽: < 1GB（约 100-500 访客）
- 函数执行: < 10 小时（取决于使用情况）
- **总成本: ¥0**

---

## 🎉 部署完成后的下一步

1. **绑定自定义域名**（可选）
   - Vercel 项目 → Settings → Domains
   - 添加你的域名并按照 DNS 指引配置

2. **设置告警**
   - Vercel 项目 → Settings → Notifications
   - 配置部署失败、高错误率等告警

3. **分享你的应用**
   - 复制 Vercel 提供的 URL
   - 分享给测试用户收集反馈

---

**祝你部署顺利！** 🚀
