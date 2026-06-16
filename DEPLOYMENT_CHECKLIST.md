# 店播AI Agent - 腾讯云部署检查清单

**版本**: v1.1.0 (Sprint 1)  
**更新日期**: 2026-06-16  
**目标**: 确保部署过程顺利，所有功能正常

---

## 📋 部署前准备清单

### 1. 腾讯云服务器准备

- [ ] 已购买腾讯云服务器（推荐配置：2核4G + 3Mbps）
- [ ] 服务器操作系统：CentOS 7.9+ / Ubuntu 20.04+ / Debian 11+
- [ ] 已设置 root 密码或 SSH 密钥
- [ ] 已在腾讯云控制台开放端口：3000、80、443

### 2. 软件安装

在服务器上执行以下命令安装必要软件：

#### CentOS/RHEL
```bash
# 安装 Docker
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo yum install -y docker-ce docker-ce-cli containerd.io
sudo systemctl start docker
sudo systemctl enable docker

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 安装 Git
sudo yum install -y git

# 验证安装
docker --version
docker-compose --version
git --version
```

#### Ubuntu/Debian
```bash
# 更新包索引
sudo apt-get update

# 安装 Docker
sudo apt-get install -y ca-certificates curl gnupg lsb-release
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo systemctl start docker
sudo systemctl enable docker

# 安装 Git
sudo apt-get install -y git

# 验证安装
docker --version
docker compose version
git --version
```

- [ ] Docker 安装成功
- [ ] Docker Compose 安装成功
- [ ] Git 安装成功

### 3. API Key 和配置准备

- [ ] **通义千问 API Key**
  - 获取地址：https://dashscope.console.aliyun.com/apiKey
  - 格式：`sk-xxxxxxxxxxxxxxxx`
  - 测试是否有效：
    ```bash
    curl -H "Authorization: Bearer sk-your-key" \
      https://dashscope.aliyun.com/api/v1/services/aigc/text-generation/generation
    ```

- [ ] **Supabase 项目**
  - 创建地址：https://supabase.com/dashboard
  - 已记录 Project URL：`https://your-project.supabase.co`
  - 已记录 Anon Key：`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
  - 已创建 `profiles` 表（包含 id, industry, business_name, updated_at 字段）

- [ ] **抖音热点 API Key**（可选）
  - 如果不配置，系统会使用内置模拟数据
  - 获取地址：https://xxapi.cn

---

## 🚀 部署执行清单

### 方式一：自动部署脚本（推荐）

- [ ] SSH 登录服务器：`ssh root@你的服务器IP`
- [ ] 下载部署脚本：
  ```bash
  cd /opt
  curl -O https://raw.githubusercontent.com/sskks/customer-agent/master/deploy-to-tencent.sh
  chmod +x deploy-to-tencent.sh
  ```
- [ ] 执行部署脚本：`./deploy-to-tencent.sh`
- [ ] 按照提示配置环境变量
- [ ] 等待构建完成（首次构建约 5-10 分钟）
- [ ] 查看部署结果

### 方式二：手动部署

- [ ] SSH 登录服务器：`ssh root@你的服务器IP`
- [ ] 克隆代码：
  ```bash
  cd /opt
  git clone https://github.com/sskks/customer-agent.git dianbo-agent
  cd dianbo-agent
  ```
- [ ] 配置环境变量：
  ```bash
  cp .env.example .env.local
  nano .env.local
  ```
  填入以下内容：
  ```bash
  QWEN_API_KEY="sk-your-qwen-api-key-here"
  NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
  NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  DOUYIN_HOT_API_KEY=""  # 可选
  ```
  保存后退出（Ctrl+O, Enter, Ctrl+X）

- [ ] 构建并启动容器：
  ```bash
  docker-compose up -d --build
  ```
- [ ] 查看构建日志：`docker-compose logs -f`
- [ ] 等待构建完成

---

## ✅ 部署后验证清单

### 1. 容器状态检查

- [ ] 执行 `docker-compose ps`，看到容器状态为 `Up (healthy)`
- [ ] 执行 `curl http://localhost:3000`，返回 HTTP 200
- [ ] 执行 `docker stats`，查看 CPU 和内存使用正常

### 2. 用户认证功能

打开浏览器访问：`http://你的服务器IP:3000`

- [ ] 点击"登录 / 注册"按钮
- [ ] 能够使用邮箱注册新账号
- [ ] 能够使用邮箱和密码登录
- [ ] 登录后右上角显示用户信息（邮箱或名称）
- [ ] 点击"退出"能够正常登出

