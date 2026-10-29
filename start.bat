@echo off
chcp 65001 >nul
cd /d "%~dp0"

set "BOOT_PY="
for %%P in (py python python3) do (
  if not defined BOOT_PY (
    where %%P >nul 2>nul && set "BOOT_PY=%%P"
  )
)

if not defined BOOT_PY (
  echo [错误] 未找到 Python，请先安装 Python 3.10+ 并加入 PATH
  pause
  exit /b 1
)

%BOOT_PY% scripts\bootstrap.py
if errorlevel 1 pause
