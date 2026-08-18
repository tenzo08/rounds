"use client";

import { useRef, useState } from "react";
import type { SubjectSummaryDTO } from "@/lib/types";

const NEW_FOLDER_VALUE = "__new__";

// Shown as ready-made folder choices the moment a brand-new topic is named —
// resolveFolderId() on the server seeds exactly these three (minus whichever
// one is actually chosen) the first time a topic is created, so offering
// them here up front avoids the field starting out as a bare text input.
const DEFAULT_FOLDER_SUGGESTIONS = [
  { name: "Prelims", count: 0 },
  { name: "Midterms", count: 0 },
  { name: "Finals", count: 0 },
];

interface SubjectTopicFolderFieldsProps {
  subjects: SubjectSummaryDTO[];
  subject: string;
  topic: string;
  folder: string;
  onSubjectChange: (value: string) => void;
  onTopicChange: (value: string) => void;
  onFolderChange: (value: string) => void;
  subjectError?: string;
  topicError?: string;
  folderError?: string;
  subjectRef?: React.RefObject<HTMLInputElement | null>;
  topicRef?: React.RefObject<HTMLInputElement | null>;
  folderRef?: React.RefObject<HTMLInputElement | null>;
}

export function SubjectTopicFolderFields({
  subjects,
  subject,
  topic,
  folder,
  onSubjectChange,
  onTopicChange,
  onFolderChange,
  subjectError,
  topicError,
  folderError,
  subjectRef,
  topicRef,
  folderRef,
}: SubjectTopicFolderFieldsProps) {
  const matchingSubject = subjects.find(
    (s) => s.name.toLowerCase() === subject.trim().toLowerCase(),
  );
  const topicSuggestions = matchingSubject?.topics ?? [];
  const matchingTopic = topicSuggestions.find(
    (t) => t.name.toLowerCase() === topic.trim().toLowerCase(),
  );
  const isNewTopic = topic.trim().length > 0 && !matchingTopic;
  const folderSuggestions = matchingTopic
    ? matchingTopic.folders
    : topic.trim().length > 0
      ? DEFAULT_FOLDER_SUGGESTIONS
      : [];
  const hasExistingFolders = folderSuggestions.length > 0;

  // Whether the folder field is in "type a new name" mode vs. "pick from the
  // list" mode. Starts in list mode whenever the resolved topic has folder
  // suggestions (real or the Prelims/Midterms/Finals defaults) and the
  // current value matches one of them. Recomputed (during render, not an
  // effect — this is the "adjust state when a prop changes" pattern)
  // whenever the resolved topic identity changes.
  const [isCreatingNew, setIsCreatingNew] = useState(!hasExistingFolders);
  const topicIdentityKey = matchingTopic
    ? `${matchingSubject!.name}␟${matchingTopic.name}`
    : null;
  const [lastTopicKey, setLastTopicKey] = useState(topicIdentityKey);
  const newFolderInputRef = useRef<HTMLInputElement>(null);

  if (topicIdentityKey !== lastTopicKey) {
    setLastTopicKey(topicIdentityKey);
    if (!hasExistingFolders || folder.trim().length === 0) {
      setIsCreatingNew(!hasExistingFolders);
    } else {
      const matchesExisting = folderSuggestions.some(
        (f) => f.name.toLowerCase() === folder.trim().toLowerCase(),
      );
      setIsCreatingNew(!matchesExisting);
    }
  }

  function handleSelectChange(value: string) {
    if (value === NEW_FOLDER_VALUE) {
      setIsCreatingNew(true);
      onFolderChange("");
      requestAnimationFrame(() => newFolderInputRef.current?.focus());
      return;
    }
    onFolderChange(value);
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Field label="Subject">
        <input
          ref={subjectRef}
          type="text"
          list="subject-suggestions"
          value={subject}
          onChange={(e) => onSubjectChange(e.target.value)}
          placeholder="e.g. Pharmacology"
          className="w-full rounded border border-line bg-paper px-[11px] py-[9px] font-sans text-sm text-ink outline-none focus:border-ink"
        />
        <datalist id="subject-suggestions">
          {subjects.map((s) => (
            <option key={s.name} value={s.name} />
          ))}
        </datalist>
        {subjectError && (
          <p className="mt-1 text-xs text-c-crit">{subjectError}</p>
        )}
      </Field>

      <Field label="Topic">
        <input
          ref={topicRef}
          type="text"
          list="topic-suggestions"
          value={topic}
          onChange={(e) => onTopicChange(e.target.value)}
          placeholder="e.g. Antibiotics"
          className="w-full rounded border border-line bg-paper px-[11px] py-[9px] font-sans text-sm text-ink outline-none focus:border-ink"
        />
        <datalist id="topic-suggestions">
          {topicSuggestions.map((t) => (
            <option key={t.name} value={t.name} />
          ))}
        </datalist>
        {topicError && <p className="mt-1 text-xs text-c-crit">{topicError}</p>}
      </Field>

      <Field label="Folder">
        {hasExistingFolders && !isCreatingNew ? (
          <select
            value={
              folderSuggestions.find(
                (f) => f.name.toLowerCase() === folder.trim().toLowerCase(),
              )?.name ?? ""
            }
            onChange={(e) => handleSelectChange(e.target.value)}
            className="w-full rounded border border-line bg-paper px-[11px] py-[9px] font-sans text-sm text-ink outline-none focus:border-ink"
          >
            <option value="" disabled>
              Choose a folder…
            </option>
            {folderSuggestions.map((f) => (
              <option key={f.name} value={f.name}>
                {f.name} ({f.count})
              </option>
            ))}
            <option value={NEW_FOLDER_VALUE}>+ Create new folder…</option>
          </select>
        ) : (
          <input
            ref={(node) => {
              newFolderInputRef.current = node;
              if (folderRef) folderRef.current = node;
            }}
            type="text"
            value={folder}
            onChange={(e) => onFolderChange(e.target.value)}
            placeholder="e.g. Prelims"
            className="w-full rounded border border-line bg-paper px-[11px] py-[9px] font-sans text-sm text-ink outline-none focus:border-ink"
          />
        )}
        {hasExistingFolders && isCreatingNew && (
          <button
            type="button"
            onClick={() => {
              setIsCreatingNew(false);
              onFolderChange("");
            }}
            className="mt-1.5 font-mono text-[10.5px] text-ink-soft underline hover:text-ink"
          >
            Choose an existing folder instead
          </button>
        )}
        {folderError ? (
          <p className="mt-1 text-xs text-c-crit">{folderError}</p>
        ) : (
          <p className="-mt-1 mt-1.5 font-mono text-[10.5px] text-ink-soft opacity-75">
            {isNewTopic
              ? "New topic — Prelims/Midterms/Finals are created automatically"
              : hasExistingFolders && !isCreatingNew
                ? "Pick an existing folder, or create a new one"
                : "Type any folder — new ones are created automatically"}
          </p>
        )}
      </Field>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block font-mono text-[10.5px] tracking-[0.08em] text-ink-soft uppercase">
        {label}
      </label>
      {children}
    </div>
  );
}
