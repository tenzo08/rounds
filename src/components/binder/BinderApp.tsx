"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Sidebar, type ActiveSelection } from "@/components/binder/Sidebar";
import { NoteGrid } from "@/components/binder/NoteGrid";
import { NoteCard } from "@/components/binder/NoteCard";
import { TileGrid } from "@/components/binder/TileGrid";
import { NoteViewModal } from "@/components/binder/NoteViewModal";
import { NoteFormModal } from "@/components/binder/NoteFormModal";
import { MdImportModal } from "@/components/binder/MdImportModal";
import { DuplicateCheckerModal } from "@/components/binder/DuplicateCheckerModal";
import { BulkMoveModal } from "@/components/binder/BulkMoveModal";
import { BulkShareModal } from "@/components/binder/BulkShareModal";
import { CreateNameModal } from "@/components/binder/CreateNameModal";
import { QuizModal, type QuizCard } from "@/components/binder/QuizModal";
import { GroupNoteViewModal } from "@/components/groups/GroupNoteViewModal";
import { IdleLogout } from "@/components/IdleLogout";
import { OnboardingModal } from "@/components/OnboardingModal";
import { signOutAction } from "@/lib/actions/auth";
import { subjectColor } from "@/lib/topics";
import {
  createNote,
  deleteNote,
  updateNote,
  bulkDeleteNotes,
  createSubject,
  createTopic,
  createFolder,
  deleteSubject,
  deleteTopic,
  deleteFolder,
  renameSubject,
  renameTopic,
  renameFolder,
  type NoteInput,
} from "@/lib/actions/notes";
import type {
  GroupSummaryDTO,
  NoteDTO,
  SharedWithMeNoteDTO,
  SubjectSummaryDTO,
} from "@/lib/types";

type ModalState =
  | { type: "closed" }
  | { type: "view"; noteId: string }
  | { type: "form"; noteId: string | null }
  | { type: "view-shared"; noteId: string }
  | { type: "import" }
  | { type: "duplicates" }
  | { type: "quiz" }
  | { type: "bulk-move" }
  | { type: "bulk-share" }
  | { type: "scope-share" }
  | { type: "create-subject" }
  | { type: "create-topic"; subject: string }
  | { type: "create-folder"; subject: string; topic: string };

type SearchScope = "mine" | "everywhere";

interface BinderAppProps {
  notes: NoteDTO[];
  subjects: SubjectSummaryDTO[];
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

function matchesQuery(query: string, focus: string, description: string): boolean {
  if (!query) return true;
  const haystack = `${focus} ${description}`.toLowerCase();
  return haystack.includes(query);
}

function matchesSelection(
  note: { subject: string; topic: string; folder: string },
  selection: ActiveSelection,
): boolean {
  if (selection.type === "all") return true;
  if (selection.type === "subject") return note.subject === selection.subject;
  if (selection.type === "topic") {
    return note.subject === selection.subject && note.topic === selection.topic;
  }
  return (
    note.subject === selection.subject &&
    note.topic === selection.topic &&
    note.folder === selection.folder
  );
}

export function BinderApp({
  notes,
  subjects,
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
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMoreOpen) return;
    function handlePointerDown(e: PointerEvent) {
      if (!moreMenuRef.current?.contains(e.target as Node)) {
        setIsMoreOpen(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isMoreOpen]);

  const noSearchQuery = searchQuery.trim().length === 0;
  const browsingSubject =
    selection.type === "subject" && noSearchQuery ? selection.subject : null;
  const browsingTopic =
    selection.type === "topic" && noSearchQuery
      ? { subject: selection.subject, topic: selection.topic }
      : null;

  const filteredNotes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return notes.filter((note) => {
      if (!matchesSelection(note, selection)) return false;
      return matchesQuery(query, note.focus, note.description);
    });
  }, [notes, selection, searchQuery]);

