import React, { useCallback, useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  BadgeInfo,
  Camera,
  Check,
  CircleAlert,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Download,
  FileText,
  Globe2,
  Info,
  MessageSquareMore,
  MoonStar,
  Pencil,
  Settings2,
  ShieldCheck,
  Upload,
  UserCircle2
} from "lucide-react";
import {
  TEXT_SIZE_OPTIONS,
  useAppSettings
} from "../appSettings";
import { type AppLanguage, useI18n } from "../i18n";
import flomoLogo from "../assets/import-sources/flomo.svg";
import markdownLogo from "../assets/import-sources/markdown.svg";
import notionLogo from "../assets/import-sources/notion.svg";
import obsidianLogo from "../assets/import-sources/obsidian.svg";

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

interface FloatingNotice {
  message: string;
  tone: "success" | "warning";
}

interface ReleaseNoteEntry {
  version: string;
  highlights: string[];
}

interface ExportNotesResult {
  file_path: string;
  file_name: string;
  bytes: number;
  snippet_count: number;
  folder_count: number;
  exported_at: number;
}

const APP_VERSION = "0.1.0";
const ABOUT_PAGE_URL = "https://snippetbutler.com/";

const panelBackButtonClassName =
  "inline-flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm text-foreground/60 transition-colors hover:bg-black/5 hover:text-foreground";

/* ------------------------------------------------------------------ */
/*  Reusable small components                                         */
/* ------------------------------------------------------------------ */

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

const IntegrationCard: React.FC<{
  title: string;
  logoSrc: string;
  accentClassName: string;
  logoClassName?: string;
  actionLabel: string;
}> = ({ title, logoSrc, accentClassName, logoClassName, actionLabel }) => (
  <div className="rounded-[24px] border border-black/5 bg-background px-5 py-4 shadow-sm transition-colors hover:border-primary/20 hover:bg-primary/[0.03]">
    <div className="flex items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-4">
        <span
          className={`inline-flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border p-2 ${accentClassName}`}
        >
          <img
            src={logoSrc}
            alt={`${title} logo`}
            className={`h-full w-full object-contain ${logoClassName ?? ""}`}
          />
        </span>
        <span className="truncate text-xl font-semibold text-foreground">
          {title}
        </span>
      </div>

      <span className="inline-flex shrink-0 rounded-xl border border-black/8 bg-surface px-4 py-2 text-sm text-foreground/45">
        {actionLabel}
      </span>
    </div>
  </div>
);

