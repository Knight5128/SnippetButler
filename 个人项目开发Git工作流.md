---
topics:
 - '[[Github]]'
 - '[[个人开发]]'
 - '[[Git工作流]]'
 - '[[📖知识合集]]'
alias:
tags: "#默认笔记"
cdate: 2026-03-18 00:00
mdate: 2026-03-18
uid: 20260318000000
cssclass:
---
# Metadata
Status:: 非常重要
Flag:: 1
Source Type:: #📥/💭想法
Task:: "[[]]"
Platform:: Github
Category:: "[[经验之谈]]"
Author:: "[[me]]"
Source URL::
Summary:: 适用于个人项目的日常开发、提交、打标签与发布 release 的 Git 工作流。
## 工作流总览
个人项目，默认采用 `main` 直推 + 重要改动走功能分支的方式。
推荐流程如下：
1. 本地拉取 `main` 最新代码。
2. 小改动直接在 `main` 开发，大改动新建 `feat/*`、`fix/*`、`refactor/*` 分支。
3. 开发完成后先自测，再执行 `git status`、`git diff` 检查改动。
4. 按统一提交规范提交。
5. 推送到 GitHub。
6. 需要发版本时，先统一更新版本号，再打 `tag`，最后发布 GitHub Release 并上传安装包。
## 仓库信息
当前仓库地址：
```bash
https://github.com/Knight5128/SnippetButler.git
```
默认分支：
```bash
main
```
## 首次克隆与环境准备
首次进入项目：
```bash
git clone https://github.com/Knight5128/SnippetButler.git
cd SnippetButler
npm install
```
本地开发：
```bash
npm run tauri:dev
```
本地检查：
```bash
npm run lint
```
本地构建：
```bash
npm run tauri:build
```
## 日常开发流程
如果只是小改动，直接在 `main` 上开发即可：
```bash
git checkout main
git pull origin main
```
开发完成后：
```bash
git status
git diff
git add .
git commit -m "fix: correct snippet search result update"
git push origin main
```
如果是中等以上改动，建议切功能分支：
```bash
git checkout main
git pull origin main
git checkout -b feat/snippet-quick-filter
```
开发完成后：
```bash
git status
git diff
git add .
git commit -m "feat: add quick filter for snippet list"
git push -u origin feat/snippet-quick-filter
```
如果你想保留更清晰的记录，可以在 GitHub 上发起一个 PR，再合并回 `main`。
## 分支命名规范
推荐统一使用英文短语，结构清晰，避免中文和空格。
分支名示例：
- `feat/snippet-quick-filter`
- `fix/tag-parser-edge-case`
- `refactor/sidebar-state-management`
- `docs/update-release-workflow`
- `chore/upgrade-tauri-deps`
建议规则：
- 新功能用 `feat/`
- 缺陷修复用 `fix/`
- 重构用 `refactor/`
- 文档调整用 `docs/`
- 工程维护、依赖升级、脚本调整用 `chore/`
## 提交规范
提交信息建议统一使用：
```bash
<type>: <summary>
```
常用 `type`：
- `feat`：新增功能
- `fix`：修复问题
- `refactor`：重构实现但不改变功能
- `docs`：文档修改
- `style`：纯格式调整，不改逻辑
- `chore`：构建、依赖、脚本、工程配置调整
- `perf`：性能优化
- `test`：测试相关
提交示例：
```bash
git commit -m "feat: add pinned snippets section"
git commit -m "fix: prevent duplicate tag extraction"
git commit -m "refactor: simplify snippet list state flow"
git commit -m "docs: add project git workflow note"
git commit -m "chore: upgrade tauri dependencies"
```
建议：
- 一次提交只做一类事情。
- 提交说明尽量写清楚“这次改了什么”。
- 不要把半成品、调试代码、无关格式化混进同一次提交。
## 开发过程中的常用命令
查看状态：
```bash
git status
```
查看未暂存改动：
```bash
git diff
```
查看已暂存改动：
```bash
git diff --cached
```
查看提交历史：
```bash
git log --oneline --decorate --graph -10
```
撤销工作区某个文件的修改：
```bash
git restore src/App.tsx
```
撤销暂存：
```bash
git restore --staged src/App.tsx
```
同步远程主分支：
```bash
git checkout main
git pull origin main
```
## 版本号管理
`SnippetButler` 当前版本号同时存在于这 3 个位置，发版前要保持一致：
- `package.json`
- `src-tauri/tauri.conf.json`
- `src-tauri/Cargo.toml`
例如把版本从 `0.1.0` 升到 `0.2.0` 时，这 3 个文件都要改成：
```bash
0.2.0
```
推荐版本规则：
- `0.x.y`：项目早期阶段，功能仍在快速变化。
- `x.y.z`：遵循语义化版本。
- `x`：主版本，大改动或不兼容变更。
- `y`：次版本，新功能增加且兼容旧版本。
- `z`：修订版本，问题修复或小幅优化。
对个人项目，通常可以这样用：
- 新增一批明确功能：`0.1.0` -> `0.2.0`
- 修复 bug 或小优化：`0.2.0` -> `0.2.1`
- 大改界面、数据结构或发布方式：`0.2.1` -> `0.3.0`
## 版本提交与打 Tag
发布前推荐流程：
1. 完成功能开发并确认 `main` 代码稳定。
2. 修改版本号文件。
3. 提交一个明确的版本提交。
4. 打版本标签。
5. 推送提交和标签。
示例命令：
```bash
git checkout main
git pull origin main
git add package.json src-tauri/tauri.conf.json src-tauri/Cargo.toml
git commit -m "chore: release v0.2.0"
git tag -a v0.2.0 -m "Release v0.2.0"
git push origin main
git push origin v0.2.0
```
查看标签：
```bash
git tag
```
删除本地标签：
```bash
git tag -d v0.2.0
```
删除远程标签：
```bash
git push origin :refs/tags/v0.2.0
```
建议标签统一使用：
```bash
v0.2.0
```
即在语义化版本前加一个 `v`。
## Release 包发布步骤
`SnippetButler` 是 Tauri 桌面应用，正式安装包通过构建命令生成。
建议发布步骤如下：
1. 确认工作区干净。
2. 拉取最新 `main`。
3. 更新版本号并提交。
4. 打 `tag` 并推送。
5. 本地执行打包。
6. 到 GitHub 创建 Release。
7. 上传安装包与可选的更新日志。
推荐命令：
```bash
git status
git checkout main
git pull origin main
npm install
npm run lint
npm run tauri:build
```
构建产物通常在：
```bash
src-tauri/target/release/bundle/
```
Windows 下请以该目录中的实际文件为准再上传，常见会包含安装包文件。
如果使用 GitHub 网页发布：
1. 打开仓库的 `Releases` 页面。
2. 点击 `Draft a new release`。
3. 选择刚刚推送的标签，例如 `v0.2.0`。
4. Release title 填写 `v0.2.0` 或 `SnippetButler v0.2.0`。
5. 在说明里写本次更新内容。
6. 上传 `src-tauri/target/release/bundle/` 下的安装包。
7. 点击 `Publish release`。
如果使用 GitHub CLI：
```bash
gh release create v0.2.0 src-tauri/target/release/bundle/** --title "SnippetButler v0.2.0" --notes "Windows release for SnippetButler v0.2.0."
```
如果命令行通配符在当前环境下不稳定，也可以手动把具体文件路径逐个写上。
## 建议的 Release 说明模板
```md
## 更新内容
- 新增：
- 优化：
- 修复：
## 说明
- 安装后如被系统拦截，请手动确认信任。
- 升级前建议备份本地数据。
```
## 推荐的个人项目习惯
- 每次开始开发前先 `git pull origin main`。
- 每完成一个独立功能就提交一次，不要堆很多改动再一次性提交。
- 发版提交和普通功能提交分开。
- 发版前一定先本地构建一次。
- `tag`、Release 标题、应用版本号三者保持一致。
- 文档更新尽量和功能一起提交，避免版本发布后文档滞后。
## SnippetButler 的推荐最小流程
日常开发最常用的一套命令：
```bash
git checkout main
git pull origin main
git checkout -b feat/your-feature
# 开发
npm run lint
git status
git add .
git commit -m "feat: your feature summary"
git push -u origin feat/your-feature
```
发版最常用的一套命令：
```bash
git checkout main
git pull origin main
# 修改 package.json、src-tauri/tauri.conf.json、src-tauri/Cargo.toml 版本号
git add package.json src-tauri/tauri.conf.json src-tauri/Cargo.toml
git commit -m "chore: release v0.2.0"
git tag -a v0.2.0 -m "Release v0.2.0"
git push origin main
git push origin v0.2.0
npm install
npm run lint
npm run tauri:build
```
