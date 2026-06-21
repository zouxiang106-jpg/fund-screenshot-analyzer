# 腾讯云服务器一键更新（在 C:\www\fund-screenshot-analyzer 里以管理员 PowerShell 运行）

Write-Host "=== 1. 拉取最新代码 ===" -ForegroundColor Cyan
git pull

Write-Host "=== 2. 安装依赖 ===" -ForegroundColor Cyan
npm install

Write-Host "=== 3. 打包 ===" -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "=== 4. 重启服务 ===" -ForegroundColor Cyan
pm2 delete fund-app 2>$null
pm2 start ecosystem.config.cjs
pm2 save

Write-Host "=== 5. 检查状态 ===" -ForegroundColor Cyan
pm2 list
curl.exe -s -o NUL -w "首页 HTTP: %{http_code}`n" http://127.0.0.1:3000/

Write-Host "`n完成！浏览器打开 http://42.194.245.39:3000" -ForegroundColor Green
Write-Host "上传 1 张截图后，点击「开始 AI 分析」按钮" -ForegroundColor Green
