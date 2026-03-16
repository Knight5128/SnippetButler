import React from "react";
import {
  BookOpenText,
  Compass,
  FolderTree,
  Layers3,
  NotebookTabs,
  Stars
} from "lucide-react";
import { useSnippetStore } from "../stores/snippetStore";
import { useI18n } from "../i18n";
import type { DiscoverySection } from "./AppRail";

interface DiscoveryViewProps {
  activeSection: DiscoverySection;
}

const DiscoveryView: React.FC<DiscoveryViewProps> = ({ activeSection }) => {
  const snippets = useSnippetStore((state) => state.snippets);
  const folders = useSnippetStore((state) => state.folders);
  const tags = useSnippetStore((state) => state.tags);
  const { t } = useI18n();

  if (activeSection === "books") {
    return (
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-5xl space-y-6">
          <section className="rounded-[28px] border border-primary/15 bg-gradient-to-br from-primary/15 via-surface to-background p-6 shadow-sm">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-surface/85 text-primary">
              <BookOpenText className="h-5 w-5" />
            </div>
            <h1 className="mt-4 text-2xl font-semibold text-foreground">
              {t("books")}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-foreground/70">
              {t("booksSectionIntro")}
            </p>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            {[
              {
                title: t("pendingBookshelfTitle"),
                description: t("pendingBookshelfDescription")
              },
              {
                title: t("highlightSyncTitle"),
                description: t("highlightSyncDescription")
              }
            ].map((card) => (
              <article
                key={card.title}
                className="rounded-3xl border border-black/5 bg-surface/90 p-5 shadow-sm"
              >
                <div className="text-base font-semibold">{card.title}</div>
                <p className="mt-2 text-sm leading-6 text-foreground/65">
                  {card.description}
                </p>
              </article>
            ))}
          </section>
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: t("statSnippets"),
      value: snippets.length,
      icon: NotebookTabs
    },
    {
      label: t("statFolders"),
      value: folders.length,
      icon: FolderTree
    },
    {
      label: t("statTags"),
      value: tags.length,
      icon: Layers3
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="relative overflow-hidden rounded-[30px] border border-primary/15 bg-gradient-to-br from-primary/15 via-surface to-background p-6 shadow-sm">
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-surface/85 text-primary">
              <Compass className="h-5 w-5" />
            </div>
            <h1 className="mt-4 text-2xl font-semibold text-foreground">
              {t("vault")}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-foreground/70">
              {t("vaultIntro")}
            </p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <article
                key={stat.label}
                className="rounded-3xl border border-black/5 bg-surface/90 p-5 shadow-sm"
              >
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="mt-4 text-2xl font-semibold">{stat.value}</div>
                <div className="mt-1 text-xs text-foreground/55">
                  {stat.label}
                </div>
              </article>
            );
          })}
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.2fr,0.8fr]">
          <article className="rounded-3xl border border-black/5 bg-surface/90 p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Stars className="h-4 w-4 text-primary" />
              {t("recommendationTitle")}
            </div>
            <div className="mt-4 space-y-3">
              {[
                t("recommendationOne"),
                t("recommendationTwo"),
                t("recommendationThree")
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl bg-background/80 px-4 py-3 text-sm text-foreground/70"
                >
                  {item}
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-3xl border border-black/5 bg-surface/90 p-5 shadow-sm">
            <div className="text-sm font-semibold">{t("roadmapTitle")}</div>
            <p className="mt-3 text-sm leading-6 text-foreground/65">
              {t("roadmapDescription")}
            </p>
          </article>
        </section>
      </div>
    </div>
  );
};

export default DiscoveryView;
