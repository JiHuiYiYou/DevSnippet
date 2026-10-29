# 打包本地免部署版本（Windows）
# 用法：powershell -ExecutionPolicy Bypass -File scripts\package-local.ps1
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$version = (Get-Content frontend\package.json -Raw | ConvertFrom-Json).version
$outDir = Join-Path $root 'release'
$pkgDir = Join-Path $outDir "DevSnippet-local-$version"
$zipPath = Join-Path $outDir "DevSnippet-local-$version.zip"

if (-not (Test-Path 'frontend\dist\index.html')) {
    Write-Host '[1/3] 构建前端 ...' -ForegroundColor Cyan
    Push-Location frontend
    npm run build
    Pop-Location
    if (-not (Test-Path 'frontend\dist\index.html')) { throw '前端构建失败' }
} else {
    Write-Host '[1/3] 复用已有前端构建产物 frontend\dist' -ForegroundColor Cyan
}

Write-Host '[2/3] 准备打包目录 ...' -ForegroundColor Cyan
if (Test-Path $pkgDir) { Remove-Item $pkgDir -Recurse -Force }
New-Item -ItemType Directory -Force -Path "$pkgDir\backend\app", "$pkgDir\frontend", "$pkgDir\scripts" | Out-Null

Copy-Item 'start.bat', 'start.sh' $pkgDir
Copy-Item 'scripts\bootstrap.py' "$pkgDir\scripts\"
Copy-Item 'backend\main.py', 'backend\requirements.txt' "$pkgDir\backend\"
Copy-Item 'backend\app\*' "$pkgDir\backend\app\" -Recurse
Copy-Item 'frontend\dist' "$pkgDir\frontend\dist" -Recurse
Copy-Item 'scripts\package\README.md' "$pkgDir\README.md"

Get-ChildItem $pkgDir -Recurse -Directory -Filter '__pycache__' | Remove-Item -Recurse -Force

Write-Host '[3/3] 压缩 ...' -ForegroundColor Cyan
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
Compress-Archive -Path $pkgDir -DestinationPath $zipPath

$size = [math]::Round((Get-Item $zipPath).Length / 1KB, 1)
Write-Host ''
Write-Host "打包完成：$zipPath ($size KB)" -ForegroundColor Green
Write-Host "解压后运行 start.bat 即可启动（首次会自动安装 Python 依赖）。" -ForegroundColor Green
