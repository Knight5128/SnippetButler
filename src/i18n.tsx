/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";

export type AppLanguage = "en" | "zh-CN" | "ja-JP";

type TranslationValues = Record<string, number | string>;

const STORAGE_KEY = "snippetbutler.language";
const DEFAULT_LANGUAGE: AppLanguage = "en";

const translations = {
  en: {
    appRailSnippets: "Snippets",
    appRailDiscovery: "Discovery",
    appRailArchivedDeleted: "Archived/\nDeleted",
    appRailSettings: "Settings",
    quickSaveHeader: "Quickly save your text snippets",
    switchToDark: "Switch to dark",
    switchToLight: "Switch to light",
    workspace: "Workspace",
    searchSnippets: "Search snippets...",
    filterAll: "All",
    filterTodo: "Todo",
    filterFavorites: "Favorites",
    folders: "Folders",
    createFolder: "Create folder",
    newFolder: "New folder",
    noFolders: "No folders yet",
    tags: "Tags",
    createTag: "Create tag",
    newTag: "New tag",
    noTags: "No tags yet",
    discovery: "Discovery",
    discoveryIntro:
      "Bring ideas, saved items, and knowledge entry points together in a space built for exploration.",
    books: "Books",
    booksSectionIntro:
      "This area is reserved for reading lists, reading cards, and highlight sync. The UI is ready now, and book import, reading progress, and highlighted excerpts can be connected next.",
    pendingBookshelfTitle: "Bookshelf coming soon",
    pendingBookshelfDescription:
      "Show recently read titles, saved books, and topic-based shelves.",
    highlightSyncTitle: "Highlight sync",
    highlightSyncDescription:
      "Turn reading highlights into snippets automatically, then review and refine them later.",
    vault: "My Vault",
    vaultIntro:
      "Treat your snippet collection like a personal knowledge vault. This overview can grow into recommendations, reviews, topic clusters, and cross-source discovery.",
    statSnippets: "Snippets",
    statFolders: "Folders",
    statTags: "Tags",
    recommendationTitle: "Recommended directions",
    recommendationOne: "Generate topic entries from tag popularity",
    recommendationTwo: "Turn high-frequency snippets into long-term knowledge cards",
    recommendationThree: "Combine recent favorites and todos into a daily review view",
    roadmapTitle: "Roadmap",
    roadmapDescription:
      "Discovery is currently a front-end framework page and is ready for AI recommendations, book import, topic clustering, and multi-source knowledge aggregation.",
    vaultItemsSaved: "{count} items saved",
    booksPanelDescription: "Immersive reading and saved books",
    archiveTabArchived: "Archived",
    archiveTabRecycleBin: "Recycle Bin",
    archiveNotice:
      "Items in Archive will be deleted automatically after 30 days.",
    recycleNotice:
      "Recycle Bin is currently a front-end placeholder. Restore and permanent delete actions can be connected next.",
    emptyArchivedTitle: "No archived snippets yet",
    emptyRecycleTitle: "Recycle Bin is empty",
    emptyArchivedDescription:
      "There are no snippets marked as archived yet. The page styling is ready, and the real archive flow can be connected next.",
    emptyRecycleDescription:
      "This remains a placeholder page for now. Restore, bulk cleanup, and automatic expiration can be added later.",
    settingsAccount: "Account",
    settingsAvatar: "Avatar",
    settingsDisplayName: "Display Name",
    settingsDataSync: "Data Sync",
    settingsImportNotes: "Import Notes",
    settingsExportNotes: "Export Notes",
    settingsPreferences: "Preferences",
    settingsFeatureSettings: "Feature Settings",
    settingsLanguage: "Language",
    settingsThemeMode: "Theme Mode",
    settingsPrivacySecurity: "Privacy & Security",
    settingsUserNotice: "User Notice",
    settingsPrivacyPolicy: "Privacy Policy",
    settingsSecondaryPassword: "Secondary Password",
    featureTextSizeTitle: "Text Size",
    featureTextSizeDescription:
      "The font size of your notes changes as you adjust it here.",
    featureTextSizeMin: "Min",
    featureTextSizeStandard: "Standard",
    featureTextSizeMax: "Max",
    featureShortcutsTitle: "Shortcuts",
    featureShortcutSend: "Send shortcut:",
    featureShortcutNewLine: "New line shortcut:",
    featureShortcutToggleWindow: "Show/Hide:",
    shortcutEnter: "Enter",
    shortcutShiftEnter: "Shift + Enter",
    settingsContact: "Contact",
    settingsAbout: "About",
    settingsFeedback: "Feedback",
    settingsOther: "Other",
    settingsReleaseNotes: "Release Notes",
    settingsVersion: "Version",
    themeLight: "Light",
    themeDark: "Dark",
    contentUnderReview: "Content under review",
    feedbackChannelBuilding: "Feedback channel under construction",
    releaseNote010Item1: "Completed the first settings page layout and multi-language support.",
    releaseNote010Item2: "Added account customization, theme switching, and text size adjustment.",
    releaseNote010Item3: "Reserved entry points for feature settings, feedback, and follow-up updates.",
    secondaryPasswordCurrent: "Current password",
    secondaryPasswordNew: "New 4-digit password",
    secondaryPasswordConfirm: "Confirm new password",
    secondaryPasswordNext: "Next",
    secondaryPasswordSave: "Save",
    secondaryPasswordVerified: "Current password verified. You can now set a new password.",
    secondaryPasswordHint: "The initial password is 0000.",
    secondaryPasswordInvalidCurrent: "The current password is incorrect.",
    secondaryPasswordInvalidFormat: "Please enter a 4-digit password.",
    secondaryPasswordMismatch: "The two new passwords do not match.",
    secondaryPasswordSaved: "Secondary password updated.",
    filterText: "Text",
    inputPlaceholder: "Type a snippet to save here, supports #tags...",
    snippetEdit: "Edit",
    snippetCopy: "Copy",
    snippetCopyMarkdown: "Copy Markdown",
    snippetDelete: "Delete",
    snippetCancel: "Cancel",
    snippetSave: "Save",
    loadingSnippets: "Loading snippets...",
    emptySnippets:
      "No snippets yet. Try sending a text snippet from the input bar below.",
    avatarCropTitle: "Crop Avatar",
    avatarCropConfirm: "Confirm",
    avatarCropCancel: "Cancel",
    editNicknameTitle: "Edit Display Name",
    editNicknamePlaceholder: "Enter a new display name",
    editNicknameConfirm: "Confirm",
    editNicknameCancel: "Cancel"
  },
  "zh-CN": {
    appRailSnippets: "片段",
    appRailDiscovery: "发现",
    appRailArchivedDeleted: "归档/回收站",
    appRailSettings: "设置",
    quickSaveHeader: "快速保存你的文本片段",
    switchToDark: "切换到深色",
    switchToLight: "切换到浅色",
    workspace: "工作区",
    searchSnippets: "搜索片段...",
    filterAll: "全部",
    filterTodo: "待办",
    filterFavorites: "收藏",
    folders: "文件夹",
    createFolder: "创建文件夹",
    newFolder: "新建文件夹",
    noFolders: "暂无文件夹",
    tags: "标签",
    createTag: "创建标签",
    newTag: "新建标签",
    noTags: "暂无标签",
    discovery: "发现",
    discoveryIntro: "将灵感、收藏与知识入口集中到一个更适合探索的区域。",
    books: "书籍",
    booksSectionIntro:
      "这里预留给书单、阅读卡片和摘录联动。当前先实现前端结构，后续可以接入书籍导入、阅读进度和高亮摘录。",
    pendingBookshelfTitle: "待接入书单",
    pendingBookshelfDescription: "展示最近阅读、收藏书籍和按主题分类的书架。",
    highlightSyncTitle: "摘录联动",
    highlightSyncDescription:
      "将阅读摘录自动沉淀为片段，并支持回顾与再次创作。",
    vault: "我的金库",
    vaultIntro:
      "把片段库视作个人知识金库。这里先提供概览式前端页面，后续可以扩展推荐、回顾、主题聚合和跨来源发现能力。",
    statSnippets: "片段",
    statFolders: "文件夹",
    statTags: "标签",
    recommendationTitle: "推荐探索方向",
    recommendationOne: "按标签热度生成主题入口",
    recommendationTwo: "将高频片段整理成长期知识卡片",
    recommendationThree: "把最近收藏和待办混合成今日回顾视图",
    roadmapTitle: "近期规划",
    roadmapDescription:
      "发现页当前为前端框架页，适合后续接入 AI 推荐、书籍导入、主题聚类与多来源知识汇总。",
    vaultItemsSaved: "已沉淀 {count} 条内容",
    booksPanelDescription: "沉浸式阅读与收藏",
    archiveTabArchived: "已归档",
    archiveTabRecycleBin: "回收站",
    archiveNotice: "归档内的内容将在 30 天后自动删除",
    recycleNotice:
      "回收站内容当前仅实现前端页面，后续接入恢复与彻底删除逻辑",
    emptyArchivedTitle: "暂无已归档内容",
    emptyRecycleTitle: "回收站还是空的",
    emptyArchivedDescription:
      "当前还没有被标记为归档的片段。此页面样式已就绪，后续可以接入真实归档流程。",
    emptyRecycleDescription:
      "这里先保留为前端占位页，后续可接入恢复、批量清理和到期自动删除。",
    settingsAccount: "账号设置",
    settingsAvatar: "头像",
    settingsDisplayName: "昵称",
    settingsDataSync: "数据同步",
    settingsImportNotes: "导入笔记",
    settingsExportNotes: "导出笔记",
    settingsPreferences: "偏好设置",
    settingsFeatureSettings: "功能设置",
    settingsLanguage: "语言",
    settingsThemeMode: "主题模式",
    settingsPrivacySecurity: "隐私与安全",
    settingsUserNotice: "用户须知",
    settingsPrivacyPolicy: "隐私协议",
    settingsSecondaryPassword: "二级密码",
    featureTextSizeTitle: "文本大小",
    featureTextSizeDescription: "笔记文字的大小将随着你调整界面而更改。",
    featureTextSizeMin: "最小",
    featureTextSizeStandard: "标准",
    featureTextSizeMax: "最大",
    featureShortcutsTitle: "快捷键",
    featureShortcutSend: "发送快捷键:",
    featureShortcutNewLine: "换行快捷键:",
    featureShortcutToggleWindow: "显示/隐藏:",
    shortcutEnter: "Enter",
    shortcutShiftEnter: "Shift + Enter",
    settingsContact: "联系我们",
    settingsAbout: "关于我们",
    settingsFeedback: "反馈意见",
    settingsOther: "其他",
    settingsReleaseNotes: "更新日志",
    settingsVersion: "版本号",
    themeLight: "浅色",
    themeDark: "深色",
    contentUnderReview: "内容审核中",
    feedbackChannelBuilding: "反馈通道建设中",
    releaseNote010Item1: "完成首版设置页结构与多语言支持。",
    releaseNote010Item2: "加入账号自定义、主题切换与文本大小调节能力。",
    releaseNote010Item3: "预留功能设置、反馈入口与后续版本更新承接区域。",
    secondaryPasswordCurrent: "旧密码",
    secondaryPasswordNew: "新的四位数密码",
    secondaryPasswordConfirm: "再次输入新密码",
    secondaryPasswordNext: "下一步",
    secondaryPasswordSave: "保存设置",
    secondaryPasswordVerified: "旧密码验证通过，现在可以设置新密码。",
    secondaryPasswordHint: "初始密码为 0000。",
    secondaryPasswordInvalidCurrent: "旧密码输入错误。",
    secondaryPasswordInvalidFormat: "请输入四位数字密码。",
    secondaryPasswordMismatch: "两次输入的新密码不一致。",
    secondaryPasswordSaved: "二级密码已更新。",
    filterText: "文本",
    inputPlaceholder: "在这里输入要保存的文本片段，支持 #标签...",
    snippetEdit: "编辑",
    snippetCopy: "复制",
    snippetCopyMarkdown: "复制 Markdown",
    snippetDelete: "删除",
    snippetCancel: "取消",
    snippetSave: "保存",
    loadingSnippets: "正在加载片段...",
    emptySnippets: "暂无片段，试着在底部输入框中发送一条文本吧。",
    avatarCropTitle: "裁剪头像",
    avatarCropConfirm: "确认",
    avatarCropCancel: "取消",
    editNicknameTitle: "修改昵称",
    editNicknamePlaceholder: "请输入新昵称",
    editNicknameConfirm: "确认",
    editNicknameCancel: "取消"
  },
  "ja-JP": {
    appRailSnippets: "スニペット",
    appRailDiscovery: "発見",
    appRailArchivedDeleted: "アーカイブ/\n削除済み",
    appRailSettings: "設定",
    quickSaveHeader: "テキストスニペットをすばやく保存",
    switchToDark: "ダークに切り替え",
    switchToLight: "ライトに切り替え",
    workspace: "ワークスペース",
    searchSnippets: "スニペットを検索...",
    filterAll: "すべて",
    filterTodo: "ToDo",
    filterFavorites: "お気に入り",
    folders: "フォルダー",
    createFolder: "フォルダーを作成",
    newFolder: "新しいフォルダー",
    noFolders: "フォルダーはまだありません",
    tags: "タグ",
    createTag: "タグを作成",
    newTag: "新しいタグ",
    noTags: "タグはまだありません",
    discovery: "発見",
    discoveryIntro:
      "アイデア、保存済み項目、知識への入口を、探索しやすいひとつの場所にまとめます。",
    books: "書籍",
    booksSectionIntro:
      "このエリアは読書リスト、読書カード、ハイライト同期のための場所です。今は UI を先に用意し、次に書籍の取り込み、読書進捗、ハイライト抜粋を接続できます。",
    pendingBookshelfTitle: "今後追加する本棚",
    pendingBookshelfDescription:
      "最近読んだ本、保存済みの本、トピック別の本棚を表示します。",
    highlightSyncTitle: "ハイライト同期",
    highlightSyncDescription:
      "読書ハイライトを自動でスニペット化し、あとから見直して再編集できます。",
    vault: "マイボールト",
    vaultIntro:
      "スニペット集を個人の知識ボールトとして扱います。この概要ページは、今後おすすめ、レビュー、トピック集約、複数ソースからの発見へ拡張できます。",
    statSnippets: "スニペット",
    statFolders: "フォルダー",
    statTags: "タグ",
    recommendationTitle: "おすすめの探索方向",
    recommendationOne: "タグの人気度からトピック入口を生成する",
    recommendationTwo: "高頻度のスニペットを長期的な知識カードに整理する",
    recommendationThree:
      "最近のお気に入りと ToDo を組み合わせて今日のレビュー画面を作る",
    roadmapTitle: "今後の計画",
    roadmapDescription:
      "発見ページは現在フロントエンドの骨組み段階で、今後 AI レコメンド、書籍取り込み、トピッククラスタリング、複数ソースの知識集約に対応できます。",
    vaultItemsSaved: "{count} 件を保存中",
    booksPanelDescription: "没入型の読書と保存済み書籍",
    archiveTabArchived: "アーカイブ",
    archiveTabRecycleBin: "ごみ箱",
    archiveNotice:
      "アーカイブ内の項目は 30 日後に自動削除されます。",
    recycleNotice:
      "ごみ箱は現在フロントエンドのプレースホルダーです。復元と完全削除は今後接続できます。",
    emptyArchivedTitle: "アーカイブ済みのスニペットはありません",
    emptyRecycleTitle: "ごみ箱は空です",
    emptyArchivedDescription:
      "まだアーカイブ済みのスニペットはありません。このページの UI は準備できており、次に実際のアーカイブフローを接続できます。",
    emptyRecycleDescription:
      "このページは今のところプレースホルダーです。復元、一括整理、自動期限切れは後で追加できます。",
    settingsAccount: "アカウント",
    settingsAvatar: "アバター",
    settingsDisplayName: "表示名",
    settingsDataSync: "データ同期",
    settingsImportNotes: "ノートをインポート",
    settingsExportNotes: "ノートをエクスポート",
    settingsPreferences: "環境設定",
    settingsFeatureSettings: "機能設定",
    settingsLanguage: "言語",
    settingsThemeMode: "テーマモード",
    settingsPrivacySecurity: "プライバシーとセキュリティ",
    settingsUserNotice: "ユーザー向け案内",
    settingsPrivacyPolicy: "プライバシーポリシー",
    settingsSecondaryPassword: "二次パスワード",
    featureTextSizeTitle: "文字サイズ",
    featureTextSizeDescription:
      "ノートの文字サイズは、ここでの調整に合わせて変わります。",
    featureTextSizeMin: "最小",
    featureTextSizeStandard: "標準",
    featureTextSizeMax: "最大",
    featureShortcutsTitle: "ショートカット",
    featureShortcutSend: "送信ショートカット:",
    featureShortcutNewLine: "改行ショートカット:",
    featureShortcutToggleWindow: "表示/非表示:",
    shortcutEnter: "Enter",
    shortcutShiftEnter: "Shift + Enter",
    settingsContact: "お問い合わせ",
    settingsAbout: "このアプリについて",
    settingsFeedback: "フィードバック",
    settingsOther: "その他",
    settingsReleaseNotes: "リリースノート",
    settingsVersion: "バージョン",
    themeLight: "ライト",
    themeDark: "ダーク",
    contentUnderReview: "内容は審査中です",
    feedbackChannelBuilding: "フィードバック窓口を準備中です",
    releaseNote010Item1: "初期設定ページの構成と多言語対応を完成しました。",
    releaseNote010Item2: "アカウントのカスタマイズ、テーマ切り替え、文字サイズ調整を追加しました。",
    releaseNote010Item3: "機能設定、フィードバック、今後の更新を受け止める導線を用意しました。",
    secondaryPasswordCurrent: "現在のパスワード",
    secondaryPasswordNew: "新しい 4 桁のパスワード",
    secondaryPasswordConfirm: "新しいパスワードを再入力",
    secondaryPasswordNext: "次へ",
    secondaryPasswordSave: "保存",
    secondaryPasswordVerified: "現在のパスワードを確認しました。新しいパスワードを設定できます。",
    secondaryPasswordHint: "初期パスワードは 0000 です。",
    secondaryPasswordInvalidCurrent: "現在のパスワードが正しくありません。",
    secondaryPasswordInvalidFormat: "4 桁の数字を入力してください。",
    secondaryPasswordMismatch: "2 回入力した新しいパスワードが一致しません。",
    secondaryPasswordSaved: "二次パスワードを更新しました。",
    filterText: "テキスト",
    inputPlaceholder:
      "保存したいスニペットをここに入力してください。#タグ に対応しています...",
    snippetEdit: "編集",
    snippetCopy: "コピー",
    snippetCopyMarkdown: "Markdown をコピー",
    snippetDelete: "削除",
    snippetCancel: "キャンセル",
    snippetSave: "保存",
    loadingSnippets: "スニペットを読み込み中...",
    emptySnippets:
      "まだスニペットがありません。下の入力欄からテキストを送信してみてください。",
    avatarCropTitle: "アバターを切り抜く",
    avatarCropConfirm: "確認",
    avatarCropCancel: "キャンセル",
    editNicknameTitle: "表示名を変更",
    editNicknamePlaceholder: "新しい表示名を入力してください",
    editNicknameConfirm: "確認",
    editNicknameCancel: "キャンセル"
  }
} as const;

