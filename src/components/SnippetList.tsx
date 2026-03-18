import React, { useMemo } from "react";
import { useSnippetStore } from "../stores/snippetStore";
import { useI18n } from "../i18n";
import SnippetCard from "./SnippetCard";

interface SnippetListProps {
  search: string;
}

const SnippetList: React.FC<SnippetListProps> = ({ search }) => {
  const { snippets, activeFolderId, activeTag, filterMode, loading } = useSnippetStore();
  const { t } = useI18n();

  const filtered = useMemo(() => {
    let list = snippets.filter((s) => !s.isArchived && s.deletedAt === null);

    if (filterMode === "todo") {
      list = list.filter((s) => s.isTodo && !s.isDone);
    } else if (filterMode === "favorite") {
      list = list.filter((s) => s.isFavorite);
    }

    if (activeFolderId) {
      list = list.filter((s) => s.folderId === activeFolderId);
    }

    if (activeTag) {
      list = list.filter((s) => s.tags.includes(activeTag));
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((s) => s.content.toLowerCase().includes(q));
    }

    return [...list].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.createdAt - a.createdAt;
    });
  }, [snippets, activeFolderId, activeTag, filterMode, search]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center px-5 py-6">
        <div className="rounded-3xl border border-dashed border-black/10 bg-background/70 px-6 py-12 text-center text-xs text-foreground/60">
          {t("loadingSnippets")}
        </div>
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center px-5 py-6">
        <div className="max-w-md rounded-3xl border border-dashed border-black/10 bg-background/70 px-6 py-12 text-center text-sm leading-6 text-foreground/55 shadow-sm">
          {t("emptySnippets")}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-3 overflow-y-auto px-5 py-5">
      {filtered.map((s) => (
        <SnippetCard key={s.id} snippet={s} />
      ))}
    </div>
  );
};

export default SnippetList;

