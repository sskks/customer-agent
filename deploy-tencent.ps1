# ================================================
# 店播AI Agent - 腾讯云一键部署脚本 (PowerShell)
# ================================================

Write-Host "`n=== 店播AI Agent - 腾讯云部署 ===" -ForegroundColor Cyan
Write-Host "此脚本将帮助你快速部署到腾讯云服务器`n" -ForegroundColor Gray

# ================================================
# 检查配置文件
# ================================================

if (-not (Test-Path ".env")) {
    Write-Host "⚠️  未找到 .env 配置文件" -ForegroundColor Yellow
    Write-Host "正在从模板创建...`n"
    Copy-Item ".env.production.example" ".env"
    Write-Host "✅ 已创建 .env 文件" -ForegroundColor Green
    Write-Host "`n请先编辑 .env 文件，填写以下配置：" -ForegroundColor Yellow
    Write-Host "  - QWEN_API_KEY (通义千问 API Key)"
    Write-Host "  - NEXT_PUBLIC_SUPABASE_URL"
    Write-Host "  - NEXT_PUBLIC_SUPABASE_ANON_KEY`n"
    Write-Host "编辑完成后重新运行此脚本`n"
    exit 1
}

Write-Host "✅ 配置文件 .env 已找到`n" -ForegroundColor Green

# ================================================
# 检查 SSH 连接
# ================================================

$serverIP = Read-Host "请输入腾讯云服务器 IP 地址"
if (-not $serverIP) {
    Write-Host "❌ 请输入服务器 IP 地址" -ForegroundColor Red
    exit 1
}

Write-Host "`n正在测试服务器连接..." -ForegroundColor Cyan

try {
    $testConnection = Test-Connection -ComputerName $serverIP -Count 2 -Quiet -ErrorAction Stop
    if (-not $testConnection) {
        Write-Host "❌ 无法连接到服务器 $serverIP" -ForegroundColor Red
        Write-Host "请检查：" -ForegroundColor Yellow
        Write-Host "  1. 服务器是否已启动"
        Write-Host "  2. 安全组是否开放了 22 端口"
        Write-Host "  3. IP 地址是否正确`n"
        exit 1
    }
    Write-Host "✅ 服务器连接正常`n" -ForegroundColor Green
} catch {
    Write-Host "❌ 无法连接到服务器：$_" -ForegroundColor Red
    exit 1
}

# ================================================
# 生成部署命令
# ================================================

Write-Host "=== 部署命令 ===" -ForegroundColor Cyan
Write-Host "`n请使用以下命令手动部署到服务器：`n" -ForegroundColor Yellow

Write-Host "--- 第一步：SSH 登录服务器 ---" -ForegroundColor Cyan
Write-Host "ssh root@$serverIP`n"

Write-Host "--- 第二步：在服务器上执行以下命令 ---" -ForegroundColor Cyan
Write-Host "cd /opt"
Write-Host "apt update && apt install -y git docker.io docker-compose"
Write-Host "git clone https://github.com/sskks/customer-agent.git dianbo-agent"
Write-Host "cd dianbo-agent"
Write-Host ""
Write-Host "# 编辑配置文件（填入你的 API Key）"
Write-Host "cp .env.production.example .env"
Write-Host "nano .env"
Write-Host ""
Write-Host "# 使用国内优化版构建并启动"
Write-Host "docker-compose -f docker-compose.cn.yml up -d --build"
Write-Host ""
Write-Host "# 查看日志"
Write-Host "docker-compose logs -f"
Write-Host ""

Write-Host "--- 第三步：访问应用 ---" -ForegroundColor Cyan
Write-Host "http://$serverIP`:3000`n"

Write-Host "=== 部署后需要配置 ===" -ForegroundColor Cyan
Write-Host "1. 安全组开放 3000 端口" -ForegroundColor Yellow
Write-Host "2. （可选）配置域名解析" -ForegroundColor Yellow
Write-Host "3. （可选）配置 HTTPS 证书`n" -ForegroundColor Yellow

Write-Host "✅ 部署指南已生成！" -ForegroundColor Green
Write-Host "`n如果需要更详细的帮助，请查看 TENCENT_CLOUD_DEPLOY.md 文件`n" -ForegroundColor Gray