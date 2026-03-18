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
  avatar: string;
  displayName: string;
  secondaryPassword: string;
  setTextSize: (value: TextSizeOption) => void;
  setSendShortcut: (value: SendShortcutOption) => void;
  setAvatar: (dataUrl: string) => void;
  setDisplayName: (name: string) => void;
  setSecondaryPassword: (password: string) => void;
}

interface StoredSettings {
  textSize?: number;
  sendShortcut?: SendShortcutOption;
  avatar?: string;
  displayName?: string;
  secondaryPassword?: string;
}

const STORAGE_KEY = "snippetbutler.app-settings";
const DEFAULT_TEXT_SIZE: TextSizeOption = 16;
const DEFAULT_SEND_SHORTCUT: SendShortcutOption = "shift-enter";
const TOGGLE_WINDOW_SHORTCUT = "Ctrl+Alt+P";
const DEFAULT_SECONDARY_PASSWORD = "0000";

function generateDefaultDisplayName(): string {
  const length = Math.floor(Math.random() * 4) + 6; // 6 to 9 digits
  let digits = "";
  for (let i = 0; i < length; i++) {
    digits += Math.floor(Math.random() * 10).toString();
  }
  return `user_${digits}`;
}

const AppSettingsContext = createContext<AppSettingsContextValue | null>(null);

function isTextSizeOption(value: number): value is TextSizeOption {
  return TEXT_SIZE_OPTIONS.includes(value as TextSizeOption);
}

function getInitialSettings(): {
  textSize: TextSizeOption;
  sendShortcut: SendShortcutOption;
  avatar: string;
  displayName: string;
  secondaryPassword: string;
} {
  if (typeof window === "undefined") {
    return {
      textSize: DEFAULT_TEXT_SIZE,
      sendShortcut: DEFAULT_SEND_SHORTCUT,
      avatar: "",
      displayName: generateDefaultDisplayName(),
      secondaryPassword: DEFAULT_SECONDARY_PASSWORD
    };
  }

  try {
    const storedRaw = window.localStorage.getItem(STORAGE_KEY);
    if (!storedRaw) {
      const defaultName = generateDefaultDisplayName();
      return {
        textSize: DEFAULT_TEXT_SIZE,
        sendShortcut: DEFAULT_SEND_SHORTCUT,
        avatar: "",
        displayName: defaultName,
        secondaryPassword: DEFAULT_SECONDARY_PASSWORD
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
          : DEFAULT_SEND_SHORTCUT,
      avatar: typeof stored.avatar === "string" ? stored.avatar : "",
      displayName:
        typeof stored.displayName === "string" && stored.displayName.length > 0
          ? stored.displayName
          : generateDefaultDisplayName(),
      secondaryPassword:
        typeof stored.secondaryPassword === "string" &&
        /^\d{4}$/.test(stored.secondaryPassword)
          ? stored.secondaryPassword
          : DEFAULT_SECONDARY_PASSWORD
    };
  } catch {
    return {
      textSize: DEFAULT_TEXT_SIZE,
      sendShortcut: DEFAULT_SEND_SHORTCUT,
      avatar: "",
      displayName: generateDefaultDisplayName(),
      secondaryPassword: DEFAULT_SECONDARY_PASSWORD
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
      avatar: settings.avatar,
      displayName: settings.displayName,
      secondaryPassword: settings.secondaryPassword,
      setTextSize: (textSize) =>
        setSettings((current) => ({
          ...current,
          textSize
        })),
      setSendShortcut: (sendShortcut) =>
        setSettings((current) => ({
          ...current,
          sendShortcut
        })),
      setAvatar: (avatar: string) =>
        setSettings((current) => ({
          ...current,
          avatar
        })),
      setDisplayName: (displayName: string) =>
        setSettings((current) => ({
          ...current,
          displayName
        })),
      setSecondaryPassword: (secondaryPassword: string) =>
        setSettings((current) => ({
          ...current,
          secondaryPassword
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
