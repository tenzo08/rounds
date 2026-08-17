"use client";

import { useEffect, useState } from "react";
import { ModalShell } from "@/components/binder/ModalShell";
import { findDuplicateFocusGroups, type DuplicateGroup } from "@/lib/actions/duplicates";
import { deleteNote } from "@/lib/actions/notes";

interface DuplicateCheckerModalProps {
  onClose: () => void;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

export function DuplicateCheckerModal({ onClose }: DuplicateCheckerModalProps) {
  const [groups, setGroups] = useState<DuplicateGroup[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    findDuplicateFocusGroups()
      .then((result) => {
        setGroups(result);
        setError(null);
      })
      .catch((err) => setError(getErrorMessage(err)));
  }, [reloadKey]);

  async function handleDelete(noteId: string) {
    if (!window.confirm("Delete this flashcard? This cannot be undone.")) return;
    setDeletingId(noteId);
    try {
      await deleteNote(noteId);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <ModalShell accentColor="#B33A3A" onClose={onClose}>
      <h3 className="m-0 pr-6 font-serif text-[19px] text-ink">
        Duplicate check
      </h3>
      <p className="mt-1.5 mb-4 text-[13px] text-ink-soft">
        Scans your binder and every group&apos;s shared notes for flashcards
        that cover the same term. Nothing is ever deleted automatically —
        review and delete your own duplicates below if you want to.
      </p>

      {error && <p className="mb-3 text-sm text-c-crit">{error}</p>}

      {groups === null ? (
        <p className="text-[13.5px] text-ink-soft">Scanning…</p>
      ) : groups.length === 0 ? (
        <p className="text-[13.5px] text-ink-soft">
          No duplicate focus terms found. Nice and clean.
        </p>
      ) : (
        <div className="max-h-[55vh] overflow-y-auto rounded border border-line">
          {groups.map((group) => (
            <div key={group.focus} className="border-b border-line px-3.5 py-3 last:border-b-0">
              <p className="m-0 mb-1.5 font-serif text-[15px] text-ink">
                {group.focus}{" "}
                <span className="font-mono text-[10.5px] font-normal text-ink-soft">
                  ({group.entries.length} cards)
                </span>
              </p>
              <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
                {group.entries.map((entry) => (
                  <li
                    key={entry.noteId}
                    className="flex items-center justify-between gap-2 rounded bg-paper-grid px-2.5 py-1.5"
                  >
                    <div className="min-w-0">
                      <p className="m-0 truncate text-[12.5px] text-ink">
                        {entry.title}
                      </p>
                      <p className="m-0 truncate font-mono text-[10.5px] text-ink-soft">
                        {entry.topic} / {entry.folder} · {entry.ownerName}
                      </p>
                    </div>
                    {entry.isOwnNote && (
                      <button
                        type="button"
                        onClick={() => handleDelete(entry.noteId)}
                        disabled={deletingId === entry.noteId}
                        className="shrink-0 rounded border border-line px-2.5 py-1 text-xs font-medium text-c-crit hover:bg-card disabled:opacity-50"
                      >
                        {deletingId === entry.noteId ? "Deleting…" : "Delete"}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <div className="mt-[22px] flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="min-h-[44px] rounded border border-line px-4 py-2.5 text-[13.5px] font-semibold text-ink transition-opacity hover:opacity-88"
        >
          Close
        </button>
      </div>
    </ModalShell>
  );
}
