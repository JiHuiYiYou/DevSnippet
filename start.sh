#!/usr/bin/env bash
# DevSnippet 本地启动（macOS / Linux）
set -euo pipefail
cd "$(dirname "$0")"

PY="$(command -v python3 || command -v python || true)"
if [ -z "$PY" ]; then
  echo "[错误] 未找到 python3，请先安装 Python 3.10+"
  exit 1
fi

exec "$PY" scripts/bootstrap.py
