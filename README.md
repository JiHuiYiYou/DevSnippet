# DevSnippet

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

## 限制

- V1.0 仅支持本地存储，不支持云同步
- 单文件最大 10MB
- 单个工作区最多 10000 个文件
- 前端打包体积 ≤1MB

## 修改记录

| 日期 | 内容 |
|------|------|
| 2026-05-12 | 初始版本 — 完成全部 P0/P1 功能的前端骨架和后端分享 API |
| 2026-05-12 | 修复：Zustand store getter 被 Object.assign 拍平导致文件选中不显示编辑区，改为组件内直接计算 |
| 2026-05-12 | 修复：右键"New Subfolder"→"New Folder"，新建文件夹/文件挂在被点击的文件夹下方，不限嵌套层级 |
| 2026-05-12 | 修复：统一命名 — 工作区默认名"Workspace"，文件夹"Folder"，文件"untitled" |
| 2026-05-12 | 修复：Ctrl+Shift+F 聚焦侧边栏搜索、侧边栏搜索支持无#号直接搜索文件名 |
| 2026-05-12 | 修复：移除 Ctrl+N（与浏览器新建窗口冲突）|
| 2026-05-12 | 新增：编辑区工具栏添加 Select All 和 Copy 按钮 |
| 2026-05-12 | 修复：Preview 模式代码高亮不生效 — Prism.js 改为静态 import + 引入 CSS 主题 |
| 2026-05-12 | 新增：工作区 Tab 支持双击重命名、右键菜单（重命名/删除）|
| 2026-05-12 | 修复：+Folder/+File 按钮改为在选中的文件夹下创建，而非始终在根目录 |
| 2026-05-12 | 修复：文件重命名时保留扩展名，只选中基础文件名部分 |
| 2026-05-12 | 重构：标签系统 — TagInput/TagBadge 组件、标签显示在编辑区和文件树、标签筛选、数据存于 file.tags |
| 2026-05-12 | 移除：删除 CodePreview 和 Prism.js 代码高亮（始终不生效），Preivew 模式仅保留 Markdown 渲染和纯文本 |
| 2026-05-12 | 修复：Markdown 预览改用 marked v12 `new Marked()` API，.md 文件创建/重命名时自动检测类型 |
| 2026-05-12 | 新增：侧边栏搜索框实时输入下拉菜单，显示匹配文件名和路径，点击直接打开 |
| 2026-05-12 | 新增：标签筛选时 Explorer 显示所有匹配文件的扁平列表（临时目录视图），含文件名和面包屑路径 |
| 2026-05-12 | 修复：Markdown 预览重构 — 优先使用 marked 库，失败则用内置简易渲染器（支持标题/粗体/代码块/链接），确保 # 语法正确渲染 |
| 2026-05-12 | 简化：V1.0 仅支持 .txt 和 .md 两种文件格式，默认创建 untitled.txt，移除 LanguageSelector 和所有编程语言选项 |
| 2026-05-12 | 修复：右键重命名文件允许编辑完整文件名（含扩展名），改 .txt 为 .md 自动切换类型；双击重命名保留扩展名 |
| 2026-05-12 | 新增：标签多选筛选 — 可同时选中多个标签，文件必须包含所有选中标签才显示；快捷标签 — 输入时下拉建议历史标签 |
| 2026-05-12 | 修复：Markdown 渲染器全面重写 — 支持标题/粗斜体/删除线/列表/引用/代码块/链接/图片/分隔线，换行不再被吞 |
| 2026-05-12 | 新增：拖拽文件移动到其他文件夹（拖到目标文件夹松手）；右键菜单新增 Copy（同目录复制文件）|
| 2026-05-12 | 重构：Markdown 预览改用 marked 静态 import + breaks/gfm 配置，完整支持 CommonMark 0.30 标准语法（标题/粗斜体/删除线/列表/引用/代码块/链接/图片/分隔线/表格），修复换行 bug |
| 2026-05-12 | 新增：文件夹支持拖拽移动（拖到目标文件夹松手即可移动文件夹）|
| 2026-05-12 | 修复：行号与实际行错位 — LineNumbers 行高改为与 textarea 一致的 1.5em，消除累积偏移 |
| 2026-05-12 | 新增：编辑区工具栏 Copy 右侧添加 Paste 按钮，读取剪贴板并插入光标位置 |
| 2026-05-12 | 修复：marked v12 中 `setOptions()` 已移除，改为 `marked.parse(src, { breaks, gfm })` 传递参数，Markdown 表格/代码块/链接等全面渲染正常 |
| 2026-05-12 | 新增：新建文件夹/文件后自动进入重命名状态，默认名称高亮选中，可直接输入新名称 |
| 2026-05-12 | 新增：双击文件夹节点进入重命名状态（与文件行为一致）|
| 2026-05-12 | 新增：VSCode 风格文件标签页栏 — 编辑区上方显示已打开文件标签，未编辑斜体/已编辑正常字体，未编辑标签打开新文件时自动替换，已编辑标签保留，支持关闭按钮、最多 10 个标签 |
| 2026-05-12 | 修复：文件复制改为完全克隆（内容+标签+类型+名称），新增文件夹复制（递归复制所有子文件夹和文件），右键菜单新增 Copy Folder |
| 2026-05-12 | 修复：Markdown 预览 — marked.parse() 在 v12 中可能返回 Promise，缺少 await 导致渲染 "[object Promise]"，改为 await 调用 |
| 2026-05-12 | 修复：行号对齐 — LineNumbers 改为 forwardRef + 固定宽度 w-12，滚动同步改为直接 DOM ref 操作绕过 React state 延迟，移除 textarea 冗余 leading-6 |
| 2026-05-12 | 新增：Ctrl+Z 撤销功能 — 回退到上次保存状态；自动保存不再清除 Tab 编辑标记，仅 Ctrl+S 清除；beforeunload 改为对比实际内容差异 |
| 2026-05-12 | 修复：行号滚动到文件末尾时不跟随 — 改用比例同步（`scrollTop/max` 映射），消除 line numbers 和 textarea 间 scrollHeight 差异导致的截断 |
| 2026-05-12 | 替换：Markdown 渲染方案从 marked 改为 react-markdown + react-syntax-highlighter（VSCode 风格代码块高亮），删除旧 src/lib/markdown.ts，移除 marked/prismjs 依赖 |
| 2026-05-13 | 移除：自定义 Ctrl+Z 拦截处理，改用浏览器原生 textarea 撤销堆栈，解决自动保存/撤销/标签页"打架"问题；删除 useEditorStore.undo() 方法 |
| 2026-05-13 | 移除：react-syntax-highlighter + @types/prismjs 依赖，删除 CodePreview/highlighter 组件；Markdown 预览代码块改为纯 pre/code 样式，不再加载语法高亮 |
| 2026-05-13 | 修复：移除 textarea `field-sizing: content` CSS 属性，恢复原生滚动条，鼠标滚轮正常滚动 textarea 内容 |
| 2026-05-13 | 新增：明暗色主题切换按钮（太阳/月亮 SVG 图标），位于顶部标题栏 V1.0 左侧；启动时从 localStorage 读取并应用已保存主题 |
| 2026-05-14 | 修复：新建文件夹/文件时自动展开父级目录（`expandParentsOf` 现在也展开目标文件夹自身），确保新创建的项目在侧边栏中可见 |
| 2026-05-14 | 修复：Ctrl+S 保存后不再清除 Tab 编辑标记，保存过的文件视为"已编辑"不会被自动替换；仅手动打开但从未编辑的文件才可被替换 |
| 2026-05-14 | 重构：Markdown 文件改为分屏视图 — 左侧 textarea 编辑器 + 右侧实时 Markdown 预览（参考 markdownlivepreview.com），支持拖拽分隔条调整左右比例；textarea 滚动时预览区按比例联动滚动 |
| 2026-05-14 | 新增：GitHub 风格 Markdown CSS（`src/markdown.css`）— `.markdown-body` 命名空间，支持明暗色主题，覆盖标题/代码块/表格/引用/列表等元素样式 |
| 2026-05-14 | 简化：MarkdownPreview 移除了所有自定义 react-markdown 组件（code/table/td/th），统一由 `markdown-body` CSS 接管样式 |
| 2026-05-14 | 重构：行号栏（LineNumbers）改为单个 `<pre>` 文本元素渲染（替代每个行号一个 div），滚动同步改用 requestAnimationFrame，移除滚动中冗余的 React state 更新，消除卡顿和累积偏移 |
| 2026-05-14 | 修复：Markdown 图片在暗色模式下 SVG 可见性；增强表格样式；新增图片标题居中样式 |
| 2026-05-14 | 新增：Ctrl+S 保存时 "Saved" Toast 反馈；文件名旁蓝色圆点表示"有未保存更改"（保存后消失）；`touchedFiles` 集合跟踪"曾编辑过的文件"（保存不清除），用于标签页保留；Tab 栏斜体/正常字体基于 touchedFiles |
| 2026-05-14 | 新增：Markdown 文件 Sync scroll 复选框（工具栏），默认关闭，勾选后 textarea 滚动时预览区按比例联动滚动 |
| 2026-05-14 | 重构：行号与编辑器改为共享滚动容器 — 行号和 textarea 放在同一个 `overflow-y-auto` 容器内，textarea 设为 `overflow:hidden` + JS 自动高度（完全展开内容），二者天然同步滚动，完全消除对不齐和卡顿问题 |
| 2026-05-14 | 修复：`markSaved` 不再将文件加入 `touchedFiles`，仅 `setContent`（实际编辑）才标记为已编辑；手动保存未编辑过的临时文件不会变为永久标签页 |
| 2026-05-14 | 修复：暗色模式下 Sync scroll 复选框降低透明度 + 灰色强调色，视觉更低调 |
| 2026-05-14 | 增强：Markdown 表格新增 thead 底部边框、tbody 末行底部边框、`height:auto` 图片自适应；暗色模式图片背景可见性 |
| 2026-05-14 | 修复：安装 `remark-gfm` 插件使 react-markdown 正确解析 GFM 表格；替换 `markdown.css` 为完整 GitHub 风格 CSS（严格匹配 markdown-live-preview 参考项目），覆盖表格/图片/代码块/引用/列表等全部元素 |
| 2026-05-14 | 修复：Sync scroll 移除 requestAnimationFrame 节流，改为直接调用 `scrollTo()`（严格复刻 markdown-live-preview 的 `onDidScrollChange` 实现），消除左右滚动联动卡顿 |
| 2026-05-14 | 修复：行号与编辑器 textarea 显式设置相同 padding-top/bottom/margin，确保垂直方向像素级对齐 |
| 2026-05-14 | 修复：标签页替换逻辑改为查找任意未编辑标签页进行替换（而非仅检查当前活跃标签页），解决"打开文件时斜体标签页有时不被顶掉"的问题 |
| 2026-05-14 | 修复：文件重命名在 Enter 键触发时先捕获值再清除状态，避免 blur 事件二次执行导致偶发无响应 |
| 2026-05-14 | 修复：新建文件重命名改为 `__new__` 模式 — 去掉创建时立即调用 `openFileInTab`（避免 TabBar 重渲染导致输入框失焦），支持编辑完整文件名（含扩展名），无扩展名默认 `.txt`；`openFileInTab` 改为 `setTimeout` 延迟执行，确保 React 先完成重命名输入框卸载，修复重命名后右键菜单不工作 |
| 2026-05-14 | 新增：行号栏当前编辑行高亮 — CodeTextarea 跟踪光标位置传给 LineNumbers，活跃行号变色加粗；textarea 高度同步到行号栏 `height`（替代 `minHeight`），修复底部行号缺失；行号栏添加柔和背景色 `bg-gray-50/50` + 细化分割线，匹配 Monaco 风格 |
| 2026-05-14 | 新增：编辑区当前行浅色背景高亮 — textarea 动态 `linear-gradient` 背景精确覆盖当前行（`rgba(0,0,0,0.04)`），配合 `background-attachment: local` 随滚动，复刻 Monaco 当前行效果 |
| 2026-05-14 | 修复：回退复选框颜色改动（恢复原 `opacity-50 accent-gray-400`）；Sync scroll 文字颜色从 `text-gray-400` 改为 `text-gray-500`，与工具栏其他文字颜色一致 |
| 2026-05-14 | 清理：删除 SearchBar 中 `#filename` 跳转逻辑、`useInternalJump.ts` 文件、`resolveJump` store 方法、全局搜索提示文字等已废弃的 # 搜索遗留代码 |
| 2026-05-14 | 新增：图片拖拽上传功能 — 后端 `POST /api/upload-image` 接口保存图片到 `public/images/`；前端 `ImageDropZone` 组件支持拖拽/点击上传，上传后自动复制 Markdown 语法到剪贴板 |
| 2026-05-14 | 修复：右键 Rename 点击无反应 — `handleContextMenu` 中 `files` 缺失依赖导致闭包捕获旧数据，改为直接从 Zustand store 读取最新 `files`/`folders`/`workspaces` |
| 2026-05-14 | 重构：行号栏从 `<div>` + `<span>` 改为 `<textarea readOnly>` 渲染，与编辑器 textarea 共享完全一致的原生 textarea 文本度量（scrollHeight 像素级相同），彻底消除行号与代码行对不齐的问题。活跃行高亮改为蓝色半透明 `linear-gradient` 背景（`rgba(59,130,246,0.12)`） |
| 2026-05-14 | 修复：后端 `requirements.txt` 新增 `python-multipart==0.0.9`（FastAPI 文件上传必需依赖）；确保 `pip install -r requirements.txt` 后后端可正常启动 |
| 2026-05-15 | 修复：行号错位的真正根因 — Markdown分屏编辑器宽度较窄导致长行自动换行（word-wrap），一个逻辑行变为多个视觉行，而旧行号栏每逻辑行只显示一个行号，导致后续行号全部错位。解决方案：LineNumbers通过Canvas测量等宽字体字符宽度，结合textarea内容宽度计算每行换行数，在行号文本中为续行插入空白行，使行号文本的视觉行数与编辑器完全一致。同时活跃行高亮覆盖当前逻辑行的所有视觉行（复刻 markdown-live-preview 的 Monaco 行为）|
| 2026-05-15 | 修复：切换长短文件后编辑区下方出现大片空白 — 文件切换effect中scrollTop重置提前于auto-height effect执行，旧文件的textarea高度残留，改为`requestAnimationFrame`延迟scrollTop重置到auto-height更新之后，并同时重置textarea自身和行号栏的scrollTop |
| 2026-05-15 | 修复：后端启动报错`TypeError: Can't replace canonical symbol for '__firstlineno__'`（SQLAlchemy 2.0.30与Python 3.13不兼容），升级`requirements.txt`中sqlalchemy为`>=2.0.35` |
| 2026-05-15 | 修复：行号换行计算不准 — Canvas 数学计算无法准确模拟浏览器 word-wrap 行为（词边界断行），改为隐藏 div 浏览器原生测量：对可能换行的长行用隐藏 div 精确测量 visual line 数量，短行仍用快速估计，消除行号错位 |
| 2026-05-15 | 修复：编辑区滚动条拉到最底部出现大片空白 — 切换文件/调整分屏宽度后 auto-height 未及时更新导致 textarea 高度残留或 scrollTop 超出范围。CodeTextarea 新增 ResizeObserver 监听宽度变化触发 auto-height，高度更新后自动 clamp scrollTop |
| 2026-05-15 | 新增：后端图片静态资源访问 — `main.py` 将 `frontend/public/` 挂载为 FastAPI 静态资源目录（`StaticFiles`），`http://localhost:8000/images/xxx.jpg` 可正常访问图片 |
| 2026-05-15 | 改进：上传接口返回新增 `path`（Markdown 相对路径）和 `url`（图片完整可访问地址）字段 |
| 2026-05-15 | 新增：图片路径查看器 — 上传区域旁新增 `Imgs` 按钮，点击弹出浮层显示所有已上传图片缩略图（60px），hover 显示存储路径，点击缩略图/路径文本自动复制到剪贴板 |
| 2026-05-15 | 新增：分享功能前端承接 — 访问 `/share/:shareId` 自动拉取后端 API 数据，复用现有编辑/预览组件渲染 DevSnippet 风格界面；只读分享强制预览模式并隐藏编辑按钮，非只读分享默认预览支持切换编辑；新增 `ShareView` 组件、Vite `/api` 代理、更新分享链接指向前端 |
| 2026-05-15 | 修复：`useAutoSave`/`useKeyboardShortcuts` 在分享路由中跳过（防止分享数据误写入 IndexedDB）；清理 `vite.config.ts` 中已废弃的 prism/marked manualChunks |
# DevSnippet
