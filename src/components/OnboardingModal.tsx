"use client";

import { useRef, useState } from "react";
import { ModalShell } from "@/components/binder/ModalShell";
import { completeOnboarding } from "@/lib/actions/profile";
import {
  AVATAR_ICONS,
  downscaleToDataUrl,
  renderIconToDataUrl,
} from "@/lib/avatarImage";

interface OnboardingModalProps {
  currentName: string;
  currentAvatarUrl: string | null;
  onDone: () => void;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

export function OnboardingModal({
  currentName,
  currentAvatarUrl,
  onDone,
}: OnboardingModalProps) {
  const [displayName, setDisplayName] = useState(currentName);
  const [previewUrl, setPreviewUrl] = useState(currentAvatarUrl ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  async function handleFileSelected(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file");
      return;
    }
    try {
      const dataUrl = await downscaleToDataUrl(file);
      setPreviewUrl(dataUrl);
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  function handlePickIcon(emoji: string, color: string) {
    const dataUrl = renderIconToDataUrl(emoji, color);
    if (dataUrl) setPreviewUrl(dataUrl);
  }

  async function handleContinue() {
    const trimmedName = displayName.trim();
    if (!trimmedName) {
      setError("Nickname is required");
      nameRef.current?.focus();
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await completeOnboarding({ displayName: trimmedName, avatarUrl: previewUrl });
      onDone();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ModalShell accentColor="#4A7C59" onClose={onDone}>
      <h3 className="m-0 pr-6 font-serif text-[19px] text-ink">
        Welcome to The Rounds
      </h3>
      <p className="mt-1.5 mb-4 text-[13px] text-ink-soft">
        Set a nickname classmates will see, and optionally pick a picture —
        upload one, choose an icon, or skip and use your initial.
      </p>

      <div className="flex items-center gap-3">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt=""
            className="h-16 w-16 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-paper-grid text-lg font-semibold text-ink-soft">
            {(displayName || "?").slice(0, 1).toUpperCase()}
          </div>
        )}
        <div>
          <label className="inline-block cursor-pointer rounded border border-line bg-card px-3 py-1.5 text-xs font-semibold text-ink transition-opacity hover:opacity-88">
            Upload picture
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFileSelected(file);
              }}
            />
          </label>
          {previewUrl && (
            <button
              type="button"
              onClick={() => setPreviewUrl("")}
              className="ml-2 font-mono text-[10.5px] text-ink-soft uppercase hover:text-ink"
            >
              Remove
            </button>
          )}
        </div>
      </div>

      <div className="mt-4">
        <p className="m-0 mb-1.5 font-mono text-[10.5px] tracking-[0.08em] text-ink-soft uppercase">
          Or choose an icon
        </p>
        <div className="flex flex-wrap gap-2">
          {AVATAR_ICONS.map(({ emoji, color }) => (
            <button
              key={emoji}
              type="button"
              onClick={() => handlePickIcon(emoji, color)}
              style={{ background: color }}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl transition-opacity hover:opacity-80"
              aria-label={`Use ${emoji} icon`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <label className="mb-1.5 block font-mono text-[10.5px] tracking-[0.08em] text-ink-soft uppercase">
          Nickname
        </label>
        <input
          ref={nameRef}
          type="text"
          value={displayName}
          onChange={(e) => {
            setDisplayName(e.target.value);
            if (error) setError(null);
          }}
          placeholder="How you'll appear to classmates"
          className="w-full rounded border border-line bg-paper px-[11px] py-[9px] font-sans text-sm text-ink outline-none focus:border-ink"
        />
      </div>

      {error && <p className="mt-2 text-xs text-c-crit">{error}</p>}

      <div className="mt-[22px] flex justify-end">
        <button
          type="button"
          onClick={handleContinue}
          disabled={isSaving}
          className="rounded bg-ink px-4 py-2.5 text-[13.5px] font-semibold text-paper transition-opacity hover:opacity-88 disabled:opacity-50"
        >
          {isSaving ? "Saving…" : "Continue"}
        </button>
      </div>
    </ModalShell>
  );
}
