"use client";

import { useRef, useState } from "react";
import type { TopicSummaryDTO } from "@/lib/types";

const NEW_FOLDER_VALUE = "__new__";

interface TopicFolderFieldsProps {
  topics: TopicSummaryDTO[];
  topic: string;
  folder: string;
  onTopicChange: (value: string) => void;
  onFolderChange: (value: string) => void;
  topicError?: string;
  folderError?: string;
  topicRef?: React.RefObject<HTMLInputElement | null>;
  folderRef?: React.RefObject<HTMLInputElement | null>;
}

export function TopicFolderFields({
  topics,
  topic,
  folder,
  onTopicChange,
  onFolderChange,
  topicError,
  folderError,
  topicRef,
  folderRef,
}: TopicFolderFieldsProps) {
  const matchingTopic = topics.find(
    (t) => t.name.toLowerCase() === topic.trim().toLowerCase(),
  );
  const folderSuggestions = matchingTopic?.folders ?? [];
  const isNewTopic = topic.trim().length > 0 && !matchingTopic;
  const hasExistingFolders = folderSuggestions.length > 0;

  // Whether the folder field is in "type a new name" mode vs. "pick from the
  // list" mode. Starts in list mode whenever the current topic already has
  // folders and the current value matches one of them. Recomputed (during
  // render, not an effect — this is the "adjust state when a prop changes"
  // pattern) whenever the resolved topic identity changes.
  const [isCreatingNew, setIsCreatingNew] = useState(!hasExistingFolders);
  const [lastTopicKey, setLastTopicKey] = useState(matchingTopic?.name ?? null);
  const newFolderInputRef = useRef<HTMLInputElement>(null);

  const topicKey = matchingTopic?.name ?? null;
  if (topicKey !== lastTopicKey) {
    setLastTopicKey(topicKey);
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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field label="Topic">
        <input
          ref={topicRef}
          type="text"
          list="topic-suggestions"
          value={topic}
          onChange={(e) => onTopicChange(e.target.value)}
          placeholder="e.g. Pharmacology"
          className="w-full rounded border border-line bg-paper px-[11px] py-[9px] font-sans text-sm text-ink outline-none focus:border-ink"
        />
        <datalist id="topic-suggestions">
          {topics.map((t) => (
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
              ? "New topic — name a folder to start it (e.g. Prelims)"
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
