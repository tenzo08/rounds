import { NoteCard } from "@/components/binder/NoteCard";
import type { NoteDTO } from "@/lib/types";

interface NoteGridProps {
  notes: NoteDTO[];
  hasAnyNotes: boolean;
  onSelectNote: (id: string) => void;
  isSelectMode?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  onDragStartNote?: (id: string) => void;
}

export function NoteGrid({
  notes,
  hasAnyNotes,
  onSelectNote,
  isSelectMode,
  selectedIds,
  onToggleSelect,
  onDragStartNote,
}: NoteGridProps) {
  if (notes.length === 0) {
    const copy = hasAnyNotes
      ? {
          heading: "Nothing filed here yet",
          body: "Try another rotation, clear the search, or add a new entry.",
        }
      : {
          heading: "Your binder is empty",
          body: "Start your first chart — add a note from any rotation.",
        };

    return (
      <div className="py-[70px] text-center text-ink-soft">
        <h3 className="m-0 mb-2 font-serif text-[19px] text-ink">
          {copy.heading}
        </h3>
        <p className="m-0 text-[13.5px]">{copy.body}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-[18px]">
      {notes.map((note) => (
        <NoteCard
          key={note.id}
          id={note.id}
          note={note}
          groupChips={note.sharedGroups}
          onClick={() => onSelectNote(note.id)}
          isSelectMode={isSelectMode}
          isSelected={selectedIds?.has(note.id)}
          onToggleSelect={() => onToggleSelect?.(note.id)}
          isDraggable
          onDragStart={onDragStartNote}
        />
      ))}
    </div>
  );
}
