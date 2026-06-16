# ===========================================
# 店播AI Agent - 腾讯云部署辅助脚本 (Windows)
# 版本: v1.1.0 (Sprint 1)
# 更新日期: 2026-06-16
# ===========================================

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "店播AI Agent - 腾讯云部署辅助工具" -ForegroundColor Cyan
Write-Host "版本: v1.1.0 (Sprint 1)" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# 步骤 1: 检查 Git
Write-Host "[1/5] 检查 Git..." -ForegroundColor Yellow
try {
    $gitVersion = git --version
    Write-Host "✓ Git 已安装: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Git 未安装，请先安装 Git for Windows" -ForegroundColor Red
    Write-Host "下载地址: https://git-scm.com/download/win" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# 步骤 2: 检查代码是否已推送到 GitHub
Write-Host "[2/5] 检查代码状态..." -ForegroundColor Yellow
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host " 有未提交的更改，是否提交并推送？(Y/N)" -ForegroundColor Yellow
    $response = Read-Host
    if ($response -eq "Y" -or $response -eq "y") {
        Write-Host "提交更改..." -ForegroundColor Cyan
        git add -A
        git commit -m "Prepare for Tencent Cloud deployment"
        Write-Host "推送到 GitHub..." -ForegroundColor Cyan
        git push
        Write-Host "✓ 代码已推送" -ForegroundColor Green
    } else {
        Write-Host "⚠ 请手动提交并推送代码后再部署" -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "✓ 代码已是最新" -ForegroundColor Green
}
Write-Host ""

# 步骤 3: 显示部署说明
Write-Host "[3/5] 部署说明" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "请按照以下步骤在腾讯云服务器上执行部署：" -ForegroundColor White
Write-Host ""
Write-Host "1. SSH 登录到你的腾讯云服务器：" -ForegroundColor White
Write-Host "   ssh root@你的服务器IP" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. 执行自动部署脚本：" -ForegroundColor White
Write-Host "   cd /opt" -ForegroundColor Cyan
Write-Host "   curl -O https://raw.githubusercontent.com/sskks/customer-agent/master/deploy-to-tencent.sh" -ForegroundColor Cyan
Write-Host "   chmod +x deploy-to-tencent.sh" -ForegroundColor Cyan
Write-Host "   ./deploy-to-tencent.sh" -ForegroundColor Cyan
Write-Host ""
Write-Host "或者手动执行（推荐首次部署）：" -ForegroundColor White
Write-Host "   cd /opt" -ForegroundColor Cyan
Write-Host "   git clone https://github.com/sskks/customer-agent.git dianbo-agent" -ForegroundColor Cyan
Write-Host "   cd dianbo-agent" -ForegroundColor Cyan
Write-Host "   cp .env.example .env.local" -ForegroundColor Cyan
Write-Host "   nano .env.local  # 配置环境变量" -ForegroundColor Cyan
Write-Host "   docker-compose up -d --build" -ForegroundColor Cyan
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# 步骤 4: 打开部署文档
Write-Host "[4/5] 部署文档" -ForegroundColor Yellow
Write-Host "已创建以下部署文档：" -ForegroundColor White
Write-Host ""
Write-Host "📄 QUICK_DEPLOY.md          - 快速部署指南（推荐）" -ForegroundColor Cyan
Write-Host "📄 TENCENT_CLOUD_DEPLOY.md  - 详细部署文档" -ForegroundColor Cyan
Write-Host "📄 SPRINT1_SUMMARY.md       - Sprint 1 完成总结" -ForegroundColor Cyan
Write-Host "📄 PRODUCT_ROADMAP.md       - 产品路线图" -ForegroundColor Cyan
Write-Host ""
Write-Host "是否在浏览器中打开 QUICK_DEPLOY.md？(Y/N)" -ForegroundColor Yellow
$response = Read-Host
if ($response -eq "Y" -or $response -eq "y") {
    Start-Process "QUICK_DEPLOY.md"
}
Write-Host ""

# 步骤 5: 环境变量配置提醒
Write-Host "[5/5] 环境变量配置提醒" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "部署前需要准备以下环境变量：" -ForegroundColor White
Write-Host ""
Write-Host "1. 通义千问 API Key（必需）" -ForegroundColor White
Write-Host "   获取地址: https://dashscope.console.aliyun.com/apiKey" -ForegroundColor Cyan
Write-Host "   格式: sk-xxxxxxxxxxxxxxxx" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Supabase 配置（必需）" -ForegroundColor White
Write-Host "   URL: https://your-project.supabase.co" -ForegroundColor Cyan
Write-Host "   Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." -ForegroundColor Cyan
Write-Host "   获取地址: https://supabase.com/dashboard" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. 抖音热点 API Key（可选）" -ForegroundColor White
Write-Host "   如果不配置，系统会使用内置模拟数据" -ForegroundColor Gray
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# 完成
Write-Host "==========================================" -ForegroundColor Green
Write-Host "✓ 部署准备完成！" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "下一步：" -ForegroundColor Yellow
Write-Host "1. 确保你有腾讯云服务器并已安装 Docker" -ForegroundColor White
Write-Host "2. SSH 登录到服务器" -ForegroundColor White
Write-Host "3. 执行 deploy-to-tencent.sh 脚本或按照 QUICK_DEPLOY.md 手动部署" -ForegroundColor White
Write-Host "4. 配置环境变量（QWEN_API_KEY、SUPABASE_URL、SUPABASE_ANON_KEY）" -ForegroundColor White
Write-Host "5. 等待构建完成（首次构建约 5-10 分钟）" -ForegroundColor White
Write-Host "6. 访问 http://你的服务器IP:3000 验证功能" -ForegroundColor White
Write-Host ""
Write-Host "如有问题，请查看：" -ForegroundColor Yellow
Write-Host "- QUICK_DEPLOY.md 中的'常见问题排查'章节" -ForegroundColor Cyan
Write-Host "- TENCENT_CLOUD_DEPLOY.md 中的'故障排查'章节" -ForegroundColor Cyan
Write-Host "- GitHub Issues: https://github.com/sskks/customer-agent/issues" -ForegroundColor Cyan
Write-Host ""
Write-Host "祝部署顺利！🚀" -ForegroundColor Green
Write-Host ""
