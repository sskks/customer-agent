#!/bin/bash

# ===========================================
# 店播AI Agent - 腾讯云自动部署脚本
# 版本: v1.1.0 (Sprint 1)
# 更新日期: 2026-06-16
# ===========================================

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 分隔线
print_separator() {
    echo "=========================================="
}

# ===========================================
# 步骤 1: 检查前置条件
# ===========================================
print_separator
log_info "步骤 1/7: 检查前置条件..."
print_separator

# 检查是否在服务器根目录或 /opt
if [ ! -d "/opt" ]; then
    log_error "未在 Linux 服务器上运行，或 /opt 目录不存在"
    exit 1
fi

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    log_error "Docker 未安装，请先安装 Docker"
    log_info "参考命令: curl -fsSL https://get.docker.com | sh"
    exit 1
fi

# 检查 Docker Compose 是否安装
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    log_error "Docker Compose 未安装，请先安装 Docker Compose"
    log_info "参考命令: sudo curl -L \"https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-\$(uname -s)-\$(uname -m)\" -o /usr/local/bin/docker-compose && sudo chmod +x /usr/local/bin/docker-compose"
    exit 1
fi

# 检查 Git 是否安装
if ! command -v git &> /dev/null; then
    log_error "Git 未安装，请先安装 Git"
    log_info "参考命令: yum install -y git (CentOS) 或 apt-get install -y git (Ubuntu)"
    exit 1
fi

log_success "前置条件检查通过"
echo ""

# ===========================================
# 步骤 2: 克隆或更新代码
# ===========================================
print_separator
log_info "步骤 2/7: 克隆或更新代码..."
print_separator

cd /opt

if [ -d "dianbo-agent" ]; then
    log_warning "发现已有 dianbo-agent 目录"
    read -p "是否删除旧版本并重新克隆？(y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "删除旧版本..."
        rm -rf dianbo-agent
        log_info "克隆最新代码..."
        git clone https://github.com/sskks/customer-agent.git dianbo-agent
        log_success "代码克隆完成"
    else
        log_info "进入现有目录并更新..."
        cd dianbo-agent
        git pull origin master
        log_success "代码更新完成"
    fi
else
    log_info "克隆最新代码..."
    git clone https://github.com/sskks/customer-agent.git dianbo-agent
    log_success "代码克隆完成"
fi

cd dianbo-agent
echo ""

# ===========================================
# 步骤 3: 配置环境变量
# ===========================================
print_separator
log_info "步骤 3/7: 配置环境变量..."
print_separator

if [ ! -f ".env.local" ]; then
    log_info "创建 .env.local 文件..."
    cp .env.example .env.local
    
    log_warning "请编辑 .env.local 文件并填入你的实际配置"
    log_info "需要配置以下变量："
    echo "  - QWEN_API_KEY (通义千问 API Key)"
    echo "  - NEXT_PUBLIC_SUPABASE_URL (Supabase URL)"
    echo "  - NEXT_PUBLIC_SUPABASE_ANON_KEY (Supabase Anon Key)"
    echo ""
    
    read -p "是否现在编辑 .env.local 文件？(y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        nano .env.local
    else
        log_warning "请稍后手动配置 .env.local 文件"
        log_info "命令: nano .env.local"
    fi
else
    log_success ".env.local 文件已存在"
fi

# 检查必需的环境变量是否已配置
if [ -f ".env.local" ]; then
    if grep -q "sk-your-qwen-api-key-here" .env.local || \
       grep -q "your-project.supabase.co" .env.local || \
       grep -q "your-anon-public-key-here" .env.local; then
        log_error "环境变量尚未正确配置，请编辑 .env.local 文件"
        log_info "命令: nano .env.local"
        exit 1
    fi
    log_success "环境变量配置检查通过"
fi
echo ""

# ===========================================
# 步骤 4: 停止旧容器（如果有）
# ===========================================
print_separator
log_info "步骤 4/7: 停止旧容器..."
print_separator

if [ "$(docker ps -q -f name=dianbo-agent)" ]; then
    log_info "发现运行中的容器，正在停止..."
    docker-compose down
    log_success "旧容器已停止"
else
    log_info "没有运行中的容器"
fi
echo ""

# ===========================================
# 步骤 5: 构建并启动新容器
# ===========================================
print_separator
log_info "步骤 5/7: 构建并启动新容器..."
print_separator

log_info "开始构建 Docker 镜像（首次构建可能需要 5-10 分钟）..."
docker-compose up -d --build

