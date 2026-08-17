"use client";

import type { TopicSummaryDTO } from "@/lib/types";

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
        <input
          ref={folderRef}
          type="text"
          list="folder-suggestions"
          value={folder}
          onChange={(e) => onFolderChange(e.target.value)}
          placeholder="e.g. Prelims"
          className="w-full rounded border border-line bg-paper px-[11px] py-[9px] font-sans text-sm text-ink outline-none focus:border-ink"
        />
        <datalist id="folder-suggestions">
          {folderSuggestions.map((f) => (
            <option key={f.name} value={f.name} />
          ))}
        </datalist>
        {folderError ? (
          <p className="mt-1 text-xs text-c-crit">{folderError}</p>
        ) : (
          <p className="-mt-1 font-mono text-[10.5px] text-ink-soft opacity-75">
            {isNewTopic
              ? "New topic — name a folder to start it (e.g. Prelims)"
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