type TranslationKey = keyof (typeof translations)["en"];

interface I18nContextValue {
  language: AppLanguage;
  languageOptions: Array<{ value: AppLanguage; label: string }>;
  setLanguage: (language: AppLanguage) => void;
  t: (key: TranslationKey, values?: TranslationValues) => string;
  formatDate: (timestamp: number) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function isAppLanguage(value: string): value is AppLanguage {
  return value === "en" || value === "zh-CN" || value === "ja-JP";
}

function interpolate(template: string, values?: TranslationValues): string {
  if (!values) {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = values[key];
    return value === undefined ? "" : String(value);
  });
}

function getInitialLanguage(): AppLanguage {
  if (typeof window === "undefined") {
    return DEFAULT_LANGUAGE;
  }

  const storedLanguage = window.localStorage.getItem(STORAGE_KEY);
  return storedLanguage && isAppLanguage(storedLanguage)
    ? storedLanguage
    : DEFAULT_LANGUAGE;
}

export const I18nProvider: React.FC<React.PropsWithChildren> = ({
  children
}) => {
  const [language, setLanguage] = useState<AppLanguage>(getInitialLanguage);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  const t = useCallback(
    (key: TranslationKey, values?: TranslationValues) =>
      interpolate(translations[language][key] ?? translations.en[key], values),
    [language]
  );

  const formatDate = useCallback(
    (timestamp: number) =>
      new Intl.DateTimeFormat(language, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      }).format(timestamp),
    [language]
  );

  const value = useMemo<I18nContextValue>(
    () => ({
      language,
      languageOptions: [
        { value: "en", label: "English" },
        { value: "zh-CN", label: "简体中文" },
        { value: "ja-JP", label: "日本語" }
      ],
      setLanguage,
      t,
      formatDate
    }),
    [formatDate, language, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }

  return context;
}
