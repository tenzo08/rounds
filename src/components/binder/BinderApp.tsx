"use client";

import { useMemo, useState, useTransition } from "react";
import { Sidebar, type ActiveSelection } from "@/components/binder/Sidebar";
import { NoteGrid } from "@/components/binder/NoteGrid";
import { NoteCard } from "@/components/binder/NoteCard";
import { TileGrid } from "@/components/binder/TileGrid";
import { NoteViewModal } from "@/components/binder/NoteViewModal";
import { NoteFormModal } from "@/components/binder/NoteFormModal";
import { MdImportModal } from "@/components/binder/MdImportModal";
import { BulkMoveModal } from "@/components/binder/BulkMoveModal";
import { BulkShareModal } from "@/components/binder/BulkShareModal";
import { QuizModal, type QuizCard } from "@/components/binder/QuizModal";
import { GroupNoteViewModal } from "@/components/groups/GroupNoteViewModal";
import { IdleLogout } from "@/components/IdleLogout";
import { OnboardingModal } from "@/components/OnboardingModal";
import { signOutAction } from "@/lib/actions/auth";
import { topicColor } from "@/lib/topics";
import {
  createNote,
  deleteNote,
  updateNote,
  bulkDeleteNotes,
  deleteTopic,
  type NoteInput,
} from "@/lib/actions/notes";
import type {
  GroupSummaryDTO,
  NoteDTO,
  SharedWithMeNoteDTO,
  TopicSummaryDTO,
} from "@/lib/types";

type ModalState =
  | { type: "closed" }
  | { type: "view"; noteId: string }
  | { type: "form"; noteId: string | null }
  | { type: "view-shared"; noteId: string }
  | { type: "import" }
  | { type: "quiz" }
  | { type: "bulk-move" }
  | { type: "bulk-share" }
  | { type: "scope-share" };

type SearchScope = "mine" | "everywhere";

