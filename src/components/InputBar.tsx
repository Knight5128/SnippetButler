import React, { useState } from "react";
import { SendHorizonal } from "lucide-react";
import { useAppSettings } from "../appSettings";
import { useSnippetStore } from "../stores/snippetStore";
import { useI18n } from "../i18n";

const InputBar: React.FC = () => {
  const [value, setValue] = useState("");
  const addSnippetFromText = useSnippetStore((s) => s.addSnippetFromText);
  const { t } = useI18n();
  const { sendShortcut, textSize } = useAppSettings();

  const handleSubmit = async () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    await addSnippetFromText(trimmed);
    setValue("");
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    const isSubmitShortcut =
      (sendShortcut === "enter" && e.key === "Enter" && !e.shiftKey) ||
      (sendShortcut === "shift-enter" && e.key === "Enter" && e.shiftKey);

    if (isSubmitShortcut) {
      e.preventDefault();
      void handleSubmit();
    }
  };

  return (
    <div className="border-t border-black/5 bg-surface/95 px-5 py-4">
      <div className="flex items-end gap-3">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t("inputPlaceholder")}
          className="max-h-32 min-h-[52px] flex-1 resize-none rounded-2xl border border-black/5 bg-background/80 px-3 py-3 text-xs outline-none transition-colors focus:border-primary"
          style={{ fontSize: `${textSize}px` }}
        />
        <button
          type="button"
          onClick={handleSubmit}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs shadow-sm transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
          disabled={!value.trim()}
        >
          <SendHorizonal className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default InputBar;

