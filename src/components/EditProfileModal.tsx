"use client";

import { useRef, useState } from "react";
import { ModalShell } from "@/components/binder/ModalShell";
import { updateProfile } from "@/lib/actions/profile";

interface EditProfileModalProps {
  currentName: string;
  currentAvatarUrl: string | null;
  onClose: () => void;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

export function EditProfileModal({
  currentName,
  currentAvatarUrl,
  onClose,
}: EditProfileModalProps) {
  const [displayName, setDisplayName] = useState(currentName);
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  const previewUrl = avatarUrl.trim();

  async function handleSave() {
    const trimmedName = displayName.trim();
    if (!trimmedName) {
      setError("Nickname is required");
      nameRef.current?.focus();
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await updateProfile({ displayName: trimmedName, avatarUrl: avatarUrl.trim() });
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ModalShell accentColor="#1E2823" onClose={onClose}>
      <h3 className="m-0 font-serif text-[19px] text-ink">Edit profile</h3>

      <div className="mt-4 flex items-center gap-3">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt=""
            className="h-12 w-12 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-paper-grid text-base font-semibold text-ink-soft">
            {(displayName || "?").slice(0, 1).toUpperCase()}
          </div>
        )}
        <p className="text-xs text-ink-soft">
          Preview — paste an image link below to change it.
        </p>
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

      <div className="mt-4">
        <label className="mb-1.5 block font-mono text-[10.5px] tracking-[0.08em] text-ink-soft uppercase">
          Profile picture (link, optional)
        </label>
        <input
          type="text"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
          placeholder="https://…"
          className="w-full rounded border border-line bg-paper px-[11px] py-[9px] font-sans text-sm text-ink outline-none focus:border-ink"
        />
        <p className="-mt-1 mt-1.5 font-mono text-[10.5px] text-ink-soft opacity-75">
          Leave blank to show your initial instead
        </p>
      </div>

      {error && <p className="mt-2 text-xs text-c-crit">{error}</p>}

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
          onClick={handleSave}
          disabled={isSaving}
          className="rounded bg-ink px-4 py-2.5 text-[13.5px] font-semibold text-paper transition-opacity hover:opacity-88 disabled:opacity-50"
        >
          {isSaving ? "Saving…" : "Save"}
        </button>
      </div>
    </ModalShell>
  );
}
