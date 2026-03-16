import React, { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, FolderPlus, Plus, Tag as TagIcon } from "lucide-react";
import { useSnippetStore, type FilterMode } from "../stores/snippetStore";
import { useI18n } from "../i18n";

interface SidebarProps {
  search: string;
  onSearchChange: (value: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ search, onSearchChange }) => {
  const { language, t } = useI18n();
  const [foldersExpanded, setFoldersExpanded] = useState(true);
  const [tagsExpanded, setTagsExpanded] = useState(true);
  const [folderDraft, setFolderDraft] = useState("");
  const [tagDraft, setTagDraft] = useState("");
  const [showFolderInput, setShowFolderInput] = useState(false);
  const [showTagInput, setShowTagInput] = useState(false);
  const {
    snippets,
    folders,
    tags,
    activeFolderId,
    activeTag,
    filterMode,
    setFilterMode,
    setActiveFolderId,
    setActiveTag,
    createFolder,
    createTag
  } = useSnippetStore();

  const allCount = snippets.length;
  const todoCount = snippets.filter((s) => s.isTodo && !s.isDone).length;
  const favCount = snippets.filter((s) => s.isFavorite).length;
  const folderCountMap = new Map<string, number>();
  snippets.forEach((snippet) => {
    if (!snippet.folderId) return;
    folderCountMap.set(snippet.folderId, (folderCountMap.get(snippet.folderId) ?? 0) + 1);
  });

  const tagCountMap = new Map<string, number>();
  snippets.forEach((s) => {
    s.tags.forEach((t) => {
      tagCountMap.set(t, (tagCountMap.get(t) ?? 0) + 1);
    });
  });

  const visibleTags = useMemo(() => {
    const persistedTags = tags.map((tag) => tag.name);
    const dynamicTags = snippets.flatMap((snippet) => snippet.tags);
    return Array.from(new Set([...persistedTags, ...dynamicTags])).sort((a, b) =>
      a.localeCompare(b, language)
    );
  }, [language, snippets, tags]);

  const setMode = (mode: FilterMode) => {
    setFilterMode(mode);
    setActiveFolderId(null);
    setActiveTag(null);
  };

  const submitFolder = async () => {
    const trimmed = folderDraft.trim();
    if (!trimmed) return;
    await createFolder(trimmed);
    setFolderDraft("");
    setShowFolderInput(false);
    setFoldersExpanded(true);
  };

  const submitTag = async () => {
    const trimmed = tagDraft.trim();
    if (!trimmed) return;
    await createTag(trimmed);
    setTagDraft("");
    setShowTagInput(false);
    setTagsExpanded(true);
  };

  const handleFolderKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      void submitFolder();
    }
  };

  const handleTagKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      void submitTag();
    }
  };

  const SectionIcon = foldersExpanded ? ChevronDown : ChevronRight;
  const TagSectionIcon = tagsExpanded ? ChevronDown : ChevronRight;

  return (
    <aside className="flex h-full w-full flex-col gap-4 border-r border-black/5 bg-surface/80 px-3 py-4 backdrop-blur-sm">
      <div>
        <div className="mb-1 text-[11px] uppercase tracking-[0.24em] text-foreground/40">
          {t("workspace")}
        </div>
        <div className="mb-4 text-xl font-semibold text-primary">
          {t("appRailSnippets")}
        </div>
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t("searchSnippets")}
          className="w-full rounded-xl border border-black/5 bg-background/70 px-3 py-2 text-xs outline-none transition-colors focus:border-primary"
        />
      </div>

      <div className="space-y-1.5 text-xs">
        <button
          type="button"
          onClick={() => setMode("all")}
          className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-colors ${
            filterMode === "all" && !activeFolderId && !activeTag
              ? "bg-primary/10 text-primary"
              : "text-foreground/70 hover:bg-black/5"
          }`}
        >
          <span>{t("filterAll")}</span>
          <span className="text-[10px] opacity-70">{allCount}</span>
        </button>
        <button
          type="button"
          onClick={() => setMode("todo")}
          className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-colors ${
            filterMode === "todo"
              ? "bg-primary/10 text-primary"
              : "text-foreground/70 hover:bg-black/5"
          }`}
        >
          <span>{t("filterTodo")}</span>
          <span className="text-[10px] opacity-70">{todoCount}</span>
        </button>
        <button
          type="button"
          onClick={() => setMode("favorite")}
          className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-colors ${
            filterMode === "favorite"
              ? "bg-primary/10 text-primary"
              : "text-foreground/70 hover:bg-black/5"
          }`}
        >
          <span>{t("filterFavorites")}</span>
          <span className="text-[10px] opacity-70">{favCount}</span>
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto text-xs">
        <div>
          <div className="mb-2 flex items-center gap-1">
            <button
              type="button"
              onClick={() => setFoldersExpanded((value) => !value)}
              className="flex min-w-0 flex-1 items-center gap-1 rounded-xl px-2 py-1.5 text-[11px] uppercase tracking-wide text-foreground/50 hover:bg-black/5"
            >
              <SectionIcon className="h-3 w-3 shrink-0" />
              <span>{t("folders")}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setShowFolderInput((value) => !value);
                setFoldersExpanded(true);
              }}
              className="inline-flex h-7 w-7 items-center justify-center rounded-xl text-foreground/50 transition-colors hover:bg-black/5 hover:text-foreground/80"
              title={t("createFolder")}
            >
              <FolderPlus className="h-3.5 w-3.5" />
            </button>
          </div>
          {foldersExpanded && (
            <div className="space-y-1">
              {showFolderInput && (
                <div className="flex items-center gap-1 rounded-2xl border border-black/5 bg-background/70 p-1.5">
                  <input
                    value={folderDraft}
                    onChange={(event) => setFolderDraft(event.target.value)}
                    onKeyDown={handleFolderKeyDown}
                    placeholder={t("newFolder")}
                    className="min-w-0 flex-1 bg-transparent px-2 py-1 text-[11px] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => void submitFolder()}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-xl text-primary transition-colors hover:bg-primary/10"
                    disabled={!folderDraft.trim()}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  type="button"
                  onClick={() => {
                    setActiveFolderId(folder.id === activeFolderId ? null : folder.id);
                    setActiveTag(null);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-colors ${
                    folder.id === activeFolderId
                      ? "bg-primary/10 text-primary"
                      : "text-foreground/70 hover:bg-black/5"
                  }`}
                >
                  <span className="truncate">{folder.name}</span>
                  <span className="text-[10px] opacity-70">{folderCountMap.get(folder.id) ?? 0}</span>
                </button>
              ))}
              {folders.length === 0 && (
                <div className="text-[11px] text-foreground/40">
                  {t("noFolders")}
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <div className="mb-2 flex items-center gap-1">
            <button
              type="button"
              onClick={() => setTagsExpanded((value) => !value)}
              className="flex min-w-0 flex-1 items-center gap-1 rounded-xl px-2 py-1.5 text-[11px] uppercase tracking-wide text-foreground/50 hover:bg-black/5"
            >
              <TagSectionIcon className="h-3 w-3 shrink-0" />
              <span>{t("tags")}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setShowTagInput((value) => !value);
                setTagsExpanded(true);
              }}
              className="inline-flex h-7 w-7 items-center justify-center rounded-xl text-foreground/50 transition-colors hover:bg-black/5 hover:text-foreground/80"
              title={t("createTag")}
            >
              <TagIcon className="h-3.5 w-3.5" />
            </button>
          </div>
          {tagsExpanded && (
            <div className="space-y-1">
              {showTagInput && (
                <div className="flex items-center gap-1 rounded-2xl border border-black/5 bg-background/70 p-1.5">
                  <input
                    value={tagDraft}
                    onChange={(event) => setTagDraft(event.target.value)}
                    onKeyDown={handleTagKeyDown}
                    placeholder={t("newTag")}
                    className="min-w-0 flex-1 bg-transparent px-2 py-1 text-[11px] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => void submitTag()}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-xl text-primary transition-colors hover:bg-primary/10"
                    disabled={!tagDraft.trim()}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
              {visibleTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    setActiveTag(activeTag === tag ? null : tag);
                    setActiveFolderId(null);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-colors ${
                    activeTag === tag
                      ? "bg-primary/10 text-primary"
                      : "text-foreground/70 hover:bg-black/5"
                  }`}
                >
                  <span className="truncate">#{tag}</span>
                  <span className="text-[10px] opacity-70">{tagCountMap.get(tag) ?? 0}</span>
                </button>
              ))}
              {visibleTags.length === 0 && (
                <div className="text-[11px] text-foreground/40">
                  {t("noTags")}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

