"use client";

import { useRef, useState } from "react";
import { ModalShell } from "@/components/binder/ModalShell";

interface CreateGroupModalProps {
  onClose: () => void;
  onSubmit: (name: string) => void;
  isSaving: boolean;
}

export function CreateGroupModal({
  onClose,
  onSubmit,
  isSaving,
}: CreateGroupModalProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Group name is required");
      inputRef.current?.focus();
      return;
    }
    onSubmit(trimmed);
  }

  return (
    <ModalShell accentColor="#1E2823" onClose={onClose}>
      <h3 className="m-0 font-serif text-[19px] text-ink">New group</h3>

      <div className="mt-4">
        <label className="mb-1.5 block font-mono text-[10.5px] tracking-[0.08em] text-ink-soft uppercase">
          Group name
        </label>
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError(null);
          }}
          placeholder="e.g. NURS 302 Cohort"
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
          onClick={handleSubmit}
          disabled={isSaving}
          className="rounded bg-ink px-4 py-2.5 text-[13.5px] font-semibold text-paper transition-opacity hover:opacity-88 disabled:opacity-50"
        >
          {isSaving ? "Creating…" : "Create group"}
        </button>
      </div>
    </ModalShell>
  );
}