  const everywhereResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const own = notes
      .filter((n) => matchesQuery(query, n.focus, n.description))
      .map((n) => ({ kind: "own" as const, note: n }));
    const shared = sharedWithMe
      .filter((n) => matchesQuery(query, n.focus, n.description))
      .map((n) => ({ kind: "shared" as const, note: n }));
    return [...own, ...shared].sort((a, b) =>
      b.note.updatedAt.localeCompare(a.note.updatedAt),
    );
  }, [notes, sharedWithMe, searchQuery]);

  const viewTitle =
    selection.type === "all"
      ? "All entries"
      : selection.type === "subject"
        ? selection.subject
        : selection.type === "topic"
          ? `${selection.subject} / ${selection.topic}`
          : `${selection.subject} / ${selection.topic} / ${selection.folder}`;
  const viewSub =
    selection.type === "all"
      ? "Every flashcard across every subject."
      : selection.type === "subject"
        ? "Pick a topic to see its folders."
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

  const defaultSubject = selection.type !== "all" ? selection.subject : "";
  const defaultTopic =
    selection.type === "topic" || selection.type === "folder"
      ? selection.topic
      : "";
  const defaultFolder = selection.type === "folder" ? selection.folder : "";

  // In "Everywhere" scope the quiz should draw from the same pool the
  // student is currently looking at — their own notes plus whatever's
  // shared with them — not just their own binder.
  const quizCards: QuizCard[] = useMemo(() => {
    const own = notes.map((n) => ({
      id: n.id,
      focus: n.focus,
      description: n.description,
      subject: n.subject,
      topic: n.topic,
      folder: n.folder,
    }));
    if (searchScope !== "everywhere") return own;
    const shared = sharedWithMe.map((n) => ({
      id: n.id,
      focus: n.focus,
      description: n.description,
      subject: n.subject,
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

  // The three-dot menu's rename/delete actions target whichever level is
  // currently being browsed (Subject/Topic/Folder) — same window.prompt/
  // window.confirm pattern either way, just resolving a longer ancestor
  // path the deeper the current selection is.
  function handleRename() {
    if (selection.type === "subject") {
      const nextName = window
        .prompt(`Rename "${selection.subject}" to:`, selection.subject)
        ?.trim();
      if (!nextName || nextName === selection.subject) return;
      startTransition(async () => {
        try {
          await renameSubject(selection.subject, nextName);
          setSelection({ type: "subject", subject: nextName });
        } catch (error) {
          setActionError(getErrorMessage(error));
        }
      });
    } else if (selection.type === "topic") {
      const nextName = window
        .prompt(`Rename "${selection.topic}" to:`, selection.topic)
        ?.trim();
      if (!nextName || nextName === selection.topic) return;
      startTransition(async () => {
        try {
          await renameTopic(selection.subject, selection.topic, nextName);
          setSelection({
            type: "topic",
            subject: selection.subject,
            topic: nextName,
          });
        } catch (error) {
          setActionError(getErrorMessage(error));
        }
      });
    } else if (selection.type === "folder") {
      const nextName = window
        .prompt(`Rename "${selection.folder}" to:`, selection.folder)
        ?.trim();
      if (!nextName || nextName === selection.folder) return;
      startTransition(async () => {
        try {
          await renameFolder(
            selection.subject,
            selection.topic,
            selection.folder,
            nextName,
          );
          setSelection({
            type: "folder",
            subject: selection.subject,
            topic: selection.topic,
            folder: nextName,
          });
        } catch (error) {
          setActionError(getErrorMessage(error));
        }
      });
    }
  }

  function handleDeleteSelection() {
    if (selection.type === "subject") {
      const count = subjects.find((s) => s.name === selection.subject)?.count ?? 0;
      if (
        !window.confirm(
          `Delete the "${selection.subject}" subject? This deletes all ${count} flashcard${count === 1 ? "" : "s"} in it, across every topic and folder. This cannot be undone.`,
        )
      ) {
        return;
      }
      startTransition(async () => {
        try {
          await deleteSubject(selection.subject);
          setSelection({ type: "all" });
        } catch (error) {
          setActionError(getErrorMessage(error));
        }
      });
    } else if (selection.type === "topic") {
      const count =
        subjects
          .find((s) => s.name === selection.subject)
          ?.topics.find((t) => t.name === selection.topic)?.count ?? 0;
      if (
        !window.confirm(
          `Delete the "${selection.topic}" topic? This deletes all ${count} flashcard${count === 1 ? "" : "s"} in it, across every folder. This cannot be undone.`,
        )
      ) {
        return;
      }
      const subject = selection.subject;
      startTransition(async () => {
        try {
          await deleteTopic(selection.subject, selection.topic);
          setSelection({ type: "subject", subject });
        } catch (error) {
          setActionError(getErrorMessage(error));
        }
      });
    } else if (selection.type === "folder") {
      const count =
        subjects
          .find((s) => s.name === selection.subject)
          ?.topics.find((t) => t.name === selection.topic)
          ?.folders.find((f) => f.name === selection.folder)?.count ?? 0;
      if (
        !window.confirm(
          `Delete the "${selection.folder}" folder? This deletes all ${count} flashcard${count === 1 ? "" : "s"} in it. This cannot be undone.`,
        )
      ) {
        return;
      }
      const subject = selection.subject;
      const topic = selection.topic;
      startTransition(async () => {
        try {
          await deleteFolder(selection.subject, selection.topic, selection.folder);
          setSelection({ type: "topic", subject, topic });
        } catch (error) {
          setActionError(getErrorMessage(error));
        }
      });
    }
  }

  const renameDeleteLabel =
    selection.type === "subject"
      ? "subject"
      : selection.type === "topic"
        ? "topic"
        : "folder";

  function handleOpenScopeShare() {
    const ids =
      selection.type === "all"
        ? notes.map((n) => n.id)
        : selection.type === "subject"
          ? notes.filter((n) => n.subject === selection.subject).map((n) => n.id)
          : selection.type === "topic"
            ? notes
                .filter(
                  (n) => n.subject === selection.subject && n.topic === selection.topic,
                )
                .map((n) => n.id)
            : notes
                .filter(
                  (n) =>
                    n.subject === selection.subject &&
                    n.topic === selection.topic &&
                    n.folder === selection.folder,
                )
                .map((n) => n.id);
    if (ids.length === 0) return;
    setScopeShareIds(ids);
    setModalState({ type: "scope-share" });
  }

  const scopeShareLabel =
    selection.type === "all"
      ? "Share all to group"
      : `Share ${renameDeleteLabel} to group`;

  function handleDropNoteOnFolder(
    noteId: string,
    subject: string,
    topic: string,
    folder: string,
  ) {
    const source = notes.find((n) => n.id === noteId);
    if (!source) return;
    if (
      source.subject === subject &&
      source.topic === topic &&
      source.folder === folder
    ) {
      return;
    }
    startTransition(async () => {
      try {
        await updateNote(noteId, {
          subject,
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

  // Subjects/Topics/Folders are otherwise only ever created implicitly by
  // typing a new name on a flashcard — these let a student set up the
  // structure ahead of time. Each navigates into the freshly created
  // container afterward, so "+ New entry" right after correctly defaults
  // to it (defaultSubject/defaultTopic/defaultFolder below are derived
  // straight from `selection`).
  function handleCreateSubject() {
    setModalState({ type: "create-subject" });
  }

  function handleCreateTopic(subject: string) {
    setModalState({ type: "create-topic", subject });
  }

  function handleCreateFolder(subject: string, topic: string) {
    setModalState({ type: "create-folder", subject, topic });
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
        subjects={subjects}
        allCount={notes.length}
        userName={userName}
        userEmail={userEmail}
        userImage={userImage}
        onSignOut={() => {
          void signOutAction();
        }}
        onDropNote={handleDropNoteOnFolder}
        onAddSubject={handleCreateSubject}
      />

      <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0 px-4 pt-4 md:px-10 md:pt-8.5">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-5 md:mb-4">
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
                {(selection.type === "topic" || selection.type === "folder") && (
                  <>
                    <span>/</span>
                    <button
                      type="button"
                      onClick={() =>
                        setSelection({ type: "subject", subject: selection.subject })
                      }
                      className="hover:text-ink hover:underline"
                    >
                      {selection.subject}
                    </button>
                  </>
                )}
                {selection.type === "folder" && (
                  <>
                    <span>/</span>
                    <button
                      type="button"
                      onClick={() =>
                        setSelection({
                          type: "topic",
                          subject: selection.subject,
                          topic: selection.topic,
                        })
                      }
                      className="hover:text-ink hover:underline"
                    >
                      {selection.topic}
                    </button>
                  </>
                )}
              </div>
            )}
            <h2 className="m-0 mb-1 truncate font-serif text-[22px] text-ink">
              {searchScope === "everywhere" ? "Search everywhere" : viewTitle}
            </h2>
            <p className="m-0 mb-2 truncate text-[13.5px] text-ink-soft">
              {searchScope === "everywhere"
                ? "Your flashcards and flashcards shared with you through groups."
                : viewSub}
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:gap-2.5">
            <div className="relative w-full sm:w-[200px]">
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
                data-tour="search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="search flashcards..."
                className="w-full min-h-[36px] rounded border border-line bg-card py-1.5 pr-3.5 pl-8 font-mono text-[13px] text-ink outline-none focus:border-ink sm:min-h-[44px] sm:py-2.5"
              />
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2.5">
              <button
                type="button"
                data-tour="quiz-button"
                onClick={() => setModalState({ type: "quiz" })}
                className="min-h-[34px] flex-1 rounded border border-line px-2.5 py-1.5 text-[12px] font-semibold text-ink transition-opacity hover:opacity-88 sm:min-h-[44px] sm:flex-none sm:px-3.5 sm:py-2.5 sm:text-[13.5px]"
              >
                Quiz
              </button>
              <button
                type="button"
                data-tour="new-entry-button"
                onClick={() => setModalState({ type: "form", noteId: null })}
                className="min-h-[34px] flex-1 rounded bg-ink px-2.5 py-1.5 text-[12px] font-semibold text-paper transition-opacity hover:opacity-88 sm:min-h-[44px] sm:flex-none sm:px-4 sm:py-2.5 sm:text-[13.5px]"
              >
                + New entry
              </button>
              <div className="relative shrink-0" ref={moreMenuRef}>
                <button
                  type="button"
                  data-tour="more-menu-button"
                  onClick={() => setIsMoreOpen((v) => !v)}
                  aria-label="More actions"
                  aria-expanded={isMoreOpen}
                  className={
                    "flex min-h-[34px] min-w-[34px] items-center justify-center rounded border border-line text-[15px] font-semibold text-ink transition-opacity hover:opacity-88 sm:min-h-[44px] sm:min-w-[44px] " +
                    (isMoreOpen ? "bg-ink text-paper" : "")
                  }
                >
                  &#8942;
                </button>
                {isMoreOpen && (
                  <div className="absolute top-full right-0 z-20 mt-1.5 w-56 rounded border border-line bg-card py-1 shadow-lg">
                    {searchScope === "mine" && (
                      <button
                        type="button"
                        onClick={() => {
                          toggleSelectMode();
                          setIsMoreOpen(false);
                        }}
                        className="block w-full px-3.5 py-2.5 text-left text-[13px] text-ink hover:bg-paper-grid"
                      >
                        {isSelectMode ? "Cancel select" : "Select"}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setModalState({ type: "import" });
                        setIsMoreOpen(false);
                      }}
                      className="block w-full px-3.5 py-2.5 text-left text-[13px] text-ink hover:bg-paper-grid"
                    >
                      Upload .md
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setModalState({ type: "duplicates" });
                        setIsMoreOpen(false);
                      }}
                      className="block w-full px-3.5 py-2.5 text-left text-[13px] text-ink hover:bg-paper-grid"
                    >
                      Check duplicates
                    </button>
                    {searchScope === "mine" && (
                      <button
                        type="button"
                        onClick={() => {
                          handleOpenScopeShare();
                          setIsMoreOpen(false);
                        }}
                        className="block w-full px-3.5 py-2.5 text-left text-[13px] text-ink hover:bg-paper-grid"
                      >
                        {scopeShareLabel}
                      </button>
                    )}
                    {searchScope === "mine" && selection.type !== "all" && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            handleRename();
                            setIsMoreOpen(false);
                          }}
                          className="block w-full px-3.5 py-2.5 text-left text-[13px] text-ink hover:bg-paper-grid"
                        >
                          Rename {renameDeleteLabel}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleDeleteSelection();
                            setIsMoreOpen(false);
                          }}
                          className="block w-full px-3.5 py-2.5 text-left text-[13px] text-c-crit hover:bg-c-crit/5"
                        >
                          Delete {renameDeleteLabel}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-2 md:mb-4">
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setSearchScope("mine")}
              className={
                "min-h-[28px] rounded px-2.5 py-1 font-mono text-[10.5px] tracking-[0.04em] uppercase transition-colors sm:min-h-[32px] sm:px-3 sm:text-[11px] " +
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
                "min-h-[28px] rounded px-2.5 py-1 font-mono text-[10.5px] tracking-[0.04em] uppercase transition-colors sm:min-h-[32px] sm:px-3 sm:text-[11px] " +
                (searchScope === "everywhere"
                  ? "bg-ink text-paper"
                  : "border border-line text-ink-soft hover:bg-paper-grid")
              }
            >
              Everywhere
            </button>
          </div>

          {isSelectMode && selectedIds.size > 0 && (
            <div className="flex w-full flex-wrap items-center gap-1.5 rounded border border-line bg-paper-grid px-2.5 py-1.5 sm:w-auto sm:gap-2 sm:px-3 sm:py-2">
              <span className="font-mono text-[11px] text-ink-soft">
                {selectedIds.size} selected
              </span>
              <button
                type="button"
                onClick={() => setModalState({ type: "bulk-move" })}
                className="min-h-[30px] rounded border border-line bg-card px-2.5 text-xs font-semibold text-ink hover:bg-paper sm:min-h-[36px] sm:px-3"
              >
                Move
              </button>
              <button
                type="button"
                onClick={() => setModalState({ type: "bulk-share" })}
                className="min-h-[30px] rounded border border-line bg-card px-2.5 text-xs font-semibold text-ink hover:bg-paper sm:min-h-[36px] sm:px-3"
              >
                Share to group
              </button>
              <button
                type="button"
                onClick={handleBulkDelete}
                disabled={isPending}
                className="min-h-[30px] rounded border border-line bg-card px-2.5 text-xs font-semibold text-c-crit hover:bg-paper disabled:opacity-50 sm:min-h-[36px] sm:px-3"
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
          browsingSubject !== null ? (
            <TileGrid
              countLabel="cards"
              items={
                subjects
                  .find((s) => s.name === browsingSubject)
                  ?.topics.map((t) => ({
                    key: t.name,
                    label: t.name,
                    count: t.count,
                    color: subjectColor(browsingSubject),
                  })) ?? []
              }
              onSelect={(topic) =>
                setSelection({ type: "topic", subject: browsingSubject, topic })
              }
              addNewLabel="+ New topic"
              onAddNew={() => handleCreateTopic(browsingSubject)}
            />
          ) : browsingTopic !== null ? (
            <TileGrid
              countLabel="cards"
              items={
                subjects
                  .find((s) => s.name === browsingTopic.subject)
                  ?.topics.find((t) => t.name === browsingTopic.topic)
                  ?.folders.map((f) => ({
                    key: f.name,
                    label: f.name,
                    count: f.count,
                    color: subjectColor(browsingTopic.subject),
                  })) ?? []
              }
              onSelect={(folder) =>
                setSelection({
                  type: "folder",
                  subject: browsingTopic.subject,
                  topic: browsingTopic.topic,
                  folder,
                })
              }
              addNewLabel="+ New folder"
              onAddNew={() =>
                handleCreateFolder(browsingTopic.subject, browsingTopic.topic)
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
          defaultSubject={defaultSubject}
          defaultTopic={defaultTopic}
          defaultFolder={defaultFolder}
          subjects={subjects}
          onClose={closeModal}
          onSubmit={handleSubmitForm}
          isSaving={isPending}
        />
      )}

      {modalState.type === "import" && (
        <MdImportModal
          subjects={subjects}
          defaultSubject={defaultSubject}
          defaultTopic={defaultTopic}
          defaultFolder={defaultFolder}
          onClose={closeModal}
          onImported={closeModal}
        />
      )}

      {modalState.type === "duplicates" && (
        <DuplicateCheckerModal onClose={closeModal} />
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
          subjects={subjects}
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

      {modalState.type === "create-subject" && (
        <CreateNameModal
          title="New subject"
          label="Subject name"
          placeholder="e.g. Pharmacology"
          onClose={closeModal}
          onCreate={async (name) => {
            await createSubject(name);
            setSelection({ type: "subject", subject: name });
          }}
        />
      )}

      {modalState.type === "create-topic" && (
        <CreateNameModal
          title={`New topic in "${modalState.subject}"`}
          label="Topic name"
          placeholder="e.g. Antibiotics"
          onClose={closeModal}
          onCreate={async (name) => {
            await createTopic(modalState.subject, name);
            setSelection({ type: "topic", subject: modalState.subject, topic: name });
          }}
        />
      )}

      {modalState.type === "create-folder" && (
        <CreateNameModal
          title={`New folder in "${modalState.topic}"`}
          label="Folder name"
          placeholder="e.g. Prelims"
          onClose={closeModal}
          onCreate={async (name) => {
            await createFolder(modalState.subject, modalState.topic, name);
            setSelection({
              type: "folder",
              subject: modalState.subject,
              topic: modalState.topic,
              folder: name,
            });
          }}
        />
      )}
    </div>
  );
}
