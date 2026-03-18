import React, { useEffect, useMemo, useState } from "react";
import {
  CircleAlert,
  Ellipsis,
  Inbox,
  RotateCcw,
  Trash2
} from "lucide-react";
import { useAppSettings } from "../appSettings";
import { useSnippetStore } from "../stores/snippetStore";
import { useI18n } from "../i18n";

type ArchiveTab = "archive" | "recycle";

const ArchiveView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ArchiveTab>("archive");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const snippets = useSnippetStore((state) => state.snippets);
  const unarchiveSnippet = useSnippetStore((state) => state.unarchiveSnippet);
  const deleteSnippet = useSnippetStore((state) => state.deleteSnippet);
  const restoreSnippet = useSnippetStore((state) => state.restoreSnippet);
  const permanentlyDeleteSnippet = useSnippetStore(
    (state) => state.permanentlyDeleteSnippet
  );
  const { formatDate, t } = useI18n();
  const { textSize } = useAppSettings();

  useEffect(() => {
    if (!showSuccessToast) {
      return undefined;
    }

    const timer = window.setTimeout(() => setShowSuccessToast(false), 2200);
    return () => window.clearTimeout(timer);
  }, [showSuccessToast]);

  const archivedSnippets = useMemo(
    () =>
      [...snippets]
        .filter((snippet) => snippet.isArchived && snippet.deletedAt === null)
        .sort(
          (a, b) =>
            (b.archivedAt ?? b.updatedAt) - (a.archivedAt ?? a.updatedAt)
        ),
    [snippets]
  );

  const recycleSnippets = useMemo(
    () =>
      [...snippets]
        .filter((snippet) => snippet.deletedAt !== null)
        .sort((a, b) => (b.deletedAt ?? b.updatedAt) - (a.deletedAt ?? a.updatedAt)),
    [snippets]
  );

  const items = activeTab === "archive" ? archivedSnippets : recycleSnippets;

  const showSuccess = () => {
    setShowSuccessToast(false);
    window.setTimeout(() => setShowSuccessToast(true), 0);
  };

  const handleRestore = async (id: string) => {
    await restoreSnippet(id);
    setOpenMenuId(null);
    showSuccess();
  };

  const handleUnarchive = async (id: string) => {
    await unarchiveSnippet(id);
    setOpenMenuId(null);
    showSuccess();
  };

  const handleMoveToRecycle = async (id: string) => {
    await deleteSnippet(id);
    setOpenMenuId(null);
    showSuccess();
  };

  const handlePermanentDelete = async (id: string) => {
    await permanentlyDeleteSnippet(id);
    setOpenMenuId(null);
    showSuccess();
  };

  return (
    <div className="relative flex-1 overflow-y-auto px-6 py-6">
      {showSuccessToast && (
        <div className="pointer-events-none fixed left-1/2 top-6 z-30 -translate-x-1/2">
          <div className="inline-flex items-center gap-2 rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm font-medium text-foreground shadow-lg">
            <CircleAlert className="h-4 w-4 text-amber-500" />
            <span>{t("archiveActionSuccess")}</span>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-4xl">
        <div className="mb-5 flex items-center gap-2 text-sm font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("archive")}
            className={`rounded-full px-3 py-1.5 transition-colors ${
              activeTab === "archive"
                ? "bg-emerald-100 text-emerald-700"
                : "text-foreground/55 hover:bg-black/5"
            }`}
          >
            {t("archiveTabArchived")}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("recycle")}
            className={`rounded-full px-3 py-1.5 transition-colors ${
              activeTab === "recycle"
                ? "bg-emerald-100 text-emerald-700"
                : "text-foreground/55 hover:bg-black/5"
            }`}
          >
            {t("archiveTabRecycleBin")}
          </button>
        </div>

        <div className="mb-6 rounded-2xl bg-black/10 px-4 py-3 text-center text-sm text-foreground/70">
          {activeTab === "archive"
            ? t("archiveNotice")
            : t("recycleNotice")}
        </div>

        <div className="space-y-4">
          {items.length > 0 ? (
            items.map((snippet) => (
              <article
                key={snippet.id}
                className="rounded-3xl border border-black/5 bg-surface/95 px-5 py-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="text-xs text-foreground/45">
                    {formatDate(
                      activeTab === "archive"
                        ? snippet.archivedAt ?? snippet.updatedAt
                        : snippet.deletedAt ?? snippet.updatedAt
                    )}
                  </div>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() =>
                        setOpenMenuId((current) =>
                          current === snippet.id ? null : snippet.id
                        )
                      }
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full text-foreground/45 hover:bg-black/5 hover:text-foreground/75"
                    >
                      <Ellipsis className="h-4 w-4" />
                    </button>
                    {openMenuId === snippet.id && (
                      <div className="absolute right-0 z-10 mt-2 w-40 overflow-hidden rounded-2xl border border-black/5 bg-surface shadow-lg text-[11px]">
                        {activeTab === "archive" ? (
                          <>
                            <button
                              type="button"
                              className="flex w-full items-center gap-2 px-3 py-2 transition-colors hover:bg-primary/10"
                              onClick={() => void handleUnarchive(snippet.id)}
                            >
                              <RotateCcw className="h-3 w-3" />
                              <span>{t("archiveCancel")}</span>
                            </button>
                            <button
                              type="button"
                              className="flex w-full items-center gap-2 px-3 py-2 text-red-500 transition-colors hover:bg-red-50/80"
                              onClick={() => void handleMoveToRecycle(snippet.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                              <span>{t("snippetDelete")}</span>
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="flex w-full items-center gap-2 px-3 py-2 transition-colors hover:bg-primary/10"
                              onClick={() => void handleRestore(snippet.id)}
                            >
                              <RotateCcw className="h-3 w-3" />
                              <span>{t("archiveRestore")}</span>
                            </button>
                            <button
                              type="button"
                              className="flex w-full items-center gap-2 px-3 py-2 text-red-500 transition-colors hover:bg-red-50/80"
                              onClick={() => void handlePermanentDelete(snippet.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                              <span>{t("archiveDeletePermanently")}</span>
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div
                  className="mt-3 whitespace-pre-wrap leading-7 text-foreground/88"
                  style={{ fontSize: `${textSize}px` }}
                >
                  {snippet.content}
                </div>

                {snippet.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {snippet.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] text-emerald-700"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </article>
            ))
          ) : (
            <div className="rounded-3xl border border-dashed border-black/10 bg-surface/70 px-6 py-12 text-center shadow-sm">
              <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-background/80 text-foreground/45">
                {activeTab === "archive" ? (
                  <Inbox className="h-6 w-6" />
                ) : (
                  <Trash2 className="h-6 w-6" />
                )}
              </div>
              <div className="mt-4 text-base font-medium">
                {activeTab === "archive"
                  ? t("emptyArchivedTitle")
                  : t("emptyRecycleTitle")}
              </div>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-foreground/55">
                {activeTab === "archive"
                  ? t("emptyArchivedDescription")
                  : t("emptyRecycleDescription")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArchiveView;
