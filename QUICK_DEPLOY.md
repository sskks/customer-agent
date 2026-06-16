# 店播AI Agent - 快速部署指南

**版本**: Sprint 1 (v1.1.0)  
**更新日期**: 2026-06-16  
**部署目标**: 腾讯云服务器（Docker）

---

## 📦 本次更新内容

### ✅ Sprint 1 已完成功能

1. **新手引导流程（Onboarding）**
   - 多步骤向导：欢迎 → 行业选择 → 店铺信息
   - 自动检测新用户并显示引导
   - 保存用户资料到 Supabase

2. **增强导出与分享功能**
   - 一键复制文案到剪贴板
   - 下载脚本为 TXT 文件
   - 社交分享：微信、微博、QQ、原生分享API

3. **SEO 优化**
   - 增强的 metadata（OpenGraph、Twitter Cards）
   - sitemap.xml 自动生成
   - robots.txt 配置

4. **用户体验改进**
   - 更好的按钮标签和图标
   - 响应式布局优化
   - 错误处理和加载状态

---

## 🚀 快速部署步骤

### 前置条件

- ✅ 腾讯云服务器（已购买）
- ✅ Docker 和 Docker Compose 已安装
- ✅ 域名（可选，用于 HTTPS）
- ✅ Supabase 项目已创建
- ✅ 通义千问 API Key 已获取

### 步骤 1: SSH 登录服务器

```bash
ssh root@你的服务器IP
```

### 步骤 2: 克隆最新代码

```bash
cd /opt
rm -rf dianbo-agent  # 如果已有旧版本
git clone https://github.com/sskks/customer-agent.git dianbo-agent
cd dianbo-agent
```

### 步骤 3: 配置环境变量

```bash
cp .env.example .env.local
nano .env.local
```

填入你的实际配置：

```bash
# 通义千问 API Key（必需）
QWEN_API_KEY="sk-your-qwen-api-key-here"

# Supabase 配置（必需）
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 抖音热点 API（可选）
DOUYIN_HOT_API_KEY=""
```

保存后退出（Ctrl+O, Enter, Ctrl+X）。

### 步骤 4: 构建并启动容器

```bash
# 停止旧容器（如果有）
docker-compose down

# 构建并启动新容器
docker-compose up -d --build

# 查看构建日志
docker-compose logs -f
```

首次构建可能需要 5-10 分钟，请耐心等待。

### 步骤 5: 验证部署

```bash
# 检查容器状态
docker-compose ps

# 应该看到：
# NAME                              STATUS          PORTS
# dianbo-agent-dianbo-agent-1       Up (healthy)    0.0.0.0:3000->3000/tcp

# 测试应用是否正常响应
curl http://localhost:3000

# 查看实时日志
docker-compose logs -f dianbo-agent
```

### 步骤 6: 访问应用

打开浏览器访问：`http://你的服务器IP:3000`

例如：`http://123.45.67.89:3000`

---

## ✅ 验证清单

部署完成后，请验证以下功能是否正常：

### 1. 用户认证
- [ ] 能够注册/登录
- [ ] 登录后显示用户信息
- [ ] 退出登录正常工作

### 2. 新手引导
- [ ] 新用户首次登录显示引导弹窗
- [ ] 能够选择行业
- [ ] 能够输入店铺名称
- [ ] 资料保存到数据库

### 3. 推荐生成
- [ ] 输入行业和店铺名称后能生成推荐
- [ ] 推荐列表正常显示
- [ ] 反馈按钮（👍  😐）正常工作

### 4. 脚本生成
- [ ] 点击"生成脚本"能打开弹窗
- [ ] AI 脚本正常生成（5-10秒）
- [ ] 脚本内容显示完整（标题、钩子、正文、分镜）

### 5. 导出与分享
- [ ] "复制文案"按钮能复制到剪贴板
- [ ] "下载TXT"按钮能下载文件
- [ ] "分享"按钮能打开分享菜单
- [ ] 分享到微信/微博/QQ 正常工作（或提示复制）

