# 腾讯云强制重装最新版（管理员 PowerShell，整段复制运行）
# 项目目录：C:\www\fund-screenshot-analyzer

$ErrorActionPreference = "Stop"
$ProjectDir = "C:\www\fund-screenshot-analyzer"
$RepoUrl = "https://github.com/zouxiang106-jpg/fund-screenshot-analyzer.git"

Write-Host "=== 检查 Node / Git ===" -ForegroundColor Cyan
node -v
git --version

if (-not (Test-Path $ProjectDir)) {
  Write-Host "目录不存在，正在克隆..." -ForegroundColor Yellow
  New-Item -ItemType Directory -Path "C:\www" -Force | Out-Null
  git clone $RepoUrl $ProjectDir
}

Set-Location $ProjectDir

Write-Host "`n=== 强制同步 GitHub 最新代码 ===" -ForegroundColor Cyan
git fetch origin
git reset --hard origin/main
git log -1 --oneline

$healthFile = Join-Path $ProjectDir "src\app\api\health\route.ts"
if (-not (Test-Path $healthFile)) {
  Write-Host "错误：源码里没有 health 路由，请检查 git 是否拉取成功" -ForegroundColor Red
  exit 1
}
Write-Host "health 源码 OK: $healthFile" -ForegroundColor Green

Write-Host "`n=== 安装依赖并打包 ===" -ForegroundColor Cyan
npm install
npm run build
if ($LASTEXITCODE -ne 0) {
  Write-Host "build 失败，请把上面红色报错截图发我" -ForegroundColor Red
  exit $LASTEXITCODE
}

$builtHealth = Join-Path $ProjectDir ".next\server\app\api\health\route.js"
if (-not (Test-Path $builtHealth)) {
  Write-Host "警告：build 后未找到 $builtHealth" -ForegroundColor Yellow
} else {
  Write-Host "build 产物 OK: $builtHealth" -ForegroundColor Green
}

Write-Host "`n=== 重启 PM2 ===" -ForegroundColor Cyan
pm2 delete fund-app 2>$null
pm2 start ecosystem.config.cjs
pm2 save
pm2 list

Write-Host "`n=== 本机测试 ===" -ForegroundColor Cyan
curl.exe -s -o NUL -w "首页: %{http_code}`n" http://127.0.0.1:3000/
curl.exe -s http://127.0.0.1:3000/api/health

Write-Host "`n若上面 health 返回 JSON（hasApiKey:true），外网打开:" -ForegroundColor Green
Write-Host "http://42.194.245.39:3000" -ForegroundColor Green
