"use client";

import { useRef, useState } from "react";
import { ModalShell } from "@/components/binder/ModalShell";
import { CATEGORIES, categoryMeta } from "@/lib/categories";
import type { NoteInput } from "@/lib/actions/notes";
import type { NoteDTO } from "@/lib/types";
import type { Category } from "@/generated/prisma/client";

interface NoteFormModalProps {
  note: NoteDTO | null;
  defaultCategory: Category;
  onClose: () => void;
  onSubmit: (input: NoteInput) => void;
  isSaving: boolean;
}

export function NoteFormModal({
  note,
  defaultCategory,
  onClose,
  onSubmit,
  isSaving,
}: NoteFormModalProps) {
  const [title, setTitle] = useState(note?.title ?? "");
  const [category, setCategory] = useState<Category>(
    note?.category ?? defaultCategory,
  );
  const [body, setBody] = useState(note?.body ?? "");
  const [tagsRaw, setTagsRaw] = useState(note?.tags.join(", ") ?? "");
  const [link, setLink] = useState(note?.link ?? "");
  const [error, setError] = useState<string | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  const cat = categoryMeta(category);

  function handleSubmit() {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Title is required");
      titleRef.current?.focus();
      return;
    }
    const tags = tagsRaw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    onSubmit({
      title: trimmedTitle,
      category,
      body: body.trim(),
      tags,
      link: link.trim(),
    });
  }

  return (
    <ModalShell accentColor={cat.hex} onClose={onClose}>
      <h3 className="m-0 font-serif text-[19px] text-ink">
        {note ? "Edit entry" : "New entry"}
      </h3>

      <Field label="Title">
        <input
          ref={titleRef}
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (error) setError(null);
          }}
          placeholder="e.g. Beta-blocker teaching points"
          className="w-full rounded border border-line bg-paper px-[11px] py-[9px] font-sans text-sm text-ink outline-none focus:border-ink"
        />
        {error && <p className="mt-1 text-xs text-c-crit">{error}</p>}
      </Field>

      <Field label="Rotation">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as Category)}
          className="w-full rounded border border-line bg-paper px-[11px] py-[9px] font-sans text-sm text-ink outline-none focus:border-ink"
        >
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Notes">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="What do you need to remember? One entry can hold a whole lecture — use # for a heading, - for a bullet, ** for bold."
          className="min-h-[120px] w-full resize-y rounded border border-line bg-paper px-[11px] py-[9px] font-sans text-sm leading-[1.5] text-ink outline-none focus:border-ink"
        />
        <p className="-mt-1 font-mono text-[10.5px] text-ink-soft opacity-75">
          # heading · - bullet · **bold** · leave a blank line between
          sections
        </p>
      </Field>

      <Field label="Tags (comma separated)">
        <input
          type="text"
          value={tagsRaw}
          onChange={(e) => setTagsRaw(e.target.value)}
          placeholder="e.g. cardiac, dosing, nclex"
          className="w-full rounded border border-line bg-paper px-[11px] py-[9px] font-sans text-sm text-ink outline-none focus:border-ink"
        />
      </Field>

      <Field label="Reference link (optional)">
        <input
          type="text"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="https://"
          className="w-full rounded border border-line bg-paper px-[11px] py-[9px] font-sans text-sm text-ink outline-none focus:border-ink"
        />
      </Field>

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
          {isSaving ? "Saving…" : note ? "Save changes" : "Add entry"}
        </button>
      </div>
    </ModalShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-4 first:mt-0">
      <label className="mb-1.5 block font-mono text-[10.5px] tracking-[0.08em] text-ink-soft uppercase">
        {label}
      </label>
      {children}
    </div>
  );
}
