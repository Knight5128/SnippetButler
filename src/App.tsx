import React, { useEffect, useRef, useState } from "react";
import AppRail, { type AppView, type DiscoverySection } from "./components/AppRail";
import ArchiveView from "./components/ArchiveView";
import DiscoveryPanel from "./components/DiscoveryPanel";
import DiscoveryView from "./components/DiscoveryView";
import { useSnippetStore } from "./stores/snippetStore";
import FilterBar from "./components/FilterBar";
import InputBar from "./components/InputBar";
import SettingsView from "./components/SettingsView";
import Sidebar from "./components/Sidebar";
import SnippetList from "./components/SnippetList";
import { useI18n } from "./i18n";

const SNIPPETS_SIDEBAR_WIDTH_KEY = "snippetbutler.snippets-sidebar-width";
const MIN_SNIPPETS_SIDEBAR_WIDTH = 220;
const MAX_SNIPPETS_SIDEBAR_WIDTH = 420;
const MIN_SNIPPETS_MAIN_WIDTH = 360;
const DEFAULT_SNIPPETS_SIDEBAR_WIDTH = 256;

function clampSidebarWidth(width: number, containerWidth: number): number {
  const maxWidth = Math.max(
    MIN_SNIPPETS_SIDEBAR_WIDTH,
    Math.min(MAX_SNIPPETS_SIDEBAR_WIDTH, containerWidth - MIN_SNIPPETS_MAIN_WIDTH)
  );

  return Math.min(Math.max(width, MIN_SNIPPETS_SIDEBAR_WIDTH), maxWidth);
}

function getInitialSidebarWidth(): number {
  if (typeof window === "undefined") {
    return DEFAULT_SNIPPETS_SIDEBAR_WIDTH;
  }

  const storedWidth = Number(window.localStorage.getItem(SNIPPETS_SIDEBAR_WIDTH_KEY));
  return Number.isFinite(storedWidth) ? storedWidth : DEFAULT_SNIPPETS_SIDEBAR_WIDTH;
}

const App: React.FC = () => {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [search, setSearch] = useState("");
  const [activeView, setActiveView] = useState<AppView>("snippets");
  const [discoverySection, setDiscoverySection] =
    useState<DiscoverySection>("vault");
  const [sidebarWidth, setSidebarWidth] = useState(getInitialSidebarWidth);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const snippetLayoutRef = useRef<HTMLDivElement | null>(null);
  const init = useSnippetStore((s) => s.init);
  const { language, setLanguage, t } = useI18n();

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    void init();
  }, [init]);

  useEffect(() => {
    window.localStorage.setItem(
      SNIPPETS_SIDEBAR_WIDTH_KEY,
      String(sidebarWidth)
    );
  }, [sidebarWidth]);

  useEffect(() => {
    const clampCurrentSidebarWidth = () => {
      if (!snippetLayoutRef.current) return;

      const { width } = snippetLayoutRef.current.getBoundingClientRect();
      setSidebarWidth((current) => clampSidebarWidth(current, width));
    };

    clampCurrentSidebarWidth();
    window.addEventListener("resize", clampCurrentSidebarWidth);

    return () => window.removeEventListener("resize", clampCurrentSidebarWidth);
  }, []);

  useEffect(() => {
    if (!isResizingSidebar) return;

    const handleMouseMove = (event: MouseEvent) => {
      if (!snippetLayoutRef.current) return;

      const rect = snippetLayoutRef.current.getBoundingClientRect();
      const nextWidth = event.clientX - rect.left;
      setSidebarWidth(clampSidebarWidth(nextWidth, rect.width));
    };

    const handleMouseUp = () => {
      setIsResizingSidebar(false);
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizingSidebar]);

  return (
    <div className="h-full flex bg-background text-foreground">
      <AppRail activeView={activeView} onChange={setActiveView} />

      {activeView === "snippets" && (
        <div ref={snippetLayoutRef} className="flex flex-1 min-w-0 min-h-0">
          <div
            className="min-w-0 shrink-0"
            style={{ width: `${sidebarWidth}px` }}
          >
            <Sidebar search={search} onSearchChange={setSearch} />
          </div>

          <button
            type="button"
            aria-label="Resize snippets sidebar"
            onMouseDown={() => setIsResizingSidebar(true)}
            className="group relative w-3 shrink-0 cursor-col-resize bg-transparent"
          >
            <span
              className={`absolute left-1/2 top-0 h-full w-px -translate-x-1/2 transition-colors ${
                isResizingSidebar
                  ? "bg-primary/70"
                  : "bg-black/10 group-hover:bg-primary/50"
              }`}
            />
          </button>

          <main className="flex-1 min-w-0 flex flex-col">
            <header className="h-10 border-b border-black/5 flex items-center justify-between px-4 text-xs text-foreground/70">
              <span>{t("quickSaveHeader")}</span>
              <button
                type="button"
                className="text-[11px] rounded-full border px-2 py-0.5 text-foreground/70 hover:text-foreground hover:border-primary"
                onClick={() =>
                  setTheme(theme === "light" ? "dark" : "light")
                }
              >
                {theme === "light" ? t("switchToDark") : t("switchToLight")}
              </button>
            </header>
            <FilterBar />
            <SnippetList search={search} />
            <InputBar />
          </main>
        </div>
      )}

      {activeView === "discovery" && (
        <DiscoveryPanel
          activeSection={discoverySection}
          onSectionChange={setDiscoverySection}
        />
      )}

      {activeView !== "snippets" && (
        <main className="flex-1 min-w-0 flex flex-col">
        {activeView === "discovery" && (
          <DiscoveryView activeSection={discoverySection} />
        )}

        {activeView === "archive" && <ArchiveView />}

        {activeView === "settings" && (
          <SettingsView
            language={language}
            theme={theme}
            onLanguageChange={setLanguage}
            onThemeChange={setTheme}
          />
        )}
        </main>
      )}
    </div>
  );
};

export default App;

