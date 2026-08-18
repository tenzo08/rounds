import { subjectColor } from "@/lib/topics";
import { stripMarkdown } from "@/lib/markdown";

interface NoteCardData {
  subject: string;
  topic: string;
  folder: string;
  focus: string;
  description: string;
}

interface NoteCardAuthor {
  name: string;
  image: string | null;
}

interface NoteCardProps {
  id: string;
  note: NoteCardData;
  author?: NoteCardAuthor;
  groupChips?: string[];
  onClick: () => void;
  isSelectMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  isDraggable?: boolean;
  onDragStart?: (id: string) => void;
}

export function NoteCard({
  id,
  note,
  author,
  groupChips,
  onClick,
  isSelectMode,
  isSelected,
  onToggleSelect,
  isDraggable,
  onDragStart,
}: NoteCardProps) {
  const color = subjectColor(note.subject);

  return (
    <div
      onClick={isSelectMode ? onToggleSelect : onClick}
      draggable={isDraggable && !isSelectMode}
      onDragStart={
        isDraggable && !isSelectMode
          ? (e) => {
              e.dataTransfer.setData("text/plain", id);
              e.dataTransfer.effectAllowed = "move";
              onDragStart?.(id);
            }
          : undefined
      }
      className={
        "relative cursor-pointer rounded-[3px] border bg-card px-4 pt-4 pb-3.5 shadow-[0_1px_0_rgba(0,0,0,0.04)] transition-[transform,box-shadow] duration-150 ease-out motion-reduce:transition-none motion-safe:hover:-translate-y-[3px] motion-safe:hover:rotate-[-0.3deg] motion-safe:hover:shadow-[0_10px_20px_rgba(30,40,35,0.12)] " +
        (isSelected ? "border-ink ring-2 ring-ink" : "border-line")
      }
    >
      <div
        className="absolute top-0 left-0 h-[5px] w-full rounded-t-[3px]"
        style={{ background: color }}
      />
      {isSelectMode && (
        <input
          type="checkbox"
          checked={!!isSelected}
          readOnly
          className="absolute top-2.5 right-2.5 h-4 w-4"
        />
      )}
      <div
        className="mt-1.5 mb-2 truncate font-mono text-[10px] font-medium tracking-[0.08em] uppercase"
        style={{ color }}
      >
        {note.subject} / {note.topic} / {note.folder}
      </div>
      <div
        className="mb-2 rounded-[3px] px-2.5 py-1.5 font-serif text-[17px] leading-[1.25] text-ink"
        style={{ background: `${color}1a` }}
      >
        {note.focus}
      </div>
      <p className="m-0 mb-3 line-clamp-3 text-[12.8px] leading-[1.55] text-ink-soft">
        {stripMarkdown(note.description)}
      </p>
      {groupChips && groupChips.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-[5px]">
          {groupChips.map((name) => (
            <span
              key={name}
              className="rounded-[3px] bg-binder px-[7px] py-[3px] font-mono text-[10px] text-binder-text"
            >
              → {name}
            </span>
          ))}
        </div>
      )}
      {author && (
        <div className="flex items-center gap-1.5 border-t border-line pt-2.5">
          {author.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={author.image}
              alt=""
              className="h-5 w-5 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-paper-grid text-[9px] font-semibold text-ink-soft">
              {author.name.slice(0, 1).toUpperCase()}
            </div>
          )}
          <span className="truncate text-[11px] text-ink-soft">
            {author.name}
          </span>
        </div>
      )}
    </div>
  );
}
