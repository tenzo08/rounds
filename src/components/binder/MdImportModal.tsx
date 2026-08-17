"use client";

import { useRef, useState } from "react";
import { ModalShell } from "@/components/binder/ModalShell";
import { TopicFolderFields } from "@/components/binder/TopicFolderFields";
import {
  FLASHCARD_IMPORT_PROMPT,
  parseFlashcardMarkdown,
  normalizeFocus,
  type ParsedFlashcard,
} from "@/lib/mdFlashcards";
import {
  checkDuplicateFocuses,
  importFlashcards,
} from "@/lib/actions/mdImport";
import type { TopicSummaryDTO } from "@/lib/types";

interface MdImportModalProps {
  topics: TopicSummaryDTO[];
  defaultTopic: string;
  defaultFolder: string;
  onClose: () => void;
  onImported: () => void;
}

interface ReviewCard extends ParsedFlashcard {
  duplicateOf: string | null;
  include: boolean;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

export function MdImportModal({
  topics,
  defaultTopic,
  defaultFolder,
  onClose,
  onImported,
}: MdImportModalProps) {
  const [topic, setTopic] = useState(defaultTopic);
  const [folder, setFolder] = useState(defaultFolder);
  const [copyLabel, setCopyLabel] = useState("Copy prompt");
  const [reviewCards, setReviewCards] = useState<ReviewCard[] | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleCopyPrompt() {
    try {
      await navigator.clipboard.writeText(FLASHCARD_IMPORT_PROMPT);
      setCopyLabel("Copied!");
      setTimeout(() => setCopyLabel("Copy prompt"), 1800);
    } catch {
      setError("Couldn't copy automatically — select and copy the text manually.");
    }
  }

  async function handleFileSelected(file: File) {
    setError(null);
    setFileName(file.name);
    const text = await file.text();
    const parsed = parseFlashcardMarkdown(text);
    if (parsed.length === 0) {
      setError(
        "Couldn't find any flashcards in that file — make sure it follows the prompt's format.",
      );
      setReviewCards(null);
      return;
    }
    setIsChecking(true);
    try {
      const duplicates = await checkDuplicateFocuses(
        parsed.map((c) => c.focus),
      );
      const duplicateMap = new Map(
        duplicates.map((d) => [
          d.focus,
          `${d.existingNoteTitle} (${d.existingTopic} / ${d.existingFolder})`,
        ]),
      );
      setReviewCards(
        parsed.map((card) => {
          const duplicateOf =
            duplicateMap.get(normalizeFocus(card.focus)) ?? null;
          return { ...card, duplicateOf, include: !duplicateOf };
        }),
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsChecking(false);
    }
  }

  function toggleInclude(idx: number) {
    setReviewCards((prev) =>
      prev
        ? prev.map((c, i) => (i === idx ? { ...c, include: !c.include } : c))
        : prev,
    );
  }

  async function handleImport() {
    if (!reviewCards) return;
    const trimmedTopic = topic.trim();
    const trimmedFolder = folder.trim();
    if (!trimmedTopic || !trimmedFolder) {
      setError("Pick a topic and folder for these flashcards first.");
      return;
    }
    const selected = reviewCards.filter((c) => c.include);
    if (selected.length === 0) {
      setError("Check at least one flashcard to import.");
      return;
    }
    setIsImporting(true);
    setError(null);
    try {
      await importFlashcards(
        trimmedTopic,
        trimmedFolder,
        selected.map(({ title, focus, description }) => ({
          title,
          focus,
          description,
        })),
      );
      onImported();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <ModalShell accentColor="#3A8F8C" onClose={onClose}>
      <h3 className="m-0 font-serif text-[19px] text-ink">
        Upload flashcards from an .md file
      </h3>

      <div className="mt-3.5 rounded border border-line bg-paper-grid p-3.5">
        <ol className="m-0 mb-3 list-decimal space-y-1.5 pl-4 text-[12.8px] leading-[1.5] text-ink-soft">
          <li>Copy the prompt below.</li>
          <li>Open Claude, ChatGPT, or another LLM and attach your lecture PDF to the conversation.</li>
          <li>Paste the prompt as your message.</li>
          <li>
            Save its reply as a <code>.md</code> file.
          </li>
          <li>Upload that file below.</li>
        </ol>
        <button
          type="button"
          onClick={handleCopyPrompt}
          className="rounded border border-line bg-card px-3 py-1.5 text-xs font-semibold text-ink transition-opacity hover:opacity-88"
        >
          {copyLabel}
        </button>
      </div>

      <div className="mt-4">
        <TopicFolderFields
          topics={topics}
          topic={topic}
          folder={folder}
          onTopicChange={setTopic}
          onFolderChange={setFolder}
        />
      </div>

      <div className="mt-4">
        <label className="mb-1.5 block font-mono text-[10.5px] tracking-[0.08em] text-ink-soft uppercase">
          .md file
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept=".md,text/markdown,text/plain"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFileSelected(file);
          }}
          className="block w-full text-[12.8px] text-ink-soft file:mr-3 file:rounded file:border file:border-line file:bg-card file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-ink"
        />
        {fileName && (
          <p className="mt-1.5 font-mono text-[10.5px] text-ink-soft opacity-75">
            {fileName}
          </p>
        )}
      </div>

      {isChecking && (
        <p className="mt-3 text-[12.8px] text-ink-soft">Checking for duplicates…</p>
      )}

      {reviewCards && (
        <div className="mt-3.5 max-h-[38vh] overflow-y-auto rounded border border-line">
          {reviewCards.map((card, idx) => (
            <label
              key={idx}
              className="flex items-start gap-2.5 border-b border-line px-3 py-2.5 last:border-b-0"
            >
              <input
                type="checkbox"
                checked={card.include}
                onChange={() => toggleInclude(idx)}
                className="mt-0.5 h-3.5 w-3.5 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="m-0 truncate text-[13px] font-semibold text-ink">
                  {card.title} — {card.focus}
                </p>
                <p className="m-0 line-clamp-2 text-[12px] text-ink-soft">
                  {card.description}
                </p>
                {card.duplicateOf && (
                  <p className="m-0 mt-1 text-[11px] text-c-crit">
                    Possible duplicate of “{card.duplicateOf}” — unchecked by
                    default, but you can still import it.
                  </p>
                )}
              </div>
            </label>
          ))}
        </div>
      )}

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
          onClick={handleImport}
          disabled={!reviewCards || isImporting}
          className="rounded bg-ink px-4 py-2.5 text-[13.5px] font-semibold text-paper transition-opacity hover:opacity-88 disabled:opacity-50"
        >
          {isImporting ? "Importing…" : "Import checked"}
        </button>
      </div>
    </ModalShell>
  );
}
