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

## 开发指南

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
