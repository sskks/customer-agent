# 腾讯云 Docker 部署指南

## 前置准备

### 1. 购买腾讯云服务器

推荐配置：
- **实例类型**：标准型 S5/S6（2核4G 或 4核8G）
- **操作系统**：CentOS 7.9 / Ubuntu 20.04+ / Debian 11+
- **带宽**：3Mbps 以上（建议 5Mbps+）
- **系统盘**：50GB SSD 以上

购买地址：https://cloud.tencent.com/act/pro/cvm

### 2. 安装 Docker 和 Docker Compose

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

# 验证安装
docker --version
docker-compose --version
```

#### Ubuntu/Debian
```bash
# 更新包索引
sudo apt-get update

# 安装依赖
sudo apt-get install -y ca-certificates curl gnupg lsb-release

# 添加 Docker GPG 密钥
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# 设置仓库
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 安装 Docker
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo systemctl start docker
sudo systemctl enable docker

# 验证安装
docker --version
docker compose version
```

### 3. 配置防火墙

在腾讯云控制台开放端口：
- **3000**：应用服务端口
- **80**：HTTP（如果使用 Nginx）
- **443**：HTTPS（如果使用 SSL）

操作路径：腾讯云控制台 → 云服务器 → 安全组 → 添加入站规则

---

## 部署步骤

### 1. 上传项目文件到服务器

#### 方式一：使用 Git（推荐）
```bash
# SSH 登录服务器
ssh root@your-server-ip

# 克隆 GitHub 仓库
cd /opt
git clone https://github.com/sskks/customer-agent.git dianbo-agent
cd dianbo-agent
```

#### 方式二：使用 SCP 上传
```bash
# 在本地电脑执行
scp -r "D:\vscode\Microsoft VS Code\project\customer agent\dianbo-agent" root@your-server-ip:/opt/dianbo-agent
```

#### 方式三：使用 SFTP 工具
- FileZilla、WinSCP 等图形化工具直接拖拽上传

### 2. 配置环境变量

```bash
cd /opt/dianbo-agent

# 复制环境变量示例文件
cp .env.example .env.local

# 编辑环境变量
nano .env.local
# 或使用 vim: vim .env.local
```

填入你的实际配置值：
```bash
# 通义千问 API Key
QWEN_API_KEY="sk-your-qwen-api-key-here"

# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-public-key-here"

# 抖音热点 API（可选）
DOUYIN_HOT_API_KEY=""
```

保存后退出（nano: Ctrl+O, Enter, Ctrl+X）

### 3. 构建并启动容器

```bash
# 使用 Docker Compose 构建并启动
docker-compose up -d --build

# 查看构建日志
docker-compose logs -f

# 等待应用启动（首次构建可能需要 5-10 分钟）
```

### 4. 验证部署

```bash
# 检查容器状态
docker-compose ps

# 应该看到类似输出：
# NAME                 IMAGE                STATUS                   PORTS
# dianbo-agent-dianbo-agent-1   dianbo-agent_dianbo-agent   Up (healthy)   0.0.0.0:3000->3000/tcp

# 测试应用是否正常响应
curl http://localhost:3000

# 查看实时日志
docker-compose logs -f dianbo-agent
```

### 5. 访问应用

打开浏览器访问：`http://你的服务器IP:3000`

例如：`http://123.45.67.89:3000`

---

## 常用运维命令

### 查看服务状态
```bash
# 查看所有容器状态
docker-compose ps

# 查看资源使用情况
docker stats

# 查看磁盘占用
du -sh /var/lib/docker
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

# 清理旧镜像（释放磁盘空间）
docker image prune -f
```

### 查看日志
```bash
# 查看实时日志
docker-compose logs -f

# 查看最近 100 行日志
docker-compose logs --tail 100

# 查看错误日志
docker-compose logs | grep -i error
```

### 停止服务
```bash
# 停止所有服务
docker-compose down

# 停止并删除数据卷（谨慎使用）
docker-compose down -v
```

---

## 生产环境优化（可选）

### 1. 配置 Nginx 反向代理

创建 `nginx.conf`：
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 静态文件缓存
    location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
        proxy_pass http://localhost:3000;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

修改 `docker-compose.yml`，取消注释 Nginx 部分，然后：
```bash
docker-compose up -d
```

### 2. 配置 HTTPS（SSL 证书）

