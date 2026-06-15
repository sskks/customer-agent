# Supabase 数据库 + 用户体系搭建指南

## 本次新增的文件清单

```
supabase/schema.sql          ← 完整数据库表结构和函数
middleware.ts                 ← Next.js 路由鉴权中间件
lib/supabase/client.ts        ← Supabase 浏览器端客户端
lib/supabase/server.ts        ← Supabase 服务端客户端
lib/supabase/middleware.ts    ← 会话刷新辅助
lib/database.ts               ← 数据库 CRUD 操作封装
app/login/page.tsx            ← 登录/注册页面
app/api/auth/route.ts         ← 认证 API 路由
.env.local                    ← 环境变量（需填入 Supabase 密钥）
.env.example                  ← 环境变量模板（可分享）
```

---

## 第一步：创建 Supabase 项目（5 分钟）

1. 打开 https://supabase.com/ → 点击右上角 "Start your project"
2. 用 GitHub 账号登录
3. 点击 "New Project"，填写：
   - **Name**：dianbo-agent（随意）
   - **Database Password**：设一个强密码并记下来
   - **Region**：选 Singapore 或 Hong Kong（中国访问快）
   - **Pricing Plan**：Free（免费额度够 MVP 用）
4. 点击 "Create new project"，等待 2-3 分钟初始化

---

## 第二步：执行数据库 Schema（3 分钟）

1. 在 Supabase 控制台，点击左侧 "SQL Editor"
2. 点击 "New query"
3. 把 `supabase/schema.sql` 文件的全部内容复制粘贴进去
4. 点击 "Run" 执行
5. 看到 "Success" 表示建表完成

**建了什么？**

| 表名 | 作用 |
|------|------|
| profiles | 用户资料（姓名、行业、店名等） |
| services | 店铺服务项目 |
| content_records | 视频内容记录（脚本、状态、数据指标） |
| business_metrics | 业务指标缓存 |
| user_preferences | 用户偏好（偏好的内容类型、避开的主题等） |
| recommendation_history | 推荐历史（用于反馈学习） |

另外还创建了：
- **行级安全策略 (RLS)**：每个用户只能读写自己的数据
- **触发器**：新用户注册时自动创建 profile
- **函数**：`refresh_business_metrics()` 自动计算业务指标

---

## 第三步：获取 API 密钥（2 分钟）

1. 在 Supabase 控制台，点击左侧 "Project Settings" → "API"
2. 找到以下两项：
   - **Project URL**：类似 `https://abcdefg.supabase.co`
   - **Project API keys** → **anon public**：一长串字符串
3. 复制这两个值

---

## 第四步：配置环境变量（1 分钟）

打开 `.env.local` 文件，把刚才复制的值填进去：

```env
NEXT_PUBLIC_SUPABASE_URL="https://你的项目ID.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="你的anon-public-key"
```

---

## 第五步：重启服务器

```bash
# 先按 Ctrl+C 停掉当前服务器，然后重新启动：
npm run dev
```

---

## 第六步：测试验证

1. 打开 http://localhost:3000
2. 点击右上角 "登录 / 注册"
3. 选择"注册"标签，输入邮箱、密码、姓名
4. 注册成功后会自动跳转首页
5. 右上角会显示你的用户名和邮箱
6. 测试"退出"按钮是否正常

---

## 关于 Supabase 邮件验证

Supabase 默认开启邮件验证。如果你不想配置邮件服务：

**方法 A**：在 Supabase 控制台 → Authentication → Settings → 关闭 "Enable email confirmations"

**方法 B**：注册后用 Supabase SQL Editor 手动确认：
```sql
UPDATE auth.users SET email_confirmed_at = NOW() WHERE email = '你的邮箱';
```

---

## 常见问题

### Q: 注册后报 "Database error"？
A: 可能是 schema.sql 没执行完。到 SQL Editor 检查 `profiles` 表是否存在。

### Q: 登录后页面没变？
A: 刷新页面（Ctrl+F5），或者检查 `.env.local` 中的 URL 是否正确。

### Q: 免费额度够用吗？
A: Supabase Free 计划提供：
- 500MB 数据库存储
- 50,000 月活跃用户
- 500,000 次数据库请求/月
- 足够 MVP 阶段使用

### Q: 如何查看数据库数据？
A: Supabase 控制台 → 左侧 "Table Editor" → 选择对应的表

---

## 文件架构总览

```
dianbo-agent/
├── supabase/
│   └── schema.sql              ← 数据库表结构
├── lib/
│   ├── supabase/
│   │   ├── client.ts           ← 浏览器端 Supabase 客户端
│   │   ├── server.ts           ← 服务端 Supabase 客户端
│   │   └── middleware.ts       ← 会话管理
│   ├── types.ts                ← 前端类型定义
│   ├── database.ts             ← 数据库操作封装
│   ├── recommendationEngine.ts ← 推荐引擎
│   └── scriptGenerator.ts      ← 脚本生成服务
├── middleware.ts                ← Next.js 路由中间件
├── app/
│   ├── layout.tsx              ← 全局布局
│   ├── page.tsx                ← 主页
│   ├── globals.css             ← 全局样式
│   ├── login/page.tsx          ← 登录/注册页
│   └── api/
│       ├── recommendations/route.ts ← 推荐 API
│       ├── script/route.ts          ← 脚本生成 API
│       └── auth/route.ts            ← 认证 API
├── .env.local                   ← 环境变量（本地）
├── .env.example                 ← 环境变量模板
└── package.json
```

---

## 下一步建议

完成数据库配置后，建议的开发顺序：

1. **接入真实热点数据** → 对接抖音/小红书热搜 API
2. **反馈学习机制** → 用户录入视频实际数据，Agent 优化推荐
3. **部署到 Vercel** → 免费部署，生成可分享链接
4. **小范围测试** → 找 3-5 个真实商家试用
