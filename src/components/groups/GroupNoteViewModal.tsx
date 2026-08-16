"use client";

import { ModalShell } from "@/components/binder/ModalShell";
import { topicColor } from "@/lib/topics";
import { renderMarkdown } from "@/lib/markdown";
import type { GroupFeedNoteDTO } from "@/lib/types";

interface GroupNoteViewModalProps {
  note: GroupFeedNoteDTO;
  onClose: () => void;
}

export function GroupNoteViewModal({ note, onClose }: GroupNoteViewModalProps) {
  const color = topicColor(note.topic);
  const updated = new Date(note.updatedAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <ModalShell accentColor={color} onClose={onClose}>
      <h3 className="m-0 pr-5 font-serif text-xl text-ink">{note.title}</h3>
      <div className="mt-1 flex items-center gap-2 font-mono text-[11px] text-ink-soft">
        {note.authorImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={note.authorImage}
            alt=""
            className="h-4 w-4 shrink-0 rounded-full"
          />
        ) : (
          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-paper-grid text-[8px] font-semibold text-ink-soft">
            {note.authorName.slice(0, 1).toUpperCase()}
          </span>
        )}
        <span>
          {note.authorName} · {note.topic} · updated {updated}
        </span>
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