interface BinderAppProps {
  notes: NoteDTO[];
  topics: TopicSummaryDTO[];
  sharedWithMe: SharedWithMeNoteDTO[];
  groups: GroupSummaryDTO[];
  userName: string;
  userEmail: string;
  userImage: string | null;
  hasOnboarded: boolean;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

function matchesQuery(
  query: string,
  title: string,
  focus: string,
  description: string,
): boolean {
  if (!query) return true;
  const haystack = `${title} ${focus} ${description}`.toLowerCase();
  return haystack.includes(query);
}

function matchesSelection(
  note: { topic: string; folder: string },
  selection: ActiveSelection,
): boolean {
  if (selection.type === "all") return true;
  if (selection.type === "topic") return note.topic === selection.topic;
  return note.topic === selection.topic && note.folder === selection.folder;
}

export function BinderApp({
  notes,
  topics,
  sharedWithMe,
  groups,
  userName,
  userEmail,
  userImage,
  hasOnboarded,
}: BinderAppProps) {
  const [isOnboarded, setIsOnboarded] = useState(hasOnboarded);
  const [selection, setSelection] = useState<ActiveSelection>({ type: "all" });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchScope, setSearchScope] = useState<SearchScope>("mine");
  const [modalState, setModalState] = useState<ModalState>({ type: "closed" });
  const [actionError, setActionError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [scopeShareIds, setScopeShareIds] = useState<string[]>([]);

  const browsingTopic =
    selection.type === "topic" && searchQuery.trim().length === 0
      ? selection.topic
      : null;

  const filteredNotes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return notes.filter((note) => {
      if (!matchesSelection(note, selection)) return false;
      return matchesQuery(query, note.title, note.focus, note.description);
    });
  }, [notes, selection, searchQuery]);

  const everywhereResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const own = notes
      .filter((n) => matchesQuery(query, n.title, n.focus, n.description))
      .map((n) => ({ kind: "own" as const, note: n }));
    const shared = sharedWithMe
      .filter((n) => matchesQuery(query, n.title, n.focus, n.description))
      .map((n) => ({ kind: "shared" as const, note: n }));
    return [...own, ...shared].sort((a, b) =>
      b.note.updatedAt.localeCompare(a.note.updatedAt),
    );
  }, [notes, sharedWithMe, searchQuery]);

  const viewTitle =
    selection.type === "all"
      ? "All entries"
      : selection.type === "topic"
        ? selection.topic
        : `${selection.topic} / ${selection.folder}`;
  const viewSub =
    selection.type === "all"
      ? "Every flashcard across every topic."
      : selection.type === "topic"
        ? "Pick a folder to see its flashcards."
        : `Flashcards in ${selection.folder}.`;

  const viewingNote =
    modalState.type === "view"
      ? (notes.find((n) => n.id === modalState.noteId) ?? null)
      : null;
  const viewingSharedNote =
    modalState.type === "view-shared"
      ? (sharedWithMe.find((n) => n.id === modalState.noteId) ?? null)
      : null;
  const editingNote =
    modalState.type === "form" && modalState.noteId
      ? (notes.find((n) => n.id === modalState.noteId) ?? null)
      : null;

  const defaultTopic = selection.type !== "all" ? selection.topic : "";
  const defaultFolder = selection.type === "folder" ? selection.folder : "";

  // In "Everywhere" scope the quiz should draw from the same pool the
  // student is currently looking at — their own notes plus whatever's
  // shared with them — not just their own binder.
  const quizCards: QuizCard[] = useMemo(() => {
    const own = notes.map((n) => ({
      id: n.id,
      title: n.title,
      focus: n.focus,
      description: n.description,
      topic: n.topic,
      folder: n.folder,
    }));
    if (searchScope !== "everywhere") return own;
    const shared = sharedWithMe.map((n) => ({
      id: n.id,
      title: n.title,
      focus: n.focus,
      description: n.description,
      topic: n.topic,
      folder: n.folder,
    }));
    return [...own, ...shared];
  }, [notes, sharedWithMe, searchScope]);

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

  function toggleSelectMode() {
    setIsSelectMode((prev) => !prev);
    setSelectedIds(new Set());
  }

  function toggleSelectId(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleBulkDelete() {
    if (selectedIds.size === 0) return;
    if (
      !window.confirm(
        `Delete ${selectedIds.size} flashcard${selectedIds.size === 1 ? "" : "s"}? This cannot be undone.`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      try {
        await bulkDeleteNotes(Array.from(selectedIds));
        setSelectedIds(new Set());
        setIsSelectMode(false);
      } catch (error) {
        setActionError(getErrorMessage(error));
      }
    });
  }

  function handleDeleteTopic(topic: string) {
    const count = topics.find((t) => t.name === topic)?.count ?? 0;
    if (
      !window.confirm(
        `Delete the "${topic}" topic? This deletes all ${count} flashcard${count === 1 ? "" : "s"} in it, across every folder. This cannot be undone.`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      try {
        await deleteTopic(topic);
        setSelection({ type: "all" });
      } catch (error) {
        setActionError(getErrorMessage(error));
      }
    });
  }

  function handleOpenScopeShare() {
    const ids =
      selection.type === "all"
        ? notes.map((n) => n.id)
        : selection.type === "topic"
          ? notes.filter((n) => n.topic === selection.topic).map((n) => n.id)
          : notes
              .filter(
                (n) => n.topic === selection.topic && n.folder === selection.folder,
              )
              .map((n) => n.id);
    if (ids.length === 0) return;
    setScopeShareIds(ids);
    setModalState({ type: "scope-share" });
  }

  const scopeShareLabel =
    selection.type === "all"
      ? "Share all to group"
      : selection.type === "topic"
        ? "Share topic to group"
        : "Share folder to group";

  function handleDropNoteOnFolder(noteId: string, topic: string, folder: string) {
    const source = notes.find((n) => n.id === noteId);
    if (!source) return;
    if (source.topic === topic && source.folder === folder) return;
    startTransition(async () => {
      try {
        await updateNote(noteId, {
          title: source.title,
          topic,
          folder,
          focus: source.focus,
          description: source.description,
        });
      } catch (error) {
        setActionError(getErrorMessage(error));
      }
    });
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden md:flex-row">
      <IdleLogout />
      {!isOnboarded && (
        <OnboardingModal
          currentName={userName}
          currentAvatarUrl={userImage}
          onDone={() => setIsOnboarded(true)}
        />
      )}
      <Sidebar
        selection={selection}
        onSelect={(next) => {
          setSelection(next);
          setIsSelectMode(false);
          setSelectedIds(new Set());
        }}
        topics={topics}
        allCount={notes.length}
        userName={userName}
        userEmail={userEmail}
        userImage={userImage}
        onSignOut={() => {
          void signOutAction();
        }}
        onDropNote={handleDropNoteOnFolder}
      />

      <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0 px-4 pt-6 md:px-10 md:pt-8.5">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-5">
          <div className="min-w-0">
            {searchScope === "mine" && selection.type !== "all" && (
              <div className="mb-1 flex items-center gap-1.5 font-mono text-[11px] text-ink-soft">
                <button
                  type="button"
                  onClick={() => setSelection({ type: "all" })}
                  className="hover:text-ink hover:underline"
                >
                  ← All entries
                </button>
                {selection.type === "folder" && (
                  <>
                    <span>/</span>
                    <button
                      type="button"
                      onClick={() => setSelection({ type: "topic", topic: selection.topic })}
                      className="hover:text-ink hover:underline"
                    >
                      {selection.topic}
                    </button>
                  </>
                )}
              </div>
            )}
            <div className="flex items-center gap-2.5">
              <h2 className="m-0 mb-1 truncate font-serif text-[22px] text-ink">
                {searchScope === "everywhere" ? "Search everywhere" : viewTitle}
              </h2>
              {searchScope === "mine" && (
                <button
                  type="button"
                  onClick={handleOpenScopeShare}
                  className="mb-1 shrink-0 font-mono text-[10.5px] text-ink-soft uppercase hover:text-ink hover:underline"
                >
                  {scopeShareLabel}
                </button>
              )}
              {searchScope === "mine" &&
                (selection.type === "topic" || selection.type === "folder") && (
                  <button
                    type="button"
                    onClick={() => handleDeleteTopic(selection.topic)}
                    className="mb-1 shrink-0 font-mono text-[10.5px] text-c-crit uppercase hover:underline"
                  >
                    Delete topic
                  </button>
                )}
            </div>
            <p className="m-0 truncate text-[13.5px] text-ink-soft">
              {searchScope === "everywhere"
                ? "Your flashcards and flashcards shared with you through groups."
                : viewSub}
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
                placeholder="search flashcards..."
                className="w-full min-h-[42px] rounded border border-line bg-card py-2.5 pr-3.5 pl-8 font-mono text-[13px] text-ink outline-none focus:border-ink sm:w-[200px]"
              />
            </div>
            {searchScope === "mine" && (
              <button
                type="button"
                onClick={toggleSelectMode}
                className={
                  "min-h-[42px] rounded border border-line px-3.5 py-2.5 text-[13.5px] font-semibold transition-opacity hover:opacity-88 " +
                  (isSelectMode ? "bg-ink text-paper" : "text-ink")
                }
              >
                {isSelectMode ? "Cancel" : "Select"}
              </button>
            )}
            <button
              type="button"
              onClick={() => setModalState({ type: "quiz" })}
              className="min-h-[42px] rounded border border-line px-3.5 py-2.5 text-[13.5px] font-semibold text-ink transition-opacity hover:opacity-88"
            >
              Quiz
            </button>
            <button
              type="button"
              onClick={() => setModalState({ type: "import" })}
              className="min-h-[42px] rounded border border-line px-3.5 py-2.5 text-[13.5px] font-semibold text-ink transition-opacity hover:opacity-88"
            >
              Upload .md
            </button>
            <button
              type="button"
              onClick={() => setModalState({ type: "form", noteId: null })}
              className="min-h-[42px] rounded bg-ink px-4 py-2.5 text-[13.5px] font-semibold text-paper transition-opacity hover:opacity-88"
            >
              + New entry
            </button>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setSearchScope("mine")}
              className={
                "min-h-[32px] rounded px-3 py-1 font-mono text-[11px] tracking-[0.04em] uppercase transition-colors " +
                (searchScope === "mine"
                  ? "bg-ink text-paper"
                  : "border border-line text-ink-soft hover:bg-paper-grid")
              }
            >
              My notes
            </button>
            <button
              type="button"
              onClick={() => setSearchScope("everywhere")}
              className={
                "min-h-[32px] rounded px-3 py-1 font-mono text-[11px] tracking-[0.04em] uppercase transition-colors " +
                (searchScope === "everywhere"
                  ? "bg-ink text-paper"
                  : "border border-line text-ink-soft hover:bg-paper-grid")
              }
            >
              Everywhere
            </button>
          </div>

          {isSelectMode && selectedIds.size > 0 && (
            <div className="flex flex-wrap items-center gap-2 rounded border border-line bg-paper-grid px-3 py-1.5">
              <span className="font-mono text-[11px] text-ink-soft">
                {selectedIds.size} selected
              </span>
              <button
                type="button"
                onClick={() => setModalState({ type: "bulk-move" })}
                className="rounded border border-line bg-card px-2.5 py-1 text-xs font-semibold text-ink hover:bg-paper"
              >
                Move
              </button>
              <button
                type="button"
                onClick={() => setModalState({ type: "bulk-share" })}
                className="rounded border border-line bg-card px-2.5 py-1 text-xs font-semibold text-ink hover:bg-paper"
              >
                Share to group
              </button>
              <button
                type="button"
                onClick={handleBulkDelete}
                disabled={isPending}
                className="rounded border border-line bg-card px-2.5 py-1 text-xs font-semibold text-c-crit hover:bg-paper disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-14 md:px-10">
        {actionError && (
          <p className="mb-4 text-sm text-c-crit">{actionError}</p>
        )}

        {searchScope === "mine" ? (
          browsingTopic !== null ? (
            <TileGrid
              countLabel="cards"
              items={
                topics
                  .find((t) => t.name === browsingTopic)
                  ?.folders.map((f) => ({
                    key: f.name,
                    label: f.name,
                    count: f.count,
                    color: topicColor(browsingTopic),
                  })) ?? []
              }
              onSelect={(folder) =>
                setSelection({ type: "folder", topic: browsingTopic, folder })
              }
            />
          ) : (
            <NoteGrid
              notes={filteredNotes}
              hasAnyNotes={notes.length > 0}
              onSelectNote={(id) => setModalState({ type: "view", noteId: id })}
              isSelectMode={isSelectMode}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelectId}
            />
          )
        ) : everywhereResults.length === 0 ? (
          <div className="py-[70px] text-center text-ink-soft">
            <h3 className="m-0 mb-2 font-serif text-[19px] text-ink">
              Nothing found
            </h3>
            <p className="m-0 text-[13.5px]">
              Try a different search term, or check that a note has actually
              been shared with you.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-[18px]">
            {everywhereResults.map((item) =>
              item.kind === "own" ? (
                <NoteCard
                  key={item.note.id}
                  id={item.note.id}
                  note={item.note}
                  groupChips={item.note.sharedGroups}
                  onClick={() =>
                    setModalState({ type: "view", noteId: item.note.id })
                  }
                />
              ) : (
                <NoteCard
                  key={item.note.id}
                  id={item.note.id}
                  note={item.note}
                  author={{
                    name: item.note.authorName,
                    image: item.note.authorImage,
                  }}
                  onClick={() =>
                    setModalState({
                      type: "view-shared",
                      noteId: item.note.id,
                    })
                  }
                />
              ),
            )}
          </div>
        )}
      </div>
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

      {viewingSharedNote && (
        <GroupNoteViewModal note={viewingSharedNote} onClose={closeModal} />
      )}

      {modalState.type === "form" && (
        <NoteFormModal
          note={editingNote}
          defaultTopic={defaultTopic}
          defaultFolder={defaultFolder}
          topics={topics}
          onClose={closeModal}
          onSubmit={handleSubmitForm}
          isSaving={isPending}
        />
      )}

      {modalState.type === "import" && (
        <MdImportModal
          topics={topics}
          defaultTopic={defaultTopic}
          defaultFolder={defaultFolder}
          onClose={closeModal}
          onImported={closeModal}
        />
      )}

      {modalState.type === "quiz" && (
        <QuizModal
          title={searchScope === "everywhere" ? "Everywhere" : "My Binder"}
          cards={quizCards}
          onClose={closeModal}
        />
      )}

      {modalState.type === "bulk-move" && (
        <BulkMoveModal
          noteIds={Array.from(selectedIds)}
          topics={topics}
          onClose={closeModal}
          onMoved={() => {
            setSelectedIds(new Set());
            setIsSelectMode(false);
            closeModal();
          }}
        />
      )}

      {modalState.type === "bulk-share" && (
        <BulkShareModal
          noteIds={Array.from(selectedIds)}
          groups={groups}
          onClose={closeModal}
          onShared={() => {
            setSelectedIds(new Set());
            setIsSelectMode(false);
            closeModal();
          }}
        />
      )}

      {modalState.type === "scope-share" && (
        <BulkShareModal
          noteIds={scopeShareIds}
          groups={groups}
          onClose={closeModal}
          onShared={closeModal}
        />
      )}
    </div>
  );
}
