import React, { useMemo, useState } from "react";
import { Ellipsis, Inbox, Trash2 } from "lucide-react";
import { useAppSettings } from "../appSettings";
import { useSnippetStore } from "../stores/snippetStore";
import { useI18n } from "../i18n";

type ArchiveTab = "archive" | "recycle";

const ArchiveView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ArchiveTab>("archive");
  const snippets = useSnippetStore((state) => state.snippets);
  const { formatDate, t } = useI18n();
  const { textSize } = useAppSettings();

  const archivedSnippets = useMemo(
    () =>
      [...snippets]
        .filter((snippet) => snippet.isArchived)
        .sort((a, b) => b.updatedAt - a.updatedAt),
    [snippets]
  );

  const items = activeTab === "archive" ? archivedSnippets : [];

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6">
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
                    {formatDate(snippet.updatedAt)}
                  </div>
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full text-foreground/45 hover:bg-black/5 hover:text-foreground/75"
                  >
                    <Ellipsis className="h-4 w-4" />
                  </button>
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
