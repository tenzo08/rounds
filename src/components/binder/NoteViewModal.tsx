"use client";

import { ModalShell } from "@/components/binder/ModalShell";
import { categoryMeta } from "@/lib/categories";
import { renderMarkdown } from "@/lib/markdown";
import type { NoteDTO } from "@/lib/types";

interface NoteViewModalProps {
  note: NoteDTO;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}

export function NoteViewModal({
  note,
  onClose,
  onEdit,
  onDelete,
  isDeleting,
}: NoteViewModalProps) {
  const cat = categoryMeta(note.category);
  const updated = new Date(note.updatedAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <ModalShell accentColor={cat.hex} onClose={onClose}>
      <div className="flex items-start justify-between">
        <div>
          <h3 className="m-0 pr-5 font-serif text-xl text-ink">
            {note.title}
          </h3>
          <div className="mt-1 font-mono text-[11px] text-ink-soft">
            {cat.label} · updated {updated}
          </div>
        </div>
      </div>

      <div className="mt-3.5 text-sm leading-[1.65] text-ink">
        {renderMarkdown(note.body)}
      </div>

      {note.tags.length > 0 && (
        <div className="mt-3.5 flex flex-wrap gap-[5px]">
          {note.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-[3px] bg-paper-grid px-[7px] py-[3px] font-mono text-[10px] text-ink-soft"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {note.link && (
        <a
          href={note.link}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3.5 inline-block font-mono text-[12.5px] text-c-medsurg"
        >
          {note.link} ↗
        </a>
      )}

      <div className="mt-[22px] flex items-center justify-between gap-2.5">
        <button
          type="button"
          onClick={onDelete}
          disabled={isDeleting}
          className="rounded bg-c-crit px-4 py-2.5 text-[13.5px] font-semibold text-white transition-opacity hover:opacity-88 disabled:opacity-50"
        >
          {isDeleting ? "Deleting…" : "Delete"}
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-line px-4 py-2.5 text-[13.5px] font-semibold text-ink transition-opacity hover:opacity-88"
          >
            Close
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="rounded bg-ink px-4 py-2.5 text-[13.5px] font-semibold text-paper transition-opacity hover:opacity-88"
          >
            Edit
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