### 3. 新手引导功能

- [ ] 使用新注册的账号登录
- [ ] 自动弹出新手引导弹窗
- [ ] 第 1 步：显示欢迎页面和功能介绍
- [ ] 第 2 步：能够从 8 个行业中选择一个
- [ ] 第 3 步：能够输入店铺名称
- [ ] 点击"完成设置"后资料保存到数据库
- [ ] 引导完成后回到主页

**验证数据库**：
- [ ] 在 Supabase Dashboard → Table Editor → profiles 表中能看到新记录
- [ ] 记录的 `industry` 和 `business_name` 字段有值

### 4. 推荐生成功能

- [ ] 在主页输入行业（如"酒吧"）和店铺名称（如"夜色酒吧"）
- [ ] 点击"生成今日推荐"按钮
- [ ] 显示加载动画
- [ ] 5-10 秒后显示 5 条推荐内容
- [ ] 每条推荐包含：标题、理由、播放量、咨询数、难度、耗时、置信度
- [ ] 推荐内容与选择的行业相关（如酒吧行业显示调酒、鸡尾酒等话题）

### 5. 反馈功能

- [ ] 在每条推荐下方看到反馈按钮（👍 😐 👎）
- [ ] 点击 👍 按钮，显示"已标记喜欢"
- [ ] 点击后按钮禁用，不能重复反馈
- [ ] 在 Supabase Dashboard → Table Editor → feedback 表中能看到反馈记录

### 6. 脚本生成功能

- [ ] 点击任意推荐的"生成脚本"按钮
- [ ] 弹出脚本生成窗口
- [ ] 显示加载动画（"AI 正在创作你的专属脚本"）
- [ ] 5-10 秒后显示完整脚本内容：
  - [ ] 脚本概览（标题、时长、分镜数量）
  - [ ] 开头钩子（前 3 秒）
  - [ ] 完整口播文案
  - [ ] 行动号召（最后 5 秒）
  - [ ] 分镜脚本（多个场景，每个包含画面、台词、备注）
  - [ ] 拍摄建议（多条建议）
- [ ] 脚本内容与选题相关（如"夏日防晒"主题的脚本内容是关于防晒的）

### 7. 导出与分享功能

在脚本生成窗口底部：

- [ ] 点击" 复制文案"按钮
- [ ] 弹出提示"已复制到剪贴板！"
- [ ] 粘贴到记事本，确认内容完整

- [ ] 点击"💾 下载TXT"按钮
- [ ] 浏览器下载 `.txt` 文件
- [ ] 打开文件，确认内容完整

- [ ] 点击"📤 分享"按钮
- [ ] 弹出分享菜单，包含以下选项：
  - [ ] 系统分享（如果浏览器支持）
  - [ ] 微信分享
  - [ ] 新浪微博
  - [ ] QQ 空间
  - [ ] 复制链接
- [ ] 点击"复制链接"，弹出提示"已复制到剪贴板！"

### 8. SEO 验证

- [ ] 查看浏览器标签页，标题显示"店播AI Agent - 智能短视频获客助手"
- [ ] 访问 `http://你的服务器IP:3000/sitemap.xml`，看到 XML 格式的 sitemap
- [ ] 访问 `http://你的服务器IP:3000/robots.txt`，看到 robots 配置内容

### 9. 移动端适配

在手机上访问：`http://你的服务器IP:3000`

- [ ] 页面能正常加载
- [ ] 布局自适应屏幕宽度
- [ ] 按钮和输入框易于触摸操作（不小于 44x44px）
- [ ] 新手引导弹窗能正常显示和操作
- [ ] 脚本生成窗口能正常滚动查看内容

### 10. 性能检查

- [ ] 首页加载时间 < 3 秒
- [ ] 脚本生成响应时间 < 15 秒
- [ ] 图片等资源加载正常
- [ ] 无 JavaScript 错误（F12 → Console 标签无红色错误）

---

## 🔧 常见问题排查

### 问题 1: 容器启动失败

**症状**: `docker-compose ps` 显示 Exited 状态

**排查步骤**:
1. 查看详细错误日志：`docker-compose logs dianbo-agent`
2. 检查环境变量是否正确：`cat .env.local`
3. 检查端口是否被占用：`netstat -tulpn | grep 3000`
4. 检查服务器内存是否充足：`free -h`

**解决方案**:
- 如果环境变量错误：重新编辑 `.env.local` 并重启容器
- 如果端口被占用：修改 `docker-compose.yml` 中的端口映射或停止占用端口的进程
- 如果内存不足：升级服务器配置或增加 swap