### 6. SEO
- [ ] 页面标题显示正确
- [ ] 访问 `/sitemap.xml` 能看到 sitemap
- [ ] 访问 `/robots.txt` 能看到 robots 配置

### 7. 移动端适配
- [ ] 在手机浏览器上能正常访问
- [ ] 页面布局自适应屏幕宽度
- [ ] 按钮和输入框易于触摸操作

---

## 🔧 常见问题排查

### 问题 1: 容器启动失败

**症状**: `docker-compose ps` 显示 Exited 状态

**解决**:
```bash
# 查看详细错误日志
docker-compose logs dianbo-agent

# 常见原因：
# 1. 环境变量配置错误 → 检查 .env.local
# 2. 端口被占用 → 修改 docker-compose.yml 中的端口映射
# 3. 内存不足 → 升级服务器配置
```

### 问题 2: 无法访问应用

**症状**: 浏览器显示"连接超时"

**解决**:
```bash
# 1. 检查防火墙是否开放 3000 端口
# 腾讯云控制台 → 安全组 → 添加入站规则

# 2. 检查容器是否正常运行
docker-compose ps

# 3. 测试本地访问
curl http://localhost:3000
```

### 问题 3: AI 脚本生成失败

**症状**: 点击"生成脚本"后显示错误

**解决**:
```bash
# 1. 检查 QWEN_API_KEY 是否正确配置
cat .env.local | grep QWEN_API_KEY

# 2. 测试 API 连通性
curl -H "Authorization: Bearer sk-your-key" \
  https://dashscope.aliyun.com/api/v1/services/aigc/text-generation/generation

# 3. 查看后端日志
docker-compose logs -f | grep -i error
```

### 问题 4: 新手引导不显示

**症状**: 新用户登录后没有显示引导弹窗

**解决**:
```bash
# 1. 检查浏览器控制台是否有 JavaScript 错误
# F12 → Console 标签

# 2. 清除浏览器缓存和 Cookie
# 或使用无痕模式访问

# 3. 检查 Supabase profiles 表是否有数据
# 在 Supabase Dashboard → Table Editor → profiles
```

---

## 📊 监控与维护

### 查看资源使用

```bash
# CPU 和内存使用
docker stats

# 磁盘占用
du -sh /var/lib/docker

# 日志大小
ls -lh /var/lib/docker/containers/*/ *-json.log
```

### 重启服务

```bash
# 重启所有服务
docker-compose restart

# 重启单个服务
docker-compose restart dianbo-agent
```

### 更新应用

```bash
# 拉取最新代码
cd /opt/dianbo-agent
git pull origin master

# 重新构建并启动
docker-compose up -d --build

# 清理旧镜像
docker image prune -f
```

### 备份数据

```bash
# 备份环境变量
cp .env.local .env.local.bak

# 备份整个项目目录
tar -czf dianbo-agent-backup-$(date +%Y%m%d).tar.gz /opt/dianbo-agent
```

---

##  下一步计划

### Sprint 2（Q3 第 3-4 周）
- [ ] 订阅制付费体系
- [ ] 批量生成功能
- [ ] A/B 测试框架
- [ ] 性能优化（缓存策略）

### Sprint 3（Q3 第 5-6 周）
- [ ] 数据分析后台
- [ ] 移动端适配（PWA）
- [ ] 监控告警系统
- [ ] 多语言支持（英文）

---

## 📞 技术支持

如遇到问题，可以：

1. **查看应用日志**: `docker-compose logs -f`
2. **检查 GitHub Issues**: https://github.com/sskks/customer-agent/issues
3. **查看完整部署文档**: [TENCENT_CLOUD_DEPLOY.md](./TENCENT_CLOUD_DEPLOY.md)

---

##  部署记录

| 日期 | 版本 | 操作 | 结果 | 备注 |
|------|------|------|------|------|
| 2026-06-16 | v1.1.0 | 首次部署 Sprint 1 | ⏳ 待执行 | 包含 Onboarding、分享、SEO |

---

**祝部署顺利！** 🚀
