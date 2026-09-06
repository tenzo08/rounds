"use client";

import { useState } from "react";
import { ModalShell } from "@/components/binder/ModalShell";
import { SubjectTopicFolderFields } from "@/components/binder/SubjectTopicFolderFields";
import {
  bulkMoveNotes,
  finalizeBulkNoteChanges,
} from "@/lib/actions/notes";
import { runSequentialBatches } from "@/lib/bulkOperations";
import type { SubjectSummaryDTO } from "@/lib/types";

interface BulkMoveModalProps {
  noteIds: string[];
  subjects: SubjectSummaryDTO[];
  onClose: () => void;
  onMoved: () => void;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

export function BulkMoveModal({
  noteIds,
  subjects,
  onClose,
  onMoved,
}: BulkMoveModalProps) {
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [folder, setFolder] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const [remainingNoteIds, setRemainingNoteIds] = useState(noteIds);
  const [movedCount, setMovedCount] = useState(0);

  async function handleMove() {
    const trimmedSubject = subject.trim();
    const trimmedTopic = topic.trim();
    const trimmedFolder = folder.trim();
    if (!trimmedSubject || !trimmedTopic || !trimmedFolder) {
      setError("Pick a destination subject, topic, and folder.");
      return;
    }
    setIsMoving(true);
    setError(null);
    let movedThisAttempt = 0;
    let allBatchesMoved = false;
    try {
      await runSequentialBatches(
        remainingNoteIds,
        async (batch) => {
          await bulkMoveNotes({
            noteIds: batch,
            subject: trimmedSubject,
            topic: trimmedTopic,
            folder: trimmedFolder,
            revalidateAfterMove: false,
          });
        },
        (completed) => {
          movedThisAttempt = completed;
          setMovedCount(noteIds.length - remainingNoteIds.length + completed);
        },
      );
      allBatchesMoved = true;
      setRemainingNoteIds([]);
      await finalizeBulkNoteChanges();
      onMoved();
    } catch (err) {
      const totalMoved =
        noteIds.length - remainingNoteIds.length + movedThisAttempt;
      setMovedCount(totalMoved);
      setRemainingNoteIds((ids) => ids.slice(movedThisAttempt));
      if (!allBatchesMoved && movedThisAttempt > 0) {
        try {
          await finalizeBulkNoteChanges();
        } catch {
          // The acknowledged moves remain saved even if refresh fails.
        }
      }
      if (allBatchesMoved) {
        setError(
          `All ${noteIds.length} flashcards were moved, but the binder could not refresh. Close this window and reload the page.`,
        );
      } else if (movedThisAttempt > 0) {
        setError(
          `${totalMoved} of ${noteIds.length} flashcards were moved. Press Retry remaining to continue.`,
        );
      } else {
        setError(getErrorMessage(err));
      }
    } finally {
      setIsMoving(false);
    }
  }

  return (
    <ModalShell
      accentColor="#3B6E8F"
      onClose={isMoving ? () => undefined : onClose}
    >
      <h3 className="m-0 pr-6 font-serif text-[19px] text-ink">
        Move {noteIds.length} flashcard{noteIds.length === 1 ? "" : "s"}
      </h3>
      <p className="mt-1 mb-4 text-[13px] text-ink-soft">
        Choose the subject, topic, and folder to move the selected cards into.
      </p>

      <SubjectTopicFolderFields
        subjects={subjects}
        subject={subject}
        topic={topic}
        folder={folder}
        onSubjectChange={setSubject}
        onTopicChange={setTopic}
        onFolderChange={setFolder}
      />

      {error && <p className="mt-3 text-sm text-c-crit">{error}</p>}

      {isMoving && (
        <div className="mt-3" role="status" aria-live="polite">
          <p className="m-0 text-[12.8px] font-semibold text-ink">
            Moving {movedCount} of {noteIds.length}…
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-paper-grid">
            <div
              className="h-full bg-c-medsurg transition-[width] duration-200"
              style={{ width: `${(movedCount / noteIds.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="mt-[22px] flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          disabled={isMoving}
          className="rounded border border-line px-4 py-2.5 text-[13.5px] font-semibold text-ink transition-opacity hover:opacity-88"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={remainingNoteIds.length === 0 ? onClose : handleMove}
          disabled={isMoving}
          className="rounded bg-ink px-4 py-2.5 text-[13.5px] font-semibold text-paper transition-opacity hover:opacity-88 disabled:opacity-50"
        >
          {isMoving
            ? `Moving ${movedCount} of ${noteIds.length}…`
            : remainingNoteIds.length === 0
              ? "Close"
              : movedCount > 0
                ? "Retry remaining"
                : "Move"}
        </button>
      </div>
    </ModalShell>
  );
}
