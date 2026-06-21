$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

Write-Host "==> 读取本地 .env.local" -ForegroundColor Cyan

if (-not (Test-Path ".env.local")) {
  throw "找不到 .env.local，请先配置 DEEPSEEK_API_KEY"
}

Get-Content ".env.local" | ForEach-Object {
  if ($_ -match '^\s*([^#=]+)=(.*)$') {
    Set-Item -Path "env:$($matches[1].Trim())" -Value $matches[2].Trim()
  }
}

if (-not $env:DEEPSEEK_API_KEY) {
  throw "DEEPSEEK_API_KEY 为空"
}

if (-not $env:DEEPSEEK_MODEL) {
  $env:DEEPSEEK_MODEL = "deepseek-v4-flash"
}

Write-Host "==> 登录 Vercel（会打开浏览器）" -ForegroundColor Cyan
npx vercel login

Write-Host "==> 部署到 Vercel 生产环境" -ForegroundColor Cyan
npx vercel deploy --prod --yes `
  --env DEEPSEEK_API_KEY=$env:DEEPSEEK_API_KEY `
  --env DEEPSEEK_MODEL=$env:DEEPSEEK_MODEL

Write-Host ""
Write-Host "Vercel 部署完成。请在终端输出里复制 Production 链接。" -ForegroundColor Green
