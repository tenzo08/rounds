"use client";

import { useState } from "react";
import { ModalShell } from "@/components/binder/ModalShell";
import { ShareModal } from "@/components/binder/ShareModal";
import { subjectColor } from "@/lib/topics";
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
  const [isShareOpen, setIsShareOpen] = useState(false);
  const color = subjectColor(note.subject);
  const updated = new Date(note.updatedAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <>
      <ModalShell accentColor={color} onClose={onClose}>
        <div className="pr-6 font-mono text-[11px] text-ink-soft">
          {note.subject} / {note.topic} / {note.folder} · updated {updated}
        </div>

        <div
          className="mt-3.5 rounded-[3px] px-3.5 py-3 font-serif text-[20px] leading-[1.3] text-ink"
          style={{ background: `${color}1a` }}
        >
          {note.focus}
        </div>

        <div className="mt-3.5 text-sm leading-[1.65] text-ink">
          {renderMarkdown(note.description)}
        </div>

        <div className="mt-[22px] flex flex-wrap items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={onDelete}
            disabled={isDeleting}
            className="rounded bg-c-crit px-4 py-2.5 text-[13.5px] font-semibold text-white transition-opacity hover:opacity-88 disabled:opacity-50"
          >
            {isDeleting ? "Deleting…" : "Delete"}
          </button>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setIsShareOpen(true)}
              className="rounded border border-line px-4 py-2.5 text-[13.5px] font-semibold text-ink transition-opacity hover:opacity-88"
            >
              Share
            </button>
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

      {isShareOpen && (
        <ShareModal
          noteId={note.id}
          accentColor={color}
          onClose={() => setIsShareOpen(false)}
        />
      )}
    </>
  );
}
