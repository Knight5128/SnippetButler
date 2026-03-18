import React from "react";
import {
  Archive,
  Compass,
  FileText,
  Settings
} from "lucide-react";
import { useAppSettings } from "../appSettings";
import { useI18n } from "../i18n";

export type AppView = "snippets" | "discovery" | "archive" | "settings";
export type DiscoverySection = "vault" | "books";

interface AppRailProps {
  activeView: AppView;
  onChange: (view: AppView) => void;
}

interface NavItem {
  key: AppView;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const RailButton: React.FC<{
  item: NavItem;
  active: boolean;
  onClick: () => void;
}> = ({ item, active, onClick }) => {
  const Icon = item.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full flex-col items-center gap-2 rounded-3xl px-1.5 py-3 text-center transition-colors"
    >
      <span
        className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl border transition-all ${
          active
            ? "border-primary/20 bg-primary/10 text-primary shadow-sm"
            : "border-black/5 bg-surface/75 text-foreground/55 hover:border-primary/15 hover:bg-primary/10 hover:text-primary"
        }`}
      >
        <Icon className="h-5 w-5" />
      </span>
      <span
        className={`text-[11px] font-medium leading-snug ${
          active ? "text-foreground" : "text-foreground/58"
        }`}
      >
        {item.label}
      </span>
    </button>
  );
};

const AppRail: React.FC<AppRailProps> = ({ activeView, onChange }) => {
  const { t } = useI18n();
  const { avatar, displayName } = useAppSettings();
  const topItems: NavItem[] = [
    { key: "snippets", label: t("appRailSnippets"), icon: FileText },
    { key: "discovery", label: t("appRailDiscovery"), icon: Compass }
  ];
  const bottomItems: NavItem[] = [
    { key: "archive", label: t("appRailArchivedDeleted"), icon: Archive },
    { key: "settings", label: t("appRailSettings"), icon: Settings }
  ];

  return (
    <aside className="w-20 shrink-0 border-r border-black/5 bg-surface/55 px-2.5 py-4 backdrop-blur-xl">
      <div className="flex h-full flex-col">
        <div className="mb-6 flex justify-center">
          <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-primary/15 bg-primary/10 text-sm font-semibold text-primary shadow-sm">
            {avatar ? (
              <img
                src={avatar}
                alt={displayName || "avatar"}
                className="h-full w-full object-cover"
              />
            ) : (
              "SB"
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          {topItems.map((item) => (
            <RailButton
              key={item.key}
              item={item}
              active={item.key === activeView}
              onClick={() => onChange(item.key)}
            />
          ))}
        </div>

        <div className="mt-auto space-y-1.5">
          {bottomItems.map((item) => (
            <RailButton
              key={item.key}
              item={item}
              active={item.key === activeView}
              onClick={() => onChange(item.key)}
            />
          ))}
        </div>
      </div>
    </aside>
  );
};

export default AppRail;
