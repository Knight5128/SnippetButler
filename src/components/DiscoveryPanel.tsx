import React from "react";
import { BookOpen, FolderClosed, Sparkles } from "lucide-react";
import { useSnippetStore } from "../stores/snippetStore";
import { useI18n } from "../i18n";
import type { DiscoverySection } from "./AppRail";

interface DiscoveryPanelProps {
  activeSection: DiscoverySection;
  onSectionChange: (section: DiscoverySection) => void;
}

const DiscoveryPanel: React.FC<DiscoveryPanelProps> = ({
  activeSection,
  onSectionChange
}) => {
  const snippets = useSnippetStore((state) => state.snippets);
  const { t } = useI18n();

  const items = [
    {
      key: "vault" as const,
      label: t("vault"),
      description: t("vaultItemsSaved", { count: snippets.length }),
      icon: FolderClosed
    },
    {
      key: "books" as const,
      label: t("books"),
      description: t("booksPanelDescription"),
      icon: BookOpen
    }
  ];

  return (
    <aside className="w-64 shrink-0 border-r border-black/5 bg-surface/70 px-4 py-5 backdrop-blur-sm">
      <div className="mb-5 rounded-3xl border border-primary/15 bg-primary/10 p-4 text-foreground shadow-sm">
        <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-surface/80 text-primary">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="text-sm font-semibold">{t("discovery")}</div>
        <p className="mt-1 text-xs leading-5 text-foreground/70">
          {t("discoveryIntro")}
        </p>
      </div>

      <div className="space-y-2">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.key === activeSection;

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onSectionChange(item.key)}
              className={`flex w-full items-start gap-3 rounded-2xl border px-3 py-3 text-left transition-colors ${
                active
                  ? "border-primary/15 bg-primary/10 text-foreground shadow-sm"
                  : "border-transparent bg-transparent text-foreground/70 hover:border-black/5 hover:bg-black/5"
              }`}
            >
              <span
                className={`mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                  active
                    ? "bg-background/90 text-primary"
                    : "bg-background/80 text-foreground/50"
                }`}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium">{item.label}</span>
                <span className="mt-1 block text-[11px] text-current/70">
                  {item.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
};

export default DiscoveryPanel;