#### 使用 Let's Encrypt 免费证书
```bash
# 安装 Certbot
sudo yum install -y certbot python3-certbot-nginx  # CentOS
# 或
sudo apt-get install -y certbot python3-certbot-nginx  # Ubuntu

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo crontab -e
# 添加以下行：
0 0,12 * * * /usr/bin/certbot renew --quiet
```

### 3. 配置监控

#### 使用 Portainer（Docker 管理界面）
```bash
docker volume create portainer_data
docker run -d \
  -p 9000:9000 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  --name portainer \
  --restart always \
  portainer/portainer-ce:latest
```

访问：`http://你的服务器IP:9000`

#### 使用 Prometheus + Grafana（高级监控）
参考：https://prometheus.io/docs/prometheus/latest/installation/

---

## 故障排查

### 问题 1：容器启动失败

**症状**：`docker-compose ps` 显示 Exited 状态

**解决**：
```bash
# 查看详细错误日志
docker-compose logs dianbo-agent

# 常见原因：
# 1. 环境变量配置错误 → 检查 .env.local
# 2. 端口被占用 → 修改 docker-compose.yml 中的端口映射
# 3. 内存不足 → 升级服务器配置或减少内存限制
```

### 问题 2：无法访问应用

**症状**：浏览器显示"连接超时"

**解决**：
```bash
# 1. 检查防火墙是否开放 3000 端口
# 腾讯云控制台 → 安全组 → 添加入站规则

# 2. 检查容器是否正常运行
docker-compose ps

# 3. 检查应用日志
docker-compose logs -f dianbo-agent

# 4. 测试本地访问
curl http://localhost:3000
```

### 问题 3：API 调用失败

**症状**：页面加载但 AI 功能不工作

**解决**：
```bash
# 1. 检查环境变量是否正确配置
cat .env.local

# 2. 验证 API Key 是否有效
curl -H "Authorization: Bearer sk-your-key" https://dashscope.aliyun.com/api/v1/services/aigc/text-generation/generation

# 3. 检查网络连接
ping dashscope.aliyun.com
```

### 问题 4：内存溢出

**症状**：容器频繁重启，日志显示 OOMKilled

**解决**：
```bash
# 1. 增加服务器内存配置
# 2. 调整 docker-compose.yml 中的内存限制
deploy:
  resources:
    limits:
      memory: 4G  # 增加到 4G

# 3. 重启服务
docker-compose up -d
```

---

## 性能优化建议

1. **服务器配置**：至少 2核4G，推荐 4核8G
2. **带宽**：3Mbps 起步，推荐 5Mbps+
3. **CDN**：如果用户分布广泛，考虑使用腾讯云 CDN 加速静态资源
4. **数据库**：Supabase 已提供全球 CDN，无需额外配置
5. **缓存**：Next.js 内置缓存机制，无需额外配置

---

## 备份与恢复

### 备份
```bash
# 备份环境变量
cp .env.local .env.local.bak

# 备份 Docker 数据
docker save dianbo-agent_dianbo-agent -o dianbo-agent-backup.tar

# 备份整个项目目录
tar -czf dianbo-agent-backup-$(date +%Y%m%d).tar.gz /opt/dianbo-agent
```

### 恢复
```bash
# 恢复环境变量
mv .env.local.bak .env.local

# 恢复 Docker 镜像
docker load -i dianbo-agent-backup.tar

# 恢复项目目录
tar -xzf dianbo-agent-backup-YYYYMMDD.tar.gz -C /opt/
```

---

## 技术支持

如遇到问题，可以：
1. 查看应用日志：`docker-compose logs -f`
2. 检查 GitHub Issues：https://github.com/sskks/customer-agent/issues
3. 联系技术支持

---

## 费用估算

以腾讯云为例（2024年价格参考）：

| 配置 | 月费用（元） | 说明 |
|------|-------------|------|
| 2核4G + 3Mbps | ~150-200 | 适合小型应用，日活 < 1000 |
| 4核8G + 5Mbps | ~300-400 | 适合中型应用，日活 < 5000 |
| 4核8G + 10Mbps | ~500-600 | 适合大型应用，日活 < 10000 |

**注意**：新用户通常有首年优惠，具体价格以腾讯云官网为准。

---

## 下一步

部署成功后，你可以：
1. ✅ 绑定域名并配置 HTTPS
2. ✅ 配置监控告警
3. ✅ 设置自动备份
4. ✅ 优化 SEO 和性能
5. ✅ 接入数据分析平台

祝部署顺利！🚀