const HistoryTabButton: React.FC<{
  active: boolean;
  label: string;
  onClick: () => void;
}> = ({ active, label, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-full px-1 py-1 text-sm transition-colors ${
      active ? "text-primary" : "text-foreground/45 hover:text-foreground/70"
    }`}
  >
    {label}
  </button>
);

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ------------------------------------------------------------------ */
/*  Avatar Crop Dialog                                                */
/* ------------------------------------------------------------------ */

const AvatarCropDialog: React.FC<{
  imageSrc: string;
  onConfirm: (croppedDataUrl: string) => void;
  onCancel: () => void;
  confirmLabel: string;
  cancelLabel: string;
  titleLabel: string;
}> = ({ imageSrc, onConfirm, onCancel, confirmLabel, cancelLabel, titleLabel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Circle position & radius (in display coordinate space)
  const [circleX, setCircleX] = useState(0);
  const [circleY, setCircleY] = useState(0);
  const [circleR, setCircleR] = useState(80);
  const [imgSize, setImgSize] = useState({ w: 0, h: 0, naturalW: 0, naturalH: 0 });
  const [dragging, setDragging] = useState<"move" | "resize" | null>(null);
  const dragStart = useRef({ x: 0, y: 0, cx: 0, cy: 0, cr: 0 });

  // Load the image once
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      // Fit into a 400×400 display area
      const maxDim = 400;
      const scale = Math.min(maxDim / img.naturalWidth, maxDim / img.naturalHeight, 1);
      const w = img.naturalWidth * scale;
      const h = img.naturalHeight * scale;
      setImgSize({ w, h, naturalW: img.naturalWidth, naturalH: img.naturalHeight });
      setCircleX(w / 2);
      setCircleY(h / 2);
      setCircleR(Math.min(w, h) / 2 - 10);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Draw overlay
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imgRef.current || imgSize.w === 0) return;
    canvas.width = imgSize.w;
    canvas.height = imgSize.h;
    const ctx = canvas.getContext("2d")!;

    // Draw image
    ctx.drawImage(imgRef.current, 0, 0, imgSize.w, imgSize.h);

    // Semi-transparent overlay
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, 0, imgSize.w, imgSize.h);

    // Cut out the circle
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(circleX, circleY, circleR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Circle border
    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(circleX, circleY, circleR, 0, Math.PI * 2);
    ctx.stroke();

    // Resize handle (small circle at bottom-right of the circle)
    const handleAngle = Math.PI / 4;
    const hx = circleX + circleR * Math.cos(handleAngle);
    const hy = circleY + circleR * Math.sin(handleAngle);
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(hx, hy, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.3)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }, [circleX, circleY, circleR, imgSize]);

  const getCanvasPos = useCallback(
    (e: React.MouseEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    },
    []
  );

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const pos = getCanvasPos(e);
      // Check if near resize handle
      const handleAngle = Math.PI / 4;
      const hx = circleX + circleR * Math.cos(handleAngle);
      const hy = circleY + circleR * Math.sin(handleAngle);
      const distToHandle = Math.sqrt((pos.x - hx) ** 2 + (pos.y - hy) ** 2);

      if (distToHandle < 12) {
        setDragging("resize");
        dragStart.current = { x: pos.x, y: pos.y, cx: circleX, cy: circleY, cr: circleR };
        return;
      }
      // Check if inside circle
      const distToCenter = Math.sqrt((pos.x - circleX) ** 2 + (pos.y - circleY) ** 2);
      if (distToCenter < circleR) {
        setDragging("move");
        dragStart.current = { x: pos.x, y: pos.y, cx: circleX, cy: circleY, cr: circleR };
      }
    },
    [circleX, circleY, circleR, getCanvasPos]
  );

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragging) return;
      const pos = getCanvasPos(e);
      const dx = pos.x - dragStart.current.x;
      const dy = pos.y - dragStart.current.y;

      if (dragging === "move") {
        let nx = dragStart.current.cx + dx;
        let ny = dragStart.current.cy + dy;
        // Clamp
        nx = Math.max(circleR, Math.min(imgSize.w - circleR, nx));
        ny = Math.max(circleR, Math.min(imgSize.h - circleR, ny));
        setCircleX(nx);
        setCircleY(ny);
      } else if (dragging === "resize") {
        const dist = Math.sqrt(
          (pos.x - dragStart.current.cx) ** 2 + (pos.y - dragStart.current.cy) ** 2
        );
        const newR = Math.max(20, Math.min(
          dist,
          dragStart.current.cx,
          imgSize.w - dragStart.current.cx,
          dragStart.current.cy,
          imgSize.h - dragStart.current.cy
        ));
        setCircleR(newR);
      }
    },
    [dragging, getCanvasPos, imgSize, circleR]
  );

  const onMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  const handleConfirm = useCallback(() => {
    if (!imgRef.current || imgSize.w === 0) return;
    const scale = imgSize.naturalW / imgSize.w;
    const sx = (circleX - circleR) * scale;
    const sy = (circleY - circleR) * scale;
    const sd = circleR * 2 * scale;

    const outputSize = 256;
    const offscreen = document.createElement("canvas");
    offscreen.width = outputSize;
    offscreen.height = outputSize;
    const ctx = offscreen.getContext("2d")!;

    // Clip circle
    ctx.beginPath();
    ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    ctx.drawImage(imgRef.current, sx, sy, sd, sd, 0, 0, outputSize, outputSize);
    onConfirm(offscreen.toDataURL("image/png"));
  }, [circleX, circleY, circleR, imgSize, onConfirm]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="rounded-2xl bg-surface border border-black/10 shadow-xl p-5 flex flex-col items-center gap-4 max-w-[480px]">
        <div className="text-lg font-semibold text-foreground">{titleLabel}</div>
        <div
          ref={containerRef}
          className="relative select-none"
          style={{ width: imgSize.w || 400, height: imgSize.h || 400 }}
        >
          <canvas
            ref={canvasRef}
            style={{ width: imgSize.w, height: imgSize.h, cursor: dragging ? "grabbing" : "grab" }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
          />
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-black/10 bg-background px-5 py-2 text-sm text-foreground/70 transition-colors hover:bg-black/5"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="rounded-xl bg-primary px-5 py-2 text-sm text-white transition-colors hover:bg-primary/90"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Nickname Edit Dialog                                              */
/* ------------------------------------------------------------------ */

const NicknameEditDialog: React.FC<{
  currentName: string;
  onConfirm: (name: string) => void;
  onCancel: () => void;
  titleLabel: string;
  placeholderLabel: string;
  confirmLabel: string;
  cancelLabel: string;
}> = ({ currentName, onConfirm, onCancel, titleLabel, placeholderLabel, confirmLabel, cancelLabel }) => {
  const [name, setName] = useState(currentName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = name.trim();
      if (trimmed.length > 0) {
        onConfirm(trimmed);
      }
    },
    [name, onConfirm]
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl bg-surface border border-black/10 shadow-xl p-5 flex flex-col gap-4 min-w-[320px]"
      >
        <div className="text-lg font-semibold text-foreground">{titleLabel}</div>
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={30}
          placeholder={placeholderLabel}
          className="rounded-xl border border-black/10 bg-background px-4 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary"
        />
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-black/10 bg-background px-5 py-2 text-sm text-foreground/70 transition-colors hover:bg-black/5"
          >
            {cancelLabel}
          </button>
          <button
            type="submit"
            className="rounded-xl bg-primary px-5 py-2 text-sm text-white transition-colors hover:bg-primary/90"
          >
            {confirmLabel}
          </button>
        </div>
      </form>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Main SettingsView                                                 */
/* ------------------------------------------------------------------ */

const SettingsView: React.FC<SettingsViewProps> = ({
  language,
  theme,
  onLanguageChange,
  onThemeChange
}) => {
  const { formatDate, languageOptions, t } = useI18n();
  const {
    avatar,
    displayName,
    newlineShortcut,
    secondaryPassword,
    sendShortcut,
    setAvatar,
    setDisplayName,
    setSecondaryPassword,
    setSendShortcut,
    setTextSize,
    textSize,
    toggleWindowShortcut
  } = useAppSettings();
  const [activePanel, setActivePanel] = useState<
    | "root"
    | "features"
    | "release-notes"
    | "secondary-password"
    | "import-notes"
    | "export-notes"
  >("root");
  const selectedTextSizeIndex = TEXT_SIZE_OPTIONS.indexOf(textSize);

  // Avatar states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);

  // Nickname dialog state
  const [showNicknameDialog, setShowNicknameDialog] = useState(false);
  const [floatingNotice, setFloatingNotice] = useState<FloatingNotice | null>(null);
  const [currentPasswordInput, setCurrentPasswordInput] = useState("");
  const [nextPasswordInput, setNextPasswordInput] = useState("");
  const [confirmPasswordInput, setConfirmPasswordInput] = useState("");
  const [secondaryPasswordVerified, setSecondaryPasswordVerified] = useState(false);
  const [secondaryPasswordError, setSecondaryPasswordError] = useState<string | null>(null);
  const [activeImportHistoryTab, setActiveImportHistoryTab] = useState<
    "pending" | "completed"
  >("completed");
  const [isExporting, setIsExporting] = useState(false);
  const [lastExportResult, setLastExportResult] = useState<ExportNotesResult | null>(null);

  const handleAvatarClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCropImageSrc(reader.result as string);
    };
    reader.readAsDataURL(file);
    // Reset so the same file can be selected again
    e.target.value = "";
  }, []);

  const handleCropConfirm = useCallback(
    (croppedDataUrl: string) => {
      setAvatar(croppedDataUrl);
      setCropImageSrc(null);
    },
    [setAvatar]
  );

  const handleCropCancel = useCallback(() => {
    setCropImageSrc(null);
  }, []);

  const handleNicknameConfirm = useCallback(
    (name: string) => {
      setDisplayName(name);
      setShowNicknameDialog(false);
    },
    [setDisplayName]
  );

  const handleNicknameCancel = useCallback(() => {
    setShowNicknameDialog(false);
  }, []);

  const showFloatingMessage = useCallback((message: string, tone: FloatingNotice["tone"]) => {
    setFloatingNotice({ message, tone });
  }, []);

  useEffect(() => {
    if (!floatingNotice) return undefined;

    const timer = window.setTimeout(() => {
      setFloatingNotice(null);
    }, 2600);

    return () => {
      window.clearTimeout(timer);
    };
  }, [floatingNotice]);

  const handleReviewNoticeClick = useCallback(() => {
    showFloatingMessage(t("contentUnderReview"), "warning");
  }, [showFloatingMessage, t]);

  const handleAboutClick = useCallback(() => {
    void invoke("open_external_url", { url: ABOUT_PAGE_URL }).catch((error) => {
      console.error("Failed to open about page", error);
    });
  }, []);

  const handleFeedbackClick = useCallback(() => {
    showFloatingMessage(t("feedbackChannelBuilding"), "warning");
  }, [showFloatingMessage, t]);

  const handleOpenImportPanel = useCallback(() => {
    setActiveImportHistoryTab("completed");
    setActivePanel("import-notes");
  }, []);

  const handleOpenExportPanel = useCallback(() => {
    setActivePanel("export-notes");
  }, []);

  const resetSecondaryPasswordForm = useCallback(() => {
    setCurrentPasswordInput("");
    setNextPasswordInput("");
    setConfirmPasswordInput("");
    setSecondaryPasswordVerified(false);
    setSecondaryPasswordError(null);
  }, []);

  const openSecondaryPasswordPanel = useCallback(() => {
    resetSecondaryPasswordForm();
    setActivePanel("secondary-password");
  }, [resetSecondaryPasswordForm]);

  const handleSecondaryPasswordVerify = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      if (currentPasswordInput !== secondaryPassword) {
        setSecondaryPasswordError(t("secondaryPasswordInvalidCurrent"));
        setSecondaryPasswordVerified(false);
        return;
      }

      setSecondaryPasswordError(null);
      setSecondaryPasswordVerified(true);
    },
    [currentPasswordInput, secondaryPassword, t]
  );

  const handleSecondaryPasswordSave = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      if (!/^\d{4}$/.test(nextPasswordInput) || !/^\d{4}$/.test(confirmPasswordInput)) {
        setSecondaryPasswordError(t("secondaryPasswordInvalidFormat"));
        return;
      }

      if (nextPasswordInput !== confirmPasswordInput) {
        setSecondaryPasswordError(t("secondaryPasswordMismatch"));
        return;
      }

      setSecondaryPassword(nextPasswordInput);
      resetSecondaryPasswordForm();
      setActivePanel("root");
      showFloatingMessage(t("secondaryPasswordSaved"), "success");
    },
    [
      confirmPasswordInput,
      nextPasswordInput,
      resetSecondaryPasswordForm,
      setSecondaryPassword,
      showFloatingMessage,
      t
    ]
  );

  const handleExportNotes = useCallback(async () => {
    setIsExporting(true);

    try {
      const result = await invoke<ExportNotesResult>("export_notes_as_html", {
        language
      });
      setLastExportResult(result);
      showFloatingMessage(t("exportSuccessMessage"), "success");
    } catch (error) {
      console.error("Failed to export notes", error);
      showFloatingMessage(t("exportErrorMessage"), "warning");
    } finally {
      setIsExporting(false);
    }
  }, [language, showFloatingMessage, t]);

  const releaseNotes: ReleaseNoteEntry[] = [
    {
      version: APP_VERSION,
      highlights: [
        t("releaseNote010Item1"),
        t("releaseNote010Item2"),
        t("releaseNote010Item3")
      ]
    }
  ];

  const renderPanelBackButton = (label: string, onClick: () => void) => (
    <button
      type="button"
      onClick={onClick}
      className={panelBackButtonClassName}
    >
      <ChevronLeft className="h-4 w-4" />
      <span>{label}</span>
    </button>
  );

  const importSources = [
    {
      id: "flomo",
      title: t("importSourceFlomo"),
      logoSrc: flomoLogo,
      accentClassName: "border-primary/20 bg-primary/10 text-primary"
    },
    {
      id: "markdown",
      title: t("importSourceMarkdown"),
      logoSrc: markdownLogo,
      accentClassName: "border-primary/20 bg-primary/10 text-primary"
    },
    {
      id: "obsidian",
      title: t("importSourceObsidian"),
      logoSrc: obsidianLogo,
      accentClassName: "border-primary/20 bg-primary/10 text-primary",
      logoClassName: "scale-125"
    },
    {
      id: "notion",
      title: t("importSourceNotion"),
      logoSrc: notionLogo,
      accentClassName: "border-primary/20 bg-primary/10 text-primary"
    }
  ];
  const visibleImportHistory: Array<{
    fileName: string;
    size: number;
    completedAt: number;
  }> = [];

  const featureSettingsContent = (
    <div className="space-y-4">
      {renderPanelBackButton(t("settingsFeatureSettings"), () => setActivePanel("root"))}

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

        <div className="mt-3 flex items-start text-foreground/65">
          {TEXT_SIZE_OPTIONS.map((option, index) => (
            <React.Fragment key={`label-${option}`}>
              <div
                className="flex w-7 shrink-0 justify-center"
                style={
                  option === 12 || option === 16 || option === 24
                    ? { fontSize: `${option}px`, lineHeight: 1.2 }
                    : undefined
                }
              >
                <span className="whitespace-nowrap">
                  {option === 12 && t("featureTextSizeMin")}
                  {option === 16 && t("featureTextSizeStandard")}
                  {option === 24 && t("featureTextSizeMax")}
                </span>
              </div>
              {index < TEXT_SIZE_OPTIONS.length - 1 && (
                <div className="flex-1" />
              )}
            </React.Fragment>
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

  const releaseNotesContent = (
    <div className="space-y-4">
      {renderPanelBackButton(t("settingsReleaseNotes"), () => setActivePanel("root"))}

      <div className="rounded-[28px] border border-black/5 bg-surface/95 px-5 py-5 shadow-sm">
        <div className="space-y-4">
          {releaseNotes.map((note) => (
            <div
              key={note.version}
              className="rounded-3xl border border-black/5 bg-background px-5 py-4"
            >
              <div className="text-lg font-semibold text-foreground">v{note.version}</div>

              <ul className="mt-4 space-y-2 text-sm leading-6 text-foreground/70">
                {note.highlights.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const secondaryPasswordContent = (
    <div className="space-y-4">
      {renderPanelBackButton(t("settingsSecondaryPassword"), () => {
        resetSecondaryPasswordForm();
        setActivePanel("root");
      })}

      <div className="rounded-[28px] border border-black/5 bg-surface/95 px-5 py-5 shadow-sm">
        <div className="mb-4 text-sm text-primary/80">
          {t("secondaryPasswordHint")}
        </div>

        <form
          onSubmit={
            secondaryPasswordVerified
              ? handleSecondaryPasswordSave
              : handleSecondaryPasswordVerify
          }
          className="space-y-4"
        >
          <label className="block">
            <div className="mb-2 text-sm text-foreground/70">
              {t("secondaryPasswordCurrent")}
            </div>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={currentPasswordInput}
              onChange={(event) =>
                setCurrentPasswordInput(event.target.value.replace(/\D/g, "").slice(0, 4))
              }
              placeholder="0000"
              className="w-full rounded-2xl border border-black/10 bg-background px-4 py-3 text-sm tracking-[0.35em] text-foreground outline-none transition-colors focus:border-primary"
            />
          </label>

          {secondaryPasswordVerified && (
            <>
              <div className="rounded-2xl bg-primary/8 px-4 py-3 text-sm text-primary">
                {t("secondaryPasswordVerified")}
              </div>

              <label className="block">
                <div className="mb-2 text-sm text-foreground/70">
                  {t("secondaryPasswordNew")}
                </div>
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  value={nextPasswordInput}
                  onChange={(event) =>
                    setNextPasswordInput(event.target.value.replace(/\D/g, "").slice(0, 4))
                  }
                  placeholder="0000"
                  className="w-full rounded-2xl border border-black/10 bg-background px-4 py-3 text-sm tracking-[0.35em] text-foreground outline-none transition-colors focus:border-primary"
                />
              </label>

              <label className="block">
                <div className="mb-2 text-sm text-foreground/70">
                  {t("secondaryPasswordConfirm")}
                </div>
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  value={confirmPasswordInput}
                  onChange={(event) =>
                    setConfirmPasswordInput(event.target.value.replace(/\D/g, "").slice(0, 4))
                  }
                  placeholder="0000"
                  className="w-full rounded-2xl border border-black/10 bg-background px-4 py-3 text-sm tracking-[0.35em] text-foreground outline-none transition-colors focus:border-primary"
                />
              </label>
            </>
          )}

          {secondaryPasswordError && (
            <div className="rounded-2xl bg-rose-500/10 px-4 py-3 text-sm text-rose-500">
              {secondaryPasswordError}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded-2xl bg-primary px-5 py-2.5 text-sm text-white transition-colors hover:bg-primary/90"
            >
              {secondaryPasswordVerified
                ? t("secondaryPasswordSave")
                : t("secondaryPasswordNext")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const importNotesContent = (
    <div className="space-y-4">
      {renderPanelBackButton(t("settingsImportNotes"), () => setActivePanel("root"))}

      <div className="rounded-[32px] border border-black/5 bg-surface/95 px-5 py-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          {importSources.map((source) => (
            <IntegrationCard
              key={source.id}
              title={source.title}
              logoSrc={source.logoSrc}
              accentClassName={source.accentClassName}
              logoClassName={source.logoClassName}
              actionLabel={t("syncComingSoon")}
            />
          ))}
        </div>

        <div className="mt-6 rounded-[28px] border border-black/5 bg-background px-4 py-4">
          <div className="flex flex-wrap items-center gap-6">
            <div className="text-[28px] font-semibold text-foreground">
              {t("importHistoryTitle")}
            </div>
            <div className="inline-flex items-center gap-4">
              <HistoryTabButton
                active={activeImportHistoryTab === "pending"}
                label={t("importHistoryPending")}
                onClick={() => setActiveImportHistoryTab("pending")}
              />
              <HistoryTabButton
                active={activeImportHistoryTab === "completed"}
                label={t("importHistoryCompleted")}
                onClick={() => setActiveImportHistoryTab("completed")}
              />
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-black/5">
            <div className="grid grid-cols-[minmax(0,2fr)_140px_180px] gap-4 bg-surface px-5 py-3 text-sm font-semibold text-foreground">
              <span>{t("importHistoryFile")}</span>
              <span>{t("importHistorySize")}</span>
              <span>{t("importHistoryFinishedAt")}</span>
            </div>

            {visibleImportHistory.length > 0 ? (
              visibleImportHistory.map((entry) => (
                <div
                  key={`${entry.fileName}-${entry.completedAt}`}
                  className="grid grid-cols-[minmax(0,2fr)_140px_180px] gap-4 border-t border-black/5 px-5 py-4 text-sm text-foreground/70"
                >
                  <span className="truncate">{entry.fileName}</span>
                  <span>{formatFileSize(entry.size)}</span>
                  <span>{formatDate(entry.completedAt)}</span>
                </div>
              ))
            ) : (
              <div className="flex min-h-44 items-center justify-center px-6 text-center text-base text-foreground/35">
                {t("importHistoryEmpty")}
              </div>
            )}
          </div>

          <div className="mt-6 text-base leading-7 text-foreground/45">
            {t("importHistoryHint")}
          </div>
        </div>
      </div>
    </div>
  );

  const exportNotesContent = (
    <div className="space-y-4">
      {renderPanelBackButton(t("settingsExportNotes"), () => setActivePanel("root"))}

      <div className="rounded-[32px] border border-black/5 bg-surface/95 px-5 py-5 shadow-sm">
        <div className="max-w-3xl">
          <div className="text-[30px] font-semibold text-foreground">
            {t("settingsExportTitle")}
          </div>
          <p className="mt-3 text-base leading-7 text-foreground/60">
            {t("settingsExportDescription")}
          </p>
        </div>

        <div className="mt-6">
          <div className="mb-3 text-lg font-semibold text-foreground">
            {t("exportFormatLabel")}
          </div>
          <button
            type="button"
            className="inline-flex min-w-[124px] items-center justify-center rounded-2xl border border-primary bg-primary/8 px-5 py-3 text-base font-medium text-primary shadow-sm"
          >
            {t("exportFormatHtml")}
          </button>
        </div>

        <div className="mt-6">
          <button
            type="button"
            onClick={() => void handleExportNotes()}
            disabled={isExporting}
            className="inline-flex min-w-[124px] items-center justify-center rounded-2xl bg-primary px-5 py-3 text-base font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/55"
          >
            {isExporting ? t("exportExporting") : t("exportNow")}
          </button>
        </div>

        {lastExportResult && (
          <div className="mt-6 rounded-[28px] border border-black/5 bg-background px-5 py-5">
            <div className="text-xl font-semibold text-foreground">
              {t("exportLastResultTitle")}
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-black/5 bg-surface px-4 py-3">
                <div className="text-sm text-foreground/45">
                  {t("exportLastResultFile")}
                </div>
                <div className="mt-1 break-all text-sm text-foreground/75">
                  {lastExportResult.file_name}
                </div>
              </div>
              <div className="rounded-2xl border border-black/5 bg-surface px-4 py-3">
                <div className="text-sm text-foreground/45">
                  {t("exportLastResultPath")}
                </div>
                <div className="mt-1 break-all text-sm text-foreground/75">
                  {lastExportResult.file_path}
                </div>
              </div>
              <div className="rounded-2xl border border-black/5 bg-surface px-4 py-3">
                <div className="text-sm text-foreground/45">
                  {t("exportLastResultCount")}
                </div>
                <div className="mt-1 text-sm text-foreground/75">
                  {lastExportResult.snippet_count}
                </div>
              </div>
              <div className="rounded-2xl border border-black/5 bg-surface px-4 py-3">
                <div className="text-sm text-foreground/45">
                  {t("exportLastResultFolders")}
                </div>
                <div className="mt-1 text-sm text-foreground/75">
                  {lastExportResult.folder_count} · {formatFileSize(lastExportResult.bytes)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
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
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".png,.jpg,.jpeg"
                className="hidden"
                onChange={handleFileChange}
              />
              {/* Avatar circle with hover overlay */}
              <button
                type="button"
                onClick={handleAvatarClick}
                className="group relative flex h-12 w-12 items-center justify-center rounded-full border border-primary/15 bg-primary/10 shadow-sm overflow-hidden"
              >
                {avatar ? (
                  <img
                    src={avatar}
                    alt="avatar"
                    className="h-full w-full object-cover rounded-full"
                  />
                ) : (
                  <span className="text-lg">🧠</span>
                )}
                {/* Hover overlay with camera icon */}
                <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <Camera className="h-5 w-5 text-white/90" />
                </span>
              </button>
            </div>
          )
        },
        {
          id: "display-name",
          icon: BadgeInfo,
          label: t("settingsDisplayName"),
          trailing: (
            <div className="flex items-center gap-2">
              <span className="text-sm text-foreground/60 max-w-[180px] truncate">
                {displayName}
              </span>
              <button
                type="button"
                onClick={() => setShowNicknameDialog(true)}
                className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-foreground/40 transition-colors hover:bg-black/5 hover:text-foreground/70"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
          )
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
          onClick: handleOpenImportPanel
        },
        {
          id: "export",
          icon: Download,
          label: t("settingsExportNotes"),
          onClick: handleOpenExportPanel
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
          label: t("settingsAbout"),
          onClick: handleAboutClick
        },
        {
          id: "feedback",
          icon: MessageSquareMore,
          label: t("settingsFeedback"),
          onClick: handleFeedbackClick
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
          label: t("settingsReleaseNotes"),
          onClick: () => setActivePanel("release-notes")
        },
        {
          id: "version",
          icon: BadgeInfo,
          label: t("settingsVersion"),
          trailing: <span className="text-sm text-rose-500">{APP_VERSION}</span>
        }
      ]
    },
    {
      id: "privacy-security",
      title: t("settingsPrivacySecurity"),
      rows: [
        {
          id: "user-notice",
          icon: BadgeInfo,
          label: t("settingsUserNotice"),
          onClick: handleReviewNoticeClick
        },
        {
          id: "privacy-policy",
          icon: FileText,
          label: t("settingsPrivacyPolicy"),
          onClick: handleReviewNoticeClick
        },
        {
          id: "secondary-password",
          icon: ShieldCheck,
          label: t("settingsSecondaryPassword"),
          onClick: openSecondaryPasswordPanel
        }
      ]
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto px-6 py-5">
      {floatingNotice && (
        <div className="pointer-events-none fixed left-1/2 top-6 z-40 -translate-x-1/2">
          <div
            className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm shadow-lg ${
              floatingNotice.tone === "warning"
                ? "border border-black/8 bg-white text-black"
                : "bg-emerald-500 text-white"
            }`}
          >
            <span
              className={`inline-flex h-7 w-7 items-center justify-center rounded-full ${
                floatingNotice.tone === "warning"
                  ? "bg-[#F4C63D] text-white"
                  : "bg-white/20"
              }`}
            >
              {floatingNotice.tone === "warning" ? (
                <CircleAlert className="h-4 w-4" />
              ) : (
                <Check className="h-4 w-4" />
              )}
            </span>
            <span className="whitespace-nowrap">{floatingNotice.message}</span>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-4xl">
        {activePanel === "features" ? (
          featureSettingsContent
        ) : activePanel === "release-notes" ? (
          releaseNotesContent
        ) : activePanel === "secondary-password" ? (
          secondaryPasswordContent
        ) : activePanel === "import-notes" ? (
          importNotesContent
        ) : activePanel === "export-notes" ? (
          exportNotesContent
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

      {/* Avatar Crop Dialog */}
      {cropImageSrc && (
        <AvatarCropDialog
          imageSrc={cropImageSrc}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
          titleLabel={t("avatarCropTitle")}
          confirmLabel={t("avatarCropConfirm")}
          cancelLabel={t("avatarCropCancel")}
        />
      )}

      {/* Nickname Edit Dialog */}
      {showNicknameDialog && (
        <NicknameEditDialog
          currentName={displayName}
          onConfirm={handleNicknameConfirm}
          onCancel={handleNicknameCancel}
          titleLabel={t("editNicknameTitle")}
          placeholderLabel={t("editNicknamePlaceholder")}
          confirmLabel={t("editNicknameConfirm")}
          cancelLabel={t("editNicknameCancel")}
        />
      )}
    </div>
  );
};

export default SettingsView;