### 问题 2: 无法访问应用

**症状**: 浏览器显示"连接超时"或"无法访问此网站"

**排查步骤**:
1. 检查防火墙是否开放 3000 端口：
   - 腾讯云控制台 → 云服务器 → 安全组 → 入站规则
   - 确认有允许 3000 端口的规则
2. 检查容器是否正常运行：`docker-compose ps`
3. 测试本地访问：`curl http://localhost:3000`

**解决方案**:
- 如果防火墙未开放：在腾讯云控制台添加安全组规则
- 如果容器未运行：查看日志 `docker-compose logs -f` 并修复错误

### 问题 3: AI 脚本生成失败

**症状**: 点击"生成脚本"后显示"生成失败"或"网络错误"

**排查步骤**:
1. 检查 QWEN_API_KEY 是否正确：`cat .env.local | grep QWEN_API_KEY`
2. 测试 API 连通性：
   ```bash
   curl -H "Authorization: Bearer sk-your-key" \
     https://dashscope.aliyun.com/api/v1/services/aigc/text-generation/generation
   ```
3. 查看后端日志：`docker-compose logs -f | grep -i error`

**解决方案**:
- 如果 API Key 错误：重新获取正确的 API Key 并更新 `.env.local`
- 如果 API 不通：检查网络连接或联系通义千问技术支持
- 如果后端报错：根据日志内容修复代码或配置

### 问题 4: 新手引导不显示

**症状**: 新用户登录后没有显示引导弹窗

**排查步骤**:
1. 检查浏览器控制台是否有 JavaScript 错误：F12 → Console 标签
2. 清除浏览器缓存和 Cookie，或使用无痕模式访问
3. 检查 Supabase profiles 表是否有数据：
   - Supabase Dashboard → Table Editor → profiles
   - 确认当前用户的记录存在

**解决方案**:
- 如果有 JavaScript 错误：根据错误信息修复代码
- 如果缓存问题：清除缓存后重试
- 如果数据库无记录：手动插入记录或重新注册

### 问题 5: 分享功能不工作

**症状**: 点击"分享"按钮后没有反应或报错

**排查步骤**:
1. 检查浏览器是否支持 Web Share API（Chrome、Edge、Safari 支持）
2. 检查浏览器控制台是否有错误
3. 尝试使用"复制链接"功能

**解决方案**:
- 如果浏览器不支持：使用"复制链接"功能作为替代
- 如果有 JavaScript 错误：根据错误信息修复代码

---

## 📊 监控与维护

### 日常监控

- [ ] 每天检查容器状态：`docker-compose ps`
- [ ] 每周查看资源使用：`docker stats`
- [ ] 每周清理日志文件：`find /var/lib/docker/containers -name "*.log" -exec truncate -s 0 {} \;`
- [ ] 每月备份数据：
  ```bash
  cp .env.local .env.local.bak
  tar -czf dianbo-agent-backup-$(date +%Y%m%d).tar.gz /opt/dianbo-agent
  ```

### 更新应用

- [ ] 拉取最新代码：
  ```bash
  cd /opt/dianbo-agent
  git pull origin master
  ```
- [ ] 重新构建并启动：
  ```bash
  docker-compose up -d --build
  ```
- [ ] 清理旧镜像：
  ```bash
  docker image prune -f
  ```

### 故障恢复

如果服务器重启或容器异常停止：

- [ ] 启动容器：`docker-compose up -d`
- [ ] 检查状态：`docker-compose ps`
- [ ] 查看日志：`docker-compose logs -f`

---

## 📝 部署记录

| 日期 | 版本 | 操作人 | 结果 | 备注 |
|------|------|--------|------|------|
| 2026-06-16 | v1.1.0 | [你的名字] | ⏳ 待执行 | Sprint 1 首次部署 |
| | | | | |
| | | | | |

---

## 📞 技术支持

如遇到问题，可以通过以下方式寻求帮助：

1. **查看日志**: `docker-compose logs -f`
2. **查看文档**:
   - [QUICK_DEPLOY.md](./QUICK_DEPLOY.md) - 快速部署指南
   - [TENCENT_CLOUD_DEPLOY.md](./TENCENT_CLOUD_DEPLOY.md) - 详细部署文档
   - [SPRINT1_SUMMARY.md](./SPRINT1_SUMMARY.md) - Sprint 1 总结
3. **GitHub Issues**: https://github.com/sskks/customer-agent/issues
4. **社区论坛**: [待补充]

---

**祝部署顺利！** 🚀
