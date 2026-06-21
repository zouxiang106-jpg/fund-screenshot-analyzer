# 在腾讯云服务器上运行（先 cd 到项目目录）：
#   cd C:\www\fund-screenshot-analyzer
#   powershell -ExecutionPolicy Bypass -File .\scripts\setup-server-env.ps1 -ApiKey "sk-你的密钥"

param(
  [Parameter(Mandatory = $true)]
  [string]$ApiKey
)

$projectRoot = Split-Path $PSScriptRoot -Parent
$envFile = Join-Path $projectRoot ".env.local"

$content = @(
  "DEEPSEEK_API_KEY=$ApiKey"
  "DEEPSEEK_MODEL=deepseek-v4-flash"
) -join "`n"

Set-Content -Path $envFile -Value $content -Encoding utf8NoBOM

Write-Host "已写入 $envFile"
Write-Host "请执行: pm2 restart fund-app"
Write-Host "然后浏览器打开: http://42.194.245.39:3000/api/health"
Write-Host "确认 hasApiKey 为 true 后再上传截图"