log_success "容器启动完成"
echo ""

# 等待容器启动
log_info "等待容器启动（10 秒）..."
sleep 10

# ===========================================
# 步骤 6: 验证部署
# ===========================================
print_separator
log_info "步骤 6/7: 验证部署..."
print_separator

# 检查容器状态
log_info "检查容器状态..."
CONTAINER_STATUS=$(docker-compose ps --format "{{.Status}}" | head -1)

if [[ "$CONTAINER_STATUS" == *"Up"* ]] && [[ "$CONTAINER_STATUS" == *"healthy"* ]]; then
    log_success "容器状态: 正常运行 (healthy)"
elif [[ "$CONTAINER_STATUS" == *"Up"* ]]; then
    log_warning "容器状态: 运行中但未健康检查通过"
    log_info "可能需要更多时间启动，请稍后检查"
else
    log_error "容器状态异常: $CONTAINER_STATUS"
    log_info "查看日志: docker-compose logs -f"
    exit 1
fi

# 测试应用响应
log_info "测试应用响应..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 || echo "000")

if [ "$HTTP_CODE" == "200" ]; then
    log_success "应用响应正常 (HTTP 200)"
else
    log_warning "应用响应异常 (HTTP $HTTP_CODE)"
    log_info "可能需要更多时间启动，请稍后重试"
fi
echo ""

# ===========================================
# 步骤 7: 显示访问信息和验证清单
# ===========================================
print_separator
log_info "步骤 7/7: 部署完成！"
print_separator

# 获取服务器 IP
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || echo "你的服务器IP")

log_success " 部署成功完成！"
echo ""
log_info "访问地址: http://${SERVER_IP}:3000"
log_info "或在浏览器中输入: http://你的服务器IP:3000"
echo ""

print_separator
log_info "📋 功能验证清单"
print_separator
echo ""
echo "请按以下清单验证功能是否正常："
echo ""
echo "✅ 1. 用户认证"
echo "   □ 能够注册/登录"
echo "   □ 登录后显示用户信息"
echo "   □ 退出登录正常工作"
echo ""
echo "✅ 2. 新手引导"
echo "   □ 新用户首次登录显示引导弹窗"
echo "   □ 能够选择行业（8 个选项）"
echo "   □ 能够输入店铺名称"
echo "   □ 资料保存到数据库"
echo ""
echo "✅ 3. 推荐生成"
echo "   □ 输入行业和店铺名称后能生成推荐"
echo "   □ 推荐列表正常显示（5 条推荐）"
echo "   □ 反馈按钮（👍 😐 👎）正常工作"
echo ""
echo "✅ 4. 脚本生成"
echo "   □ 点击'生成脚本'能打开弹窗"
echo "   □ AI 脚本正常生成（5-10 秒）"
echo "   □ 脚本内容显示完整"
echo ""
echo "✅ 5. 导出与分享"
echo "   □ '📋 复制文案'按钮能复制到剪贴板"
echo "   □ '💾 下载TXT'按钮能下载文件"
echo "   □ '📤 分享'按钮能打开分享菜单"
echo ""
echo "✅ 6. SEO"
echo "   □ 页面标题显示正确"
echo "   □ 访问 /sitemap.xml 能看到 sitemap"
echo "   □ 访问 /robots.txt 能看到 robots 配置"
echo ""
echo "✅ 7. 移动端适配"
echo "   □ 在手机浏览器上能正常访问"
echo "   □ 页面布局自适应屏幕宽度"
echo ""

print_separator
log_info "🔧 常用运维命令"
print_separator
echo ""
echo "# 查看容器状态"
echo "docker-compose ps"
echo ""
echo "# 查看实时日志"
echo "docker-compose logs -f"
echo ""
echo "# 重启服务"
echo "docker-compose restart"
echo ""
echo "# 停止服务"
echo "docker-compose down"
echo ""
echo "# 更新应用"
echo "cd /opt/dianbo-agent && git pull origin master && docker-compose up -d --build"
echo ""

print_separator
log_info "📚 相关文档"
print_separator
echo ""
echo "- 快速部署指南: QUICK_DEPLOY.md"
echo "- 详细部署文档: TENCENT_CLOUD_DEPLOY.md"
echo "- Sprint 1 总结: SPRINT1_SUMMARY.md"
echo "- 产品路线图: PRODUCT_ROADMAP.md"
echo ""

log_success "祝使用愉快！🚀"
print_separator
