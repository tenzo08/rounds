"use client";

import { useState } from "react";
import { ModalShell } from "@/components/binder/ModalShell";
import { SubjectTopicFolderFields } from "@/components/binder/SubjectTopicFolderFields";
import { bulkMoveNotes } from "@/lib/actions/notes";
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
    try {
      await bulkMoveNotes({
        noteIds,
        subject: trimmedSubject,
        topic: trimmedTopic,
        folder: trimmedFolder,
      });
      onMoved();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsMoving(false);
    }
  }

  return (
    <ModalShell accentColor="#3B6E8F" onClose={onClose}>
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

      <div className="mt-[22px] flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded border border-line px-4 py-2.5 text-[13.5px] font-semibold text-ink transition-opacity hover:opacity-88"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleMove}
          disabled={isMoving}
          className="rounded bg-ink px-4 py-2.5 text-[13.5px] font-semibold text-paper transition-opacity hover:opacity-88 disabled:opacity-50"
        >
          {isMoving ? "Moving…" : "Move"}
        </button>
      </div>
    </ModalShell>
  );
}
