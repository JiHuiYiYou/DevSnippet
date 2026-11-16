@echo off
chcp 65001 >nul
cd /d "%~dp0"

rem NOTE: keep this file ASCII-only. cmd.exe decodes the whole batch file with the
rem console codepage in effect before "chcp" runs, so non-ASCII text gets mangled.
rem NOTE: no parentheses inside an if-block, cmd would parse them as a command group.
rem Order matters: the py launcher and miniconda/anaconda are native Windows
rem Pythons. MSYS2/MinGW builds cannot install PyPI precompiled wheels
rem (bcrypt etc.), and the MSYS2 one cannot even run ensurepip to create a venv.
set "BOOT_PY="
if not defined BOOT_PY (
  where py >nul 2>nul && set "BOOT_PY=py"
)
if not defined BOOT_PY if exist "%USERPROFILE%\miniconda3\python.exe" set "BOOT_PY=%USERPROFILE%\miniconda3\python.exe"
if not defined BOOT_PY if exist "%USERPROFILE%\anaconda3\python.exe" set "BOOT_PY=%USERPROFILE%\anaconda3\python.exe"
if not defined BOOT_PY (
  where python >nul 2>nul && set "BOOT_PY=python"
)
if not defined BOOT_PY (
  where python3 >nul 2>nul && set "BOOT_PY=python3"
)

if not defined BOOT_PY (
  echo [ERROR] No native Windows Python found.
  echo         Install Python 3.10+ from python.org or miniconda.
  pause
  exit /b 1
)

"%BOOT_PY%" scripts\bootstrap.py
if errorlevel 1 pause
