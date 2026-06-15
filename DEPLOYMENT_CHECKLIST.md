# 店播AI Agent - 上线前检查清单

## ✅ 已完成功能

### 核心功能
- [x] 用户认证系统（Supabase Auth）
- [x] 智能推荐引擎（基于热点、季节、反馈学习）
- [x] 脚本生成器（通义千问 API + 话题自适应）
- [x] 抖音热搜数据集成（xxapi.cn + 智能模拟数据）
- [x] 搜索功能（关键词搜索热点话题和视频）
- [x] 反馈学习系统（点赞/点踩 → 优化后续推荐）
- [x] 效果追踪页面（历史推荐记录）
- [x] Supabase 数据持久化（profiles, content_records, recommendation_history）

### 用户体验
- [x] 自定义行业类型输入（不再限制固定选项）
- [x] 响应式设计（移动端适配）
- [x] 加载状态和骨架屏
- [x] 错误处理和降级方案

---

## ⚠️ 上线前必须完成

### 1. 数据库迁移（高优先级）
```sql
-- 在 Supabase SQL Editor 中执行：
-- 文件位置: supabase/migrations/001_remove_industry_constraint.sql

-- 移除 industry 字段的 CHECK 约束，支持自定义行业
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_industry_check;
ALTER TABLE public.profiles ALTER COLUMN industry SET DEFAULT '未分类';

-- 更新现有数据
UPDATE public.profiles SET industry = '美容/美甲' WHERE industry = 'beauty';
UPDATE public.profiles SET industry = '餐饮/奶茶' WHERE industry = 'restaurant';
UPDATE public.profiles SET industry = '健身/瑜伽' WHERE industry = 'fitness';
```

### 2. 环境变量配置（生产环境）
创建 `.env.production` 或部署平台配置：
```bash
# 必需
QWEN_API_KEY="sk-你的通义千问API密钥"
NEXT_PUBLIC_SUPABASE_URL="https://你的项目ID.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="你的anon密钥"

# 可选（不配置时使用模拟数据）
DOUYIN_HOT_API_KEY="你的xxapi.cn密钥"
```

### 3. Supabase RLS 策略验证
确保以下表的 RLS 策略正确配置：
- `profiles` - 用户只能读写自己的资料
- `services` - 用户只能管理自己的服务
- `content_records` - 用户只能访问自己的内容
- `recommendation_history` - 用户只能查看自己的推荐历史
- `business_metrics` - 用户只能查看自己的指标
- `user_preferences` - 用户只能管理自己的偏好

### 4. 生产构建测试
```bash
npm run build    # 确保无编译错误
npm start        # 本地测试生产版本
```

### 5. 关键流程端到端测试
- [ ] 新用户注册 → 自动创建 profile
- [ ] 登录 → 加载用户资料
- [ ] 生成推荐 → 保存到 recommendation_history
- [ ] 提交反馈（👍/👎）→ user_feedback 字段更新
- [ ] 搜索热点 → 返回相关话题和视频
- [ ] 生成脚本 → 调用 Qwen API 成功
- [ ] 退出登录 → 清除 session

---

## 🔧 建议优化项（非阻塞）

### 性能优化
- [ ] 添加 API 响应缓存（Next.js revalidate）
- [ ] 图片懒加载（如果有用户上传头像）
- [ ] 代码分割优化（大型组件动态导入）

### 安全加固
- [ ] 添加速率限制（防止 API 滥用）
- [ ] 敏感操作日志记录（feedback submit, script generation）
- [ ] CORS 配置（如果前端和后端分离部署）

### 监控与日志
- [ ] 集成 Sentry 或其他错误追踪服务
- [ ] 添加 API 调用统计（Qwen API 使用量）
- [ ] 设置 Supabase 告警（数据库错误、RLS 违规）

### 文档完善
- [ ] 编写用户使用手册
- [ ] 创建 API 文档（Swagger/OpenAPI）
- [ ] 准备故障排查指南

---

## 🚀 部署步骤

### Vercel 部署（推荐）
```bash
# 1. 安装 Vercel CLI
npm i -g vercel

# 2. 登录并部署
vercel login
vercel --prod

# 3. 配置环境变量
vercel env add QWEN_API_KEY
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add DOUYIN_HOT_API_KEY
```

### Docker 部署
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 📊 上线后监控指标

- 日活跃用户数 (DAU)
- 推荐点击率 (CTR)
- 脚本生成成功率
- 平均响应时间
- API 调用成本（Qwen API）
- 用户反馈满意度（good/bad 比例）

---

**最后更新日期**: 2026-06-15
**版本**: v0.1.0 MVP
