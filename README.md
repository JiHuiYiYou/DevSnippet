# DevSnippet

[![CI](https://github.com/JiHuiYiYou/DevSnippet/actions/workflows/ci.yml/badge.svg)](https://github.com/JiHuiYiYou/DevSnippet/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

轻量级开发者代码/脑洞存储工具 — Git 和笔记软件的辅助补充，解决临时代码存储、脑洞记录、项目计划梳理的轻量化需求。

## 功能

### 内容存储
- **代码块**：粘贴代码保留原始格式，不自动转富文本，原生 textarea 编辑无卡顿
- **Markdown**：支持基础 Markdown 语法，可切换编辑/预览模式
- **纯文本**：无格式快速记录

### 三级分区体系
- 工作区 → 文件夹 → 文件，支持无限层级嵌套
- 右键新建/重命名/删除
- 侧边栏目录树支持折叠展开，当前文件高亮

### 代码预览
- 预览模式下 Markdown 文件渲染 HTML，代码/文本文件显示纯文本
- 编辑模式下原生 textarea，保证粘贴/输入性能

### 快捷键
| 快捷键 | 功能 |
|--------|------|
| `Ctrl+S` | 即时保存 |
| `Ctrl+P` | 切换编辑/预览模式 |
| `Ctrl+B` | 折叠/展开侧边栏 |
| `Ctrl+K` | 打开全局搜索 |
| `Ctrl+N` | 新建文件 |
| `Ctrl+Shift+F` | 聚焦侧边栏搜索 |

### 内部跳转
- 在侧边栏搜索框输入 `#文件名` 直接跳转到对应文件
- 支持行号跳转：`#utils.py:10` 跳转到第 10 行

### 全局搜索（Ctrl+K）
- 按文件名搜索
- 按标签搜索
- 全文内容搜索

### 标签系统
- 每个文件/文件夹最多 10 个标签
- 侧边栏标签筛选

### 分享链接
- 支持文件/文件夹/工作区三级粒度的分享
- 可设置访问密码和过期时间（1 小时/1 天/7 天/永久）
- 需要启动后端服务

## 技术栈

| 层 | 选型 |
|----|------|
| 前端 | React 18 + Vite + TailwindCSS + Zustand |
| 后端 | Python FastAPI（仅分享功能） |
| 数据库 | IndexedDB（本地）/ SQLite（分享） |
| Markdown | marked |

## 运行

### 本地版（一键启动，推荐）

```bash
# Windows
start.bat
# macOS / Linux
./start.sh
```

自动完成：挑选 Python 解释器 → 创建 `.venv` → 安装后端依赖 → 构建前端（缺失时）→ 启动服务并打开浏览器。
访问 <http://localhost:8000>（前端与 API 同源）。

### 打包分发

```powershell
powershell -ExecutionPolicy Bypass -File scripts\package-local.ps1
```

产物 `release/DevSnippet-local-1.0.0.zip`（约 135 KB）已内置前端构建产物，解压后运行 `start.bat`
即可启动，**目标机器无需安装 Node.js**。

### 前端开发模式
```bash
cd frontend
npm install
npm run dev
```
访问 http://localhost:3000

### 后端（分享功能需要）
```bash
cd backend
pip install -r requirements.txt
python main.py
```
后端运行在 http://localhost:8000

## 数据存放位置

| 数据 | 位置 |
|------|------|
| 代码 / 笔记 / 标签 | 浏览器 IndexedDB（按浏览器独立存储，不上传） |
| 分享链接记录 | `backend/devsnippet.db`（SQLite） |
| 上传的图片 | `data/images/`（运行期目录，不进构建产物） |

## 限制

- V1.0 仅支持本地存储，不支持云同步
- 单文件最大 10MB
- 单个工作区最多 10000 个文件
- 前端打包体积 ≤1MB

## 变更记录

详见 [CHANGELOG.md](CHANGELOG.md)。
