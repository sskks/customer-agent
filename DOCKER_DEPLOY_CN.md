# Docker 部署指南（国内服务器）

## 前提条件
- 一台国内服务器（阿里云、腾讯云等）
- 安装 Docker 和 Docker Compose

## 部署步骤

### 1. 创建 docker-compose.yml

在项目根目录创建 `docker-compose.yml`：

```yaml
version: '3.8'

services:
  dianbo-agent:
    build: .
    ports:
      - "3000:3000"
    environment:
      - QWEN_API_KEY=${QWEN_API_KEY}
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
    restart: always
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

### 2. 创建 Dockerfile

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
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["npm", "start"]
```

### 3. 创建 .env 文件

```bash
QWEN_API_KEY=sk-80d2d09cff77454c8aab0f416a6f61ad
NEXT_PUBLIC_SUPABASE_URL=https://zqwvmfncajrvafnfbfre.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. 构建并运行

```bash
docker-compose up -d --build
```

### 5. 配置 Nginx（可选，用于域名访问）

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
    }
}
```

## 访问地址

- 本地：http://服务器IP:3000
- 域名：http://your-domain.com（配置 Nginx 后）
