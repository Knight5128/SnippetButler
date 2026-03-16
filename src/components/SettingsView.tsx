import React, { useState } from "react";
import {
  BadgeInfo,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Download,
  Globe2,
  Info,
  Languages,
  MessageSquareMore,
  MoonStar,
  Settings2,
  Upload,
  UserCircle2
} from "lucide-react";
import {
  TEXT_SIZE_OPTIONS,
  useAppSettings
} from "../appSettings";
import { type AppLanguage, useI18n } from "../i18n";

interface SettingsViewProps {
  language: AppLanguage;
  theme: "light" | "dark";
  onLanguageChange: (language: AppLanguage) => void;
  onThemeChange: (theme: "light" | "dark") => void;
}

interface SettingRow {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  trailing?: React.ReactNode;
  accentDot?: boolean;
  onClick?: () => void;
}

interface SettingSection {
  id: string;
  title: string;
  rows: SettingRow[];
}

const ShortcutOption: React.FC<{
  checked: boolean;
  label: string;
  onClick: () => void;
}> = ({ checked, label, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors ${
      checked
        ? "text-foreground"
        : "text-foreground/55 hover:bg-black/5 hover:text-foreground/75"
    }`}
  >
    <span
      className={`inline-flex h-4 w-4 items-center justify-center rounded-[4px] border ${
        checked
          ? "border-primary bg-primary text-white"
          : "border-black/15 bg-background text-transparent"
      }`}
    >
      <Check className="h-3 w-3" />
    </span>
    <span>{label}</span>
  </button>
);

const FeatureCard: React.FC<{
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, description, children }) => (
  <div className="rounded-[28px] border border-black/5 bg-surface/95 px-5 py-4 shadow-sm">
    <div className="flex items-center gap-3">
      <span className="inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
      <div className="text-[22px] font-semibold text-foreground">{title}</div>
    </div>
    {description && (
      <p className="mt-3 max-w-2xl text-base leading-7 text-foreground/60">
        {description}
      </p>
    )}
    {children}
  </div>
);

const SettingsView: React.FC<SettingsViewProps> = ({
  language,
  theme,
  onLanguageChange,
  onThemeChange
}) => {
  const { languageOptions, t } = useI18n();
  const {
    newlineShortcut,
    sendShortcut,
    setSendShortcut,
    setTextSize,
    textSize,
    toggleWindowShortcut
  } = useAppSettings();
  const [activePanel, setActivePanel] = useState<"root" | "features">("root");
  const selectedTextSizeIndex = TEXT_SIZE_OPTIONS.indexOf(textSize);

  const featureSettingsContent = (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => setActivePanel("root")}
        className="inline-flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm text-foreground/60 transition-colors hover:bg-black/5 hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        <span>{t("settingsPreferences")}</span>
      </button>

      <div className="px-2 text-sm text-foreground/55">
        {t("settingsFeatureSettings")}
      </div>

      <FeatureCard
        title={t("featureTextSizeTitle")}
        description={
          <span style={{ fontSize: `${textSize}px`, lineHeight: 1.6 }}>
            {t("featureTextSizeDescription")}
          </span>
        }
      >
        <div className="mt-5 inline-flex rounded-md bg-black/45 px-2.5 py-1 text-sm font-semibold text-white shadow-sm">
          {textSize}px
        </div>

        <div className="mt-6 flex items-center">
          {TEXT_SIZE_OPTIONS.map((option, index) => (
            <React.Fragment key={option}>
              <button
                type="button"
                onClick={() => setTextSize(option)}
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center"
                aria-label={`${t("featureTextSizeTitle")} ${option}px`}
              >
                <span
                  className={`rounded-full border transition-all ${
                    option === textSize
                      ? "h-4 w-4 border-primary bg-white ring-2 ring-primary/25"
                      : "h-2.5 w-2.5 border-primary/40 bg-white"
                  }`}
                />
              </button>
              {index < TEXT_SIZE_OPTIONS.length - 1 && (
                <div
                  className={`h-[2px] flex-1 ${
                    index < selectedTextSizeIndex
                      ? "bg-primary"
                      : "bg-primary/20"
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-7 text-center text-foreground/65">
          {TEXT_SIZE_OPTIONS.map((option) => (
            <div
              key={`label-${option}`}
              style={
                option === 12 || option === 16 || option === 24
                  ? { fontSize: `${option}px`, lineHeight: 1.2 }
                  : undefined
              }
            >
              {option === 12 && t("featureTextSizeMin")}
              {option === 16 && t("featureTextSizeStandard")}
              {option === 24 && t("featureTextSizeMax")}
            </div>
          ))}
        </div>
      </FeatureCard>

      <FeatureCard title={t("featureShortcutsTitle")}>
        <div className="mt-4 space-y-4 text-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <span className="text-foreground/70">{t("featureShortcutSend")}</span>
            <div className="flex flex-wrap gap-2">
              <ShortcutOption
                checked={sendShortcut === "enter"}
                label={t("shortcutEnter")}
                onClick={() => setSendShortcut("enter")}
              />
              <ShortcutOption
                checked={sendShortcut === "shift-enter"}
                label={t("shortcutShiftEnter")}
                onClick={() => setSendShortcut("shift-enter")}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <span className="text-foreground/70">
              {t("featureShortcutNewLine")}
            </span>
            <div className="flex flex-wrap gap-2">
              <ShortcutOption
                checked={newlineShortcut === "enter"}
                label={t("shortcutEnter")}
                onClick={() => setSendShortcut("shift-enter")}
              />
              <ShortcutOption
                checked={newlineShortcut === "shift-enter"}
                label={t("shortcutShiftEnter")}
                onClick={() => setSendShortcut("enter")}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <span className="text-foreground/70">
              {t("featureShortcutToggleWindow")}
            </span>
            <kbd className="inline-flex w-fit rounded-lg border border-black/10 bg-background px-3 py-1.5 text-sm text-foreground/70 shadow-sm">
              {toggleWindowShortcut}
            </kbd>
          </div>
        </div>
      </FeatureCard>
    </div>
  );

  const sections: SettingSection[] = [
    {
      id: "account",
      title: t("settingsAccount"),
      rows: [
        {
          id: "avatar",
          icon: UserCircle2,
          label: t("settingsAvatar"),
          trailing: (
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-primary/15 bg-primary/10 text-lg shadow-sm">
                🧠
              </div>
              <div className="text-right">
                <div className="text-sm text-foreground/45">Knight.</div>
              </div>
            </div>
          )
        },
        {
          id: "display-name",
          icon: BadgeInfo,
          label: t("settingsDisplayName")
        }
      ]
    },
    {
      id: "sync",
      title: t("settingsDataSync"),
      rows: [
        {
          id: "import",
          icon: Upload,
          label: t("settingsImportNotes"),
          accentDot: true
        },
        {
          id: "export",
          icon: Download,
          label: t("settingsExportNotes")
        }
      ]
    },
    {
      id: "preferences",
      title: t("settingsPreferences"),
      rows: [
        {
          id: "features",
          icon: Settings2,
          label: t("settingsFeatureSettings"),
          onClick: () => setActivePanel("features")
        },
        {
          id: "language-resources",
          icon: Languages,
          label: t("settingsLanguageResources")
        },
        {
          id: "language",
          icon: Globe2,
          label: t("settingsLanguage"),
          trailing: (
            <select
              value={language}
              onChange={(event) =>
                onLanguageChange(event.target.value as AppLanguage)
              }
              className="min-w-[148px] rounded-xl border border-black/10 bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
            >
              {languageOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )
        },
        {
          id: "theme",
          icon: MoonStar,
          label: t("settingsThemeMode"),
          trailing: (
            <div className="inline-flex rounded-full bg-background p-1 text-[11px]">
              <button
                type="button"
                onClick={() => onThemeChange("light")}
                className={`rounded-full px-3 py-1 transition-colors ${
                  theme === "light"
                    ? "bg-primary/10 text-primary"
                    : "text-foreground/50"
                }`}
              >
                {t("themeLight")}
              </button>
              <button
                type="button"
                onClick={() => onThemeChange("dark")}
                className={`rounded-full px-3 py-1 transition-colors ${
                  theme === "dark"
                    ? "bg-primary/10 text-primary"
                    : "text-foreground/50"
                }`}
              >
                {t("themeDark")}
              </button>
            </div>
          )
        }
      ]
    },
    {
      id: "contact",
      title: t("settingsContact"),
      rows: [
        {
          id: "about",
          icon: Info,
          label: t("settingsAbout")
        },
        {
          id: "feedback",
          icon: MessageSquareMore,
          label: t("settingsFeedback")
        }
      ]
    },
    {
      id: "other",
      title: t("settingsOther"),
      rows: [
        {
          id: "release-notes",
          icon: CircleDot,
          label: t("settingsReleaseNotes")
        },
        {
          id: "version",
          icon: BadgeInfo,
          label: t("settingsVersion"),
          trailing: <span className="text-sm text-rose-500">0.1.0</span>
        }
      ]
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto px-6 py-5">
      <div className="mx-auto max-w-4xl">
        {activePanel === "features" ? (
          featureSettingsContent
        ) : (
          sections.map((section) => (
            <section key={section.id} className="mb-5 last:mb-0">
              <div className="mb-2 px-2 text-sm text-foreground/55">
                {section.title}
              </div>
              <div className="rounded-[28px] border border-black/5 bg-surface/95 p-2 shadow-sm">
                {section.rows.map((row, index) => {
                  const Icon = row.icon;
                  const isLast = index === section.rows.length - 1;
                  const isInteractive = Boolean(row.onClick);
                  const rowContent = (
                    <>
                      <span className="flex min-w-0 items-center gap-3">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-foreground/80">
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="text-[15px]">{row.label}</span>
                        {row.accentDot && (
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500" />
                        )}
                      </span>

                      {row.trailing ? (
                        row.trailing
                      ) : (
                        <ChevronRight className="h-4 w-4 text-foreground/35" />
                      )}
                    </>
                  );

                  return (
                    isInteractive ? (
                      <button
                        key={row.id}
                        type="button"
                        onClick={row.onClick}
                        className={`flex w-full items-center justify-between rounded-2xl px-3 py-4 text-left transition-colors hover:bg-black/5 ${
                          isLast ? "" : "border-b border-black/5"
                        }`}
                      >
                        {rowContent}
                      </button>
                    ) : (
                      <div
                        key={row.id}
                        className={`flex w-full items-center justify-between rounded-2xl px-3 py-4 text-left ${
                          isLast ? "" : "border-b border-black/5"
                        }`}
                      >
                        {rowContent}
                      </div>
                    )
                  );
                })}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
};

export default SettingsView;
