param(
  [Parameter(Mandatory = $true)]
  [string]$GitHubUsername,

  [Parameter(Mandatory = $true)]
  [string]$GitHubToken,

  [string]$RepoName = "fund-screenshot-analyzer"
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

Write-Host "==> 正在 GitHub 创建仓库: $RepoName" -ForegroundColor Cyan

$headers = @{
  Authorization = "Bearer $GitHubToken"
  Accept        = "application/vnd.github+json"
}

$body = @{
  name        = $RepoName
  description = "基金截图智能分析网站"
  private     = $false
} | ConvertTo-Json

try {
  Invoke-RestMethod `
    -Uri "https://api.github.com/user/repos" `
    -Method Post `
    -Headers $headers `
    -Body $body `
    -ContentType "application/json" | Out-Null
} catch {
  if ($_.Exception.Message -notmatch "name already exists") {
    throw
  }
  Write-Host "仓库已存在，继续上传..." -ForegroundColor Yellow
}

$remoteUrl = "https://$GitHubUsername`:$GitHubToken@github.com/$GitHubUsername/$RepoName.git"

git remote remove origin 2>$null
git remote add origin $remoteUrl
git push -u origin main

Write-Host ""
Write-Host "GitHub 上传成功:" -ForegroundColor Green
Write-Host "https://github.com/$GitHubUsername/$RepoName"
