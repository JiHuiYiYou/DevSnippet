# DevSnippet 本地版

轻量级开发者代码/脑洞存储工具 —— Git 和笔记软件的辅助补充。
本包为**本地免部署**版本：解压即用，前端已预先构建，无需 Node.js。

## 环境要求

- Windows 10+：双击 `start.bat`
- macOS / Linux：终端执行 `./start.sh`
- Python 3.10+（首次启动会自动创建 `.venv` 虚拟环境并安装依赖，需联网一次）
- 浏览器：Chrome / Edge / Firefox 均可

## 启动

双击 `start.bat`（或执行 `./start.sh`）后自动打开 <http://localhost:8000>。
关闭命令行窗口即停止服务。

## 数据存放位置

| 数据 | 位置 |
|------|------|
| 代码 / 笔记 / 标签 | 浏览器 IndexedDB（按浏览器独立存储，不上传） |
| 分享链接记录 | `backend/devsnippet.db`（SQLite） |
| 上传的图片 | `data/images/` |

备份建议：直接复制 `backend/devsnippet.db` 与 `data/` 目录；笔记数据请在浏览器中导出。

## 功能

- 三级分区：工作区 → 文件夹 → 文件，支持拖拽调整归属
- Markdown / 纯文本编辑与预览，原生 textarea 无卡顿
- 全局搜索（`Ctrl+K`）、标签筛选、`Ctrl+Shift+F` 聚焦侧边栏搜索
- 分享链接：文件 / 文件夹 / 工作区三级粒度，可设访问密码与过期时间
- 图片拖拽上传，Markdown 语法自动复制到剪贴板

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+S` | 即时保存 |
| `Ctrl+P` | 切换编辑 / 预览模式 |
| `Ctrl+B` | 折叠 / 展开侧边栏 |
| `Ctrl+K` | 打开全局搜索 |
| `Ctrl+Shift+F` | 聚焦侧边栏搜索 |

## 常见问题

**端口 8000 被占用** — 换个端口启动即可：
`cd backend && ..\.venv\Scripts\python -m uvicorn main:app --port 8080`，
然后浏览器访问 `http://localhost:8080`。
（分享功能依赖后端端口与前端同源，换端口后需在设置中同步修改「Share Server URL」。）

**依赖安装失败** — 首次启动需要联网下载 Python 依赖，国内网络可先切换 pip 镜像：
`.venv\Scripts\python -m pip install -i https://pypi.tuna.tsinghua.edu.cn/simple -r backend\requirements.txt`

**分享链接打不开** — 分享功能需要后端在运行；本地版前后端同源，若浏览器访问的地址与
`http://localhost:8000` 不一致（如 `127.0.0.1`），请在设置中把「Share Server URL」
改为当前访问地址。

## 限制

- V1.0 仅本地存储，不支持云同步
- 单文件最大 10MB
- 单个工作区最多 10000 个文件
