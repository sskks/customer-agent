# 🚀 店播AI Agent - 最终上线确认清单

## ✅ 所有阻塞性问题已修复

### 1. React Hooks 顺序错误 - 已修复 ✓
- **文件**: `app/history/page.tsx`
- **问题**: `loadContents` 在声明前被调用
- **修复**: 将函数定义移到 `useEffect` 之前
- **验证**: 生产构建成功，无运行时错误

### 2. TypeScript 编译 - 通过 ✓
```
✓ Compiled successfully in 2.9s
✓ Finished TypeScript in 2.2s
✓ Generating static pages (11/11) in 488ms
```

### 3. ESLint - 无阻塞错误 ✓
- 仅有少量警告（unused variables），不影响运行

---

## 📋 上线前必须执行的操作

### 第一步：数据库迁移（Supabase）

在 Supabase 控制台 → SQL Editor 中执行以下 SQL：

```sql
-- 1. 移除 industry 字段的 CHECK 约束
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_industry_check;

-- 2. 修改默认值
ALTER TABLE public.profiles ALTER COLUMN industry SET DEFAULT '未分类';

-- 3. 更新现有数据
UPDATE public.profiles SET industry = '美容/美甲' WHERE industry = 'beauty';
UPDATE public.profiles SET industry = '餐饮/奶茶' WHERE industry = 'restaurant';
UPDATE public.profiles SET industry = '健身/瑜伽' WHERE industry = 'fitness';

-- 4. 添加注释
COMMENT ON COLUMN public.profiles.industry IS '用户自定义行业类型，支持自由输入';
```

**预期结果**: 显示 "Success. No rows returned"

---

### 第二步：配置生产环境变量

根据你的部署平台，配置以下环境变量：

#### Vercel 部署
```bash
vercel env add QWEN_API_KEY
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add DOUYIN_HOT_API_KEY  # 可选
```

#### Docker / 自建服务器
创建 `.env.production` 文件：
```bash
QWEN_API_KEY="sk-你的通义千问API密钥"
NEXT_PUBLIC_SUPABASE_URL="https://你的项目ID.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="你的anon公钥"
DOUYIN_HOT_API_KEY=""  # 可选，留空使用模拟数据
```

**获取密钥的位置**:
- Qwen API Key: https://dashscope.aliyun.com/
- Supabase URL & Key: https://supabase.com/dashboard → 项目设置 → API

---

### 第三步：验证 RLS 策略

在 Supabase SQL Editor 中执行以下查询，确认 RLS 已启用：

```sql
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

**预期结果**: 所有表的 `rowsecurity` 列应为 `true`

| tablename | rowsecurity |
|-----------|-------------|
| profiles | true |
| services | true |
| content_records | true |
| business_metrics | true |
| user_preferences | true |
| recommendation_history | true |

---

### 第四步：端到端测试流程

部署后，按以下顺序测试核心功能：

1. **新用户注册**
   - 访问 `/login` → 切换到"注册"标签
   - 输入邮箱和密码（至少6位）
   - 点击"注册" → 应显示"注册成功！正在跳转..."
   - 自动跳转到首页

2. **生成推荐**
   - 在首页输入行业（如"宠物店"）和店铺名称
   - 点击"生成今日推荐"
   - 等待加载 → 应显示 5 条推荐内容

3. **提交反馈**
   - 在任意推荐卡片上点击 👍 或 👎
   - 应显示"已记录"提示

4. **搜索热点**
   - 切换到"🔥 搜索热点"标签
   - 输入关键词（如"补水"或"英雄联盟"）
   - 点击"搜索热点" → 应显示相关话题和视频

5. **生成脚本**
   - 在推荐卡片上点击"生成脚本"
   - 等待 AI 创作 → 应显示完整脚本（标题、钩子、主体内容、分镜等）

6. **查看历史**
   - 点击右上角"效果追踪"
   - 应显示已保存的推荐历史记录

7. **退出登录**
   - 点击右上角"退出"
   - 应返回登录页面

---

## 🎯 上线决策

### 可以立即部署的条件检查

- [x] TypeScript 编译通过
- [x] 生产构建成功
- [x] 核心功能完整（认证、推荐、脚本、搜索、反馈）
- [x] 用户体验完善（加载状态、错误提示、空状态）
- [x] RLS 策略配置正确
- [x] 文档齐全（README、部署清单、功能说明）
- [ ] 数据库迁移已执行 ← **需要你执行**
- [ ] 环境变量已配置 ← **需要你配置**

### 建议但不阻塞的功能

以下功能可以在上线后迭代添加：

1. **速率限制** - 防止 API 滥用（优先级：高，建议上线后第一周添加）
2. **密码强度验证** - 提升账户安全（优先级：中）
3. **错误边界** - 捕获未处理的 React 错误（优先级：中）
4. **监控集成** - Sentry 或其他错误追踪（优先级：中）
5. **自动化测试** - E2E 测试覆盖核心流程（优先级：低）

---

## 📊 上线后监控指标

建议关注以下关键指标：

| 指标 | 目标值 | 说明 |
|------|--------|------|
| 日活跃用户 (DAU) | > 10 | MVP 阶段目标 |
| 推荐点击率 | > 30% | 用户点击"生成脚本"的比例 |
| 脚本生成成功率 | > 95% | 有 API Key 时应接近 100% |
| 平均响应时间 | < 3s | 推荐生成和脚本生成的平均耗时 |
| 用户满意度 | > 60% | good 反馈 / (good + bad) 的比例 |
| API 成本 | < ¥50/天 | Qwen API 日均费用 |

---

## 🚨 紧急回滚方案

如果上线后发现严重问题：

### Vercel 回滚
```bash
# 查看之前的部署
vercel deployments

# 回滚到指定版本
vercel rollback <deployment-url>
```

### Docker 回滚
```bash
# 停止当前容器
docker stop dianbo-agent

# 启动上一个稳定版本
docker run -d --name dianbo-agent -p 3000:3000 your-image:previous-tag
```

---

## ✅ 最终确认

**项目负责人签字**: _______________  
**日期**: 2026-06-15  
**版本**: v0.1.0 MVP  

**部署状态**: ⏳ 待部署 | ✅ 已部署 | ❌ 回滚

---

**祝部署顺利！如有问题，参考 DEPLOYMENT_CHECKLIST.md 中的故障排查指南。**
