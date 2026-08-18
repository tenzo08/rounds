"use client";

import { useState } from "react";
import { ModalShell } from "@/components/binder/ModalShell";

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  // Red confirm button for destructive/irreversible actions (the default —
  // most confirmations in this app are deletes); a neutral dark button for
  // consequential-but-not-destructive ones (e.g. leaving a group).
  isDestructive?: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

// Shared "are you sure?" modal — replaces window.confirm() everywhere in
// the app so confirmations match the rest of the design instead of the
// browser's native dialog.
export function ConfirmModal({
  title,
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  isDestructive = true,
  onClose,
  onConfirm,
}: ConfirmModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  async function handleConfirm() {
    setIsConfirming(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsConfirming(false);
    }
  }

  return (
    <ModalShell accentColor={isDestructive ? "#B33A3A" : "#1E2823"} onClose={onClose}>
      <h3 className="m-0 pr-6 font-serif text-[19px] text-ink">{title}</h3>
      <p className="mt-2 text-[13.5px] leading-[1.5] text-ink-soft">{message}</p>

      {error && <p className="mt-3 text-xs text-c-crit">{error}</p>}

      <div className="mt-[22px] flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded border border-line px-4 py-2.5 text-[13.5px] font-semibold text-ink transition-opacity hover:opacity-88"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={() => void handleConfirm()}
          disabled={isConfirming}
          className={
            "rounded px-4 py-2.5 text-[13.5px] font-semibold transition-opacity hover:opacity-88 disabled:opacity-50 " +
            (isDestructive ? "bg-c-crit text-white" : "bg-ink text-paper")
          }
        >
          {isConfirming ? "Working…" : confirmLabel}
        </button>
      </div>
    </ModalShell>
  );
}
