import { categoryMeta } from "@/lib/categories";
import { stripMarkdown } from "@/lib/markdown";
import type { NoteDTO } from "@/lib/types";

interface NoteCardProps {
  note: NoteDTO;
  onClick: () => void;
}

export function NoteCard({ note, onClick }: NoteCardProps) {
  const cat = categoryMeta(note.category);

  return (
    <div
      onClick={onClick}
      className="relative cursor-pointer rounded-[3px] border border-line bg-card px-4 pt-4 pb-3.5 shadow-[0_1px_0_rgba(0,0,0,0.04)] transition-[transform,box-shadow] duration-150 ease-out motion-reduce:transition-none motion-safe:hover:-translate-y-[3px] motion-safe:hover:rotate-[-0.3deg] motion-safe:hover:shadow-[0_10px_20px_rgba(30,40,35,0.12)]"
    >
      <div
        className="absolute top-0 left-0 h-[5px] w-full rounded-t-[3px]"
        style={{ background: cat.hex }}
      />
      <div
        className="mt-1.5 mb-2 font-mono text-[10px] font-medium tracking-[0.08em] uppercase"
        style={{ color: cat.hex }}
      >
        {cat.label}
      </div>
      <h3 className="m-0 mb-2 font-serif text-[16.5px] leading-[1.3] text-ink">
        {note.title}
      </h3>
      <p className="m-0 mb-3 line-clamp-3 text-[12.8px] leading-[1.55] text-ink-soft">
        {stripMarkdown(note.body)}
      </p>
      {note.tags.length > 0 && (
        <div className="flex flex-wrap gap-[5px]">
          {note.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="rounded-[3px] bg-paper-grid px-[7px] py-[3px] font-mono text-[10px] text-ink-soft"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
