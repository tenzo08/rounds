"use client";

import { ModalShell } from "@/components/binder/ModalShell";
import { subjectColor } from "@/lib/topics";
import { renderMarkdown } from "@/lib/markdown";
import type { GroupFeedNoteDTO } from "@/lib/types";

interface GroupNoteViewModalProps {
  note: GroupFeedNoteDTO;
  onClose: () => void;
}

export function GroupNoteViewModal({ note, onClose }: GroupNoteViewModalProps) {
  const color = subjectColor(note.subject);
  const updated = new Date(note.updatedAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <ModalShell accentColor={color} onClose={onClose}>
      <div className="pr-5 flex items-center gap-2 font-mono text-[11px] text-ink-soft">
        {note.authorImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={note.authorImage}
            alt=""
            className="h-4 w-4 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-paper-grid text-[8px] font-semibold text-ink-soft">
            {note.authorName.slice(0, 1).toUpperCase()}
          </span>
        )}
        <span>
          {note.authorName} · {note.subject} / {note.topic} / {note.folder} ·
          updated {updated}
        </span>
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

      <div className="mt-[22px] flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="rounded border border-line px-4 py-2.5 text-[13.5px] font-semibold text-ink transition-opacity hover:opacity-88"
        >
          Close
        </button>
      </div>
    </ModalShell>
  );
}
