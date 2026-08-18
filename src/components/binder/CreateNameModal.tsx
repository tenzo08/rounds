"use client";

import { useRef, useState } from "react";
import { ModalShell } from "@/components/binder/ModalShell";

interface CreateNameModalProps {
  title: string;
  label: string;
  placeholder?: string;
  accentColor?: string;
  submitLabel?: string;
  onClose: () => void;
  onCreate: (name: string) => Promise<void>;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

// Shared "type one name, create it" modal — used wherever a Subject,
// Topic, or Folder is created explicitly (as opposed to implicitly by
// typing a new name on a flashcard). Matches ModalShell's look instead of
// a native window.prompt() dialog.
export function CreateNameModal({
  title,
  label,
  placeholder,
  accentColor = "#1E2823",
  submitLabel = "Create",
  onClose,
  onCreate,
}: CreateNameModalProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("A name is required");
      inputRef.current?.focus();
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await onCreate(trimmed);
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ModalShell accentColor={accentColor} onClose={onClose}>
      <h3 className="m-0 pr-6 font-serif text-[19px] text-ink">{title}</h3>

      <div className="mt-4">
        <label className="mb-1.5 block font-mono text-[10.5px] tracking-[0.08em] text-ink-soft uppercase">
          {label}
        </label>
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void handleSubmit();
            }
          }}
          placeholder={placeholder}
          autoFocus
          className="w-full rounded border border-line bg-paper px-[11px] py-[9px] font-sans text-sm text-ink outline-none focus:border-ink"
        />
        {error && <p className="mt-1 text-xs text-c-crit">{error}</p>}
      </div>

      <div className="mt-[22px] flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded border border-line px-4 py-2.5 text-[13.5px] font-semibold text-ink transition-opacity hover:opacity-88"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={isSaving}
          className="rounded bg-ink px-4 py-2.5 text-[13.5px] font-semibold text-paper transition-opacity hover:opacity-88 disabled:opacity-50"
        >
          {isSaving ? "Creating…" : submitLabel}
        </button>
      </div>
    </ModalShell>
  );
}
