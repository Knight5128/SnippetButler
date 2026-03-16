/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";

export const TEXT_SIZE_OPTIONS = [12, 14, 16, 18, 20, 22, 24] as const;
export type TextSizeOption = (typeof TEXT_SIZE_OPTIONS)[number];
export type SendShortcutOption = "enter" | "shift-enter";

interface AppSettingsContextValue {
  textSize: TextSizeOption;
  sendShortcut: SendShortcutOption;
  newlineShortcut: SendShortcutOption;
  toggleWindowShortcut: string;
  setTextSize: (value: TextSizeOption) => void;
  setSendShortcut: (value: SendShortcutOption) => void;
}

interface StoredSettings {
  textSize?: number;
  sendShortcut?: SendShortcutOption;
}

const STORAGE_KEY = "snippetbutler.app-settings";
const DEFAULT_TEXT_SIZE: TextSizeOption = 16;
const DEFAULT_SEND_SHORTCUT: SendShortcutOption = "shift-enter";
const TOGGLE_WINDOW_SHORTCUT = "Ctrl+Alt+P";

const AppSettingsContext = createContext<AppSettingsContextValue | null>(null);

function isTextSizeOption(value: number): value is TextSizeOption {
  return TEXT_SIZE_OPTIONS.includes(value as TextSizeOption);
}

function getInitialSettings(): {
  textSize: TextSizeOption;
  sendShortcut: SendShortcutOption;
} {
  if (typeof window === "undefined") {
    return {
      textSize: DEFAULT_TEXT_SIZE,
      sendShortcut: DEFAULT_SEND_SHORTCUT
    };
  }

  try {
    const storedRaw = window.localStorage.getItem(STORAGE_KEY);
    if (!storedRaw) {
      return {
        textSize: DEFAULT_TEXT_SIZE,
        sendShortcut: DEFAULT_SEND_SHORTCUT
      };
    }

    const stored = JSON.parse(storedRaw) as StoredSettings;
    return {
      textSize:
        typeof stored.textSize === "number" && isTextSizeOption(stored.textSize)
          ? stored.textSize
          : DEFAULT_TEXT_SIZE,
      sendShortcut:
        stored.sendShortcut === "enter" || stored.sendShortcut === "shift-enter"
          ? stored.sendShortcut
          : DEFAULT_SEND_SHORTCUT
    };
  } catch {
    return {
      textSize: DEFAULT_TEXT_SIZE,
      sendShortcut: DEFAULT_SEND_SHORTCUT
    };
  }
}

export const AppSettingsProvider: React.FC<React.PropsWithChildren> = ({
  children
}) => {
  const [settings, setSettings] = useState(getInitialSettings);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    document.documentElement.style.setProperty(
      "--snippet-font-size",
      `${settings.textSize}px`
    );
  }, [settings]);

  const value = useMemo<AppSettingsContextValue>(
    () => ({
      textSize: settings.textSize,
      sendShortcut: settings.sendShortcut,
      newlineShortcut:
        settings.sendShortcut === "enter" ? "shift-enter" : "enter",
      toggleWindowShortcut: TOGGLE_WINDOW_SHORTCUT,
      setTextSize: (textSize) =>
        setSettings((current) => ({
          ...current,
          textSize
        })),
      setSendShortcut: (sendShortcut) =>
        setSettings((current) => ({
          ...current,
          sendShortcut
        }))
    }),
    [settings]
  );

  return (
    <AppSettingsContext.Provider value={value}>
      {children}
    </AppSettingsContext.Provider>
  );
};

export function useAppSettings(): AppSettingsContextValue {
  const context = useContext(AppSettingsContext);

  if (!context) {
    throw new Error("useAppSettings must be used within AppSettingsProvider");
  }

  return context;
}
