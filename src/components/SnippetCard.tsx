import React, { useState } from "react";
import {
  CheckSquare,
  Ellipsis,
  Pin,
  Star,
  Trash2,
  Pencil,
  ClipboardCopy
} from "lucide-react";
import { useAppSettings } from "../appSettings";
import type { Snippet } from "../types";
import { useSnippetStore } from "../stores/snippetStore";
import { useI18n } from "../i18n";

interface SnippetCardProps {
  snippet: Snippet;
}

const SnippetCard: React.FC<SnippetCardProps> = ({ snippet }) => {
  const { toggleFlag, deleteSnippet, updateSnippet } = useSnippetStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(snippet.content);
  const { t } = useI18n();
  const { textSize } = useAppSettings();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(snippet.content);
  };

  const handleCopyMarkdown = async () => {
    const content = "```text\n" + snippet.content + "\n```";
    await navigator.clipboard.writeText(content);
  };

  const handleSaveEdit = async () => {
    const next = draft.trim();
    if (!next) return;
    await updateSnippet({ ...snippet, content: next });
    setIsEditing(false);
  };

  return (
    <article className="group relative rounded-[24px] border border-black/5 bg-surface/95 px-4 py-4 text-xs shadow-sm transition-colors hover:border-primary/20">
      <div className="absolute right-3 top-3 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          className={`inline-flex h-8 w-8 items-center justify-center rounded-full border text-[10px] transition-colors ${
            snippet.isPinned
              ? "border-primary bg-primary/10 text-primary"
              : "border-black/10 text-foreground/60 hover:border-primary/60"
          }`}
          onClick={() => toggleFlag(snippet.id, "isPinned")}
        >
          <Pin className="h-3 w-3" />
        </button>
        <button
          type="button"
          className={`inline-flex h-8 w-8 items-center justify-center rounded-full border text-[10px] transition-colors ${
            snippet.isFavorite
              ? "border-primary bg-primary/10 text-primary"
              : "border-black/10 text-foreground/60 hover:border-primary/60"
          }`}
          onClick={() => toggleFlag(snippet.id, "isFavorite")}
        >
          <Star className="h-3 w-3" />
        </button>
        <button
          type="button"
          className={`inline-flex h-8 w-8 items-center justify-center rounded-full border text-[10px] transition-colors ${
            snippet.isTodo
              ? "border-primary bg-primary/10 text-primary"
              : "border-black/10 text-foreground/60 hover:border-primary/60"
          }`}
          onClick={() => toggleFlag(snippet.id, "isTodo")}
        >
          <CheckSquare className="h-3 w-3" />
        </button>
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-black/10 text-foreground/60 transition-colors hover:border-primary/60"
          >
            <Ellipsis className="h-3 w-3" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 z-10 mt-2 w-40 overflow-hidden rounded-2xl border border-black/5 bg-surface shadow-lg text-[11px]">
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 transition-colors hover:bg-primary/10"
                onClick={() => {
                  setIsEditing(true);
                  setMenuOpen(false);
                }}
              >
                <Pencil className="h-3 w-3" />
                <span>{t("snippetEdit")}</span>
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 transition-colors hover:bg-primary/10"
                onClick={async () => {
                  await handleCopy();
                  setMenuOpen(false);
                }}
              >
                <ClipboardCopy className="h-3 w-3" />
                <span>{t("snippetCopy")}</span>
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 transition-colors hover:bg-primary/10"
                onClick={async () => {
                  await handleCopyMarkdown();
                  setMenuOpen(false);
                }}
              >
                <ClipboardCopy className="h-3 w-3" />
                <span>{t("snippetCopyMarkdown")}</span>
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-red-500 transition-colors hover:bg-red-50/80"
                onClick={async () => {
                  await deleteSnippet(snippet.id);
                  setMenuOpen(false);
                }}
              >
                <Trash2 className="h-3 w-3" />
                <span>{t("snippetDelete")}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="pr-28 whitespace-pre-wrap leading-relaxed text-foreground/80">
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="w-full rounded-2xl border border-black/10 bg-background/80 px-3 py-2 text-xs outline-none transition-colors focus:border-primary"
              style={{ fontSize: `${textSize}px` }}
              rows={4}
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="rounded-xl border border-black/10 px-3 py-1.5 text-[11px] text-foreground/60"
                onClick={() => {
                  setIsEditing(false);
                  setDraft(snippet.content);
                }}
              >
                {t("snippetCancel")}
              </button>
              <button
                type="button"
                className="rounded-xl bg-primary px-3 py-1.5 text-[11px] text-primary-foreground shadow-sm"
                onClick={() => void handleSaveEdit()}
              >
                {t("snippetSave")}
              </button>
            </div>
          </div>
        ) : (
          <span style={{ fontSize: `${textSize}px` }}>{snippet.content}</span>
        )}
      </div>

      {snippet.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {snippet.tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-[10px] text-primary"
            >
              #{t}
            </span>
          ))}
        </div>
      )}
    </article>
  );
};

export default SnippetCard;

