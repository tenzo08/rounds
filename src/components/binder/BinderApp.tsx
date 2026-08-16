"use client";

import { useMemo, useState, useTransition } from "react";
import { Sidebar, type ActiveTopic } from "@/components/binder/Sidebar";
import { NoteGrid } from "@/components/binder/NoteGrid";
import { NoteViewModal } from "@/components/binder/NoteViewModal";
import { NoteFormModal } from "@/components/binder/NoteFormModal";
import { signOutAction } from "@/lib/actions/auth";
import {
  createNote,
  deleteNote,
  updateNote,
  type NoteInput,
} from "@/lib/actions/notes";
import type { NoteDTO, TopicSummaryDTO } from "@/lib/types";

type ModalState =
  | { type: "closed" }
  | { type: "view"; noteId: string }
  | { type: "form"; noteId: string | null };

interface BinderAppProps {
  notes: NoteDTO[];
  topics: TopicSummaryDTO[];
  userName: string;
  userEmail: string;
  userImage: string | null;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

export function BinderApp({
  notes,
  topics,
  userName,
  userEmail,
  userImage,
}: BinderAppProps) {
  const [activeTopic, setActiveTopic] = useState<ActiveTopic>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [modalState, setModalState] = useState<ModalState>({ type: "closed" });
  const [actionError, setActionError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredNotes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return notes.filter((note) => {
      if (activeTopic !== "all" && note.topic !== activeTopic) {
        return false;
      }
      if (!query) return true;
      const haystack =
        `${note.title} ${note.body} ${note.tags.join(" ")}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [notes, activeTopic, searchQuery]);

  const viewTitle = activeTopic === "all" ? "All entries" : activeTopic;
  const viewSub =
    activeTopic === "all"
      ? "Every note across every topic."
      : `Notes filed under ${activeTopic}.`;

  const viewingNote =
    modalState.type === "view"
      ? (notes.find((n) => n.id === modalState.noteId) ?? null)
      : null;
  const editingNote =
    modalState.type === "form" && modalState.noteId
      ? (notes.find((n) => n.id === modalState.noteId) ?? null)
      : null;

  function closeModal() {
    setModalState({ type: "closed" });
    setActionError(null);
  }

  function handleSubmitForm(input: NoteInput) {
    const noteId = modalState.type === "form" ? modalState.noteId : null;
    startTransition(async () => {
      try {
        if (noteId) {
          await updateNote(noteId, input);
        } else {
          await createNote(input);
        }
        closeModal();
      } catch (error) {
        setActionError(getErrorMessage(error));
      }
    });
  }

  function handleDelete(noteId: string) {
    startTransition(async () => {
      try {
        await deleteNote(noteId);
        closeModal();
      } catch (error) {
        setActionError(getErrorMessage(error));
      }
    });
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar
        activeTopic={activeTopic}
        onSelect={setActiveTopic}
        topics={topics}
        allCount={notes.length}
        userName={userName}
        userEmail={userEmail}
        userImage={userImage}
        onSignOut={() => {
          void signOutAction();
        }}
      />

      <main className="flex-1 px-4 pt-6 pb-14 md:px-10 md:pt-8.5">
        <div className="mb-6.5 flex flex-wrap items-end justify-between gap-5">
          <div className="min-w-0">
            <h2 className="m-0 mb-1 truncate font-serif text-[22px] text-ink">
              {viewTitle}
            </h2>
            <p className="m-0 truncate text-[13.5px] text-ink-soft">
              {viewSub}
            </p>
          </div>
          <div className="flex w-full flex-wrap items-center gap-2.5 sm:w-auto">
            <div className="relative min-w-0 flex-1 sm:flex-none">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 opacity-50"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="search notes, tags..."
                className="w-full min-h-[42px] rounded border border-line bg-card py-2.5 pr-3.5 pl-8 font-mono text-[13px] text-ink outline-none focus:border-ink sm:w-[220px]"
              />
            </div>
            <button
              type="button"
              onClick={() => setModalState({ type: "form", noteId: null })}
              className="min-h-[42px] rounded bg-ink px-4 py-2.5 text-[13.5px] font-semibold text-paper transition-opacity hover:opacity-88"
            >
              + New entry
            </button>
          </div>
        </div>

        {actionError && (
          <p className="mb-4 text-sm text-c-crit">{actionError}</p>
        )}

        <NoteGrid
          notes={filteredNotes}
          hasAnyNotes={notes.length > 0}
          onSelectNote={(id) => setModalState({ type: "view", noteId: id })}
        />
      </main>

      {viewingNote && (
        <NoteViewModal
          note={viewingNote}
          onClose={closeModal}
          onEdit={() =>
            setModalState({ type: "form", noteId: viewingNote.id })
          }
          onDelete={() => handleDelete(viewingNote.id)}
          isDeleting={isPending}
        />
      )}

      {modalState.type === "form" && (
        <NoteFormModal
          note={editingNote}
          defaultTopic={activeTopic === "all" ? "" : activeTopic}
          existingTopics={topics.map((t) => t.name)}
          onClose={closeModal}
          onSubmit={handleSubmitForm}
          isSaving={isPending}
        />
      )}
    </div>
  );
}
