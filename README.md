# SnippetButler

桌面端文本片段管理工具，基于 **Tauri v2 + React + TypeScript + SQLite**。

## 功能概览

- 聊天式输入框，快速保存文本片段
- 根据 `#标签` 自动提取并归类
- 支持置顶、收藏、待办标记、编辑、复制、复制 Markdown、删除
- 左侧边栏提供搜索、文件夹与标签筛选
- 主题适配：浅色（Ultramarine）与深色（Navy Blue）

## 技术栈

- 前端：React 18 + TypeScript + Vite
- 桌面壳：Tauri v2
- 后端（本地）：Rust + SQLx + SQLite
- 状态管理：Zustand

## 本地开发

### 1) 安装依赖

```bash
npm install
```

### 2) 启动开发模式

```bash
npm run tauri:dev
```

## 构建发布

```bash
npm run tauri:build
```

## 常用脚本

```bash
npm run dev         # 仅启动前端 Vite
npm run tauri:dev   # 启动 Tauri 开发环境
npm run lint        # ESLint 检查
npm run tauri:build # 构建桌面应用
```

## Git 版本管理与上传到 GitHub

远程仓库地址：

```bash
https://github.com/Knight5128/SnippetButler
```

### 首次上传（本地项目还没推送过）

在项目根目录依次执行：

```bash
git init
git add .
git commit -m "chore: initial project setup"
git branch -M main
git remote add origin https://github.com/Knight5128/SnippetButler.git
git push -u origin main
```

如果远程仓库已经有初始提交（例如你在 GitHub 网页端创建了 `LICENSE` 或 `README`），推送被拒绝时，先执行：

```bash
git fetch origin
git pull origin main --allow-unrelated-histories
```

处理完可能的冲突后，再执行：

```bash
git push -u origin main
```

### 每完成一个阶段后的推荐流程

```bash
git status
git add .
git commit -m "feat: 本阶段功能说明"
git push origin main
```

建议提交信息按阶段清晰描述，例如：

- `feat: add snippet tagging and filter panel`
- `fix: correct markdown copy formatting`
- `refactor: split sidebar and discovery modules`

### 可选：用功能分支开发（更安全）

```bash
git checkout -b feat/phase-2-search
# 开发...
git add .
git commit -m "feat: implement phase 2 search experience"
git push -u origin feat/phase-2-search
```

之后可在 GitHub 发起 Pull Request 合并到 `main`。

