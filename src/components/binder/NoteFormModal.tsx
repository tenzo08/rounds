"use client";

import { useRef, useState } from "react";
import { ModalShell } from "@/components/binder/ModalShell";
import { topicColor } from "@/lib/topics";
import type { NoteInput } from "@/lib/actions/notes";
import type { NoteDTO } from "@/lib/types";

interface NoteFormModalProps {
  note: NoteDTO | null;
  defaultTopic: string;
  existingTopics: string[];
  onClose: () => void;
  onSubmit: (input: NoteInput) => void;
  isSaving: boolean;
}

export function NoteFormModal({
  note,
  defaultTopic,
  existingTopics,
  onClose,
  onSubmit,
  isSaving,
}: NoteFormModalProps) {
  const [title, setTitle] = useState(note?.title ?? "");
  const [topic, setTopic] = useState(note?.topic ?? defaultTopic);
  const [body, setBody] = useState(note?.body ?? "");
  const [tagsRaw, setTagsRaw] = useState(note?.tags.join(", ") ?? "");
  const [link, setLink] = useState(note?.link ?? "");
  const [error, setError] = useState<{ title?: string; topic?: string }>({});
  const titleRef = useRef<HTMLInputElement>(null);
  const topicRef = useRef<HTMLInputElement>(null);

  const color = topicColor(topic || defaultTopic);

  function handleSubmit() {
    const trimmedTitle = title.trim();
    const trimmedTopic = topic.trim();
    const nextError: { title?: string; topic?: string } = {};
    if (!trimmedTitle) nextError.title = "Title is required";
    if (!trimmedTopic) nextError.topic = "Topic is required";

    if (nextError.title) {
      setError(nextError);
      titleRef.current?.focus();
      return;
    }
    if (nextError.topic) {
      setError(nextError);
      topicRef.current?.focus();
      return;
    }

    const tags = tagsRaw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    onSubmit({
      title: trimmedTitle,
      topic: trimmedTopic,
      body: body.trim(),
      tags,
      link: link.trim(),
    });
  }

  return (
    <ModalShell accentColor={color} onClose={onClose}>
      <h3 className="m-0 font-serif text-[19px] text-ink">
        {note ? "Edit entry" : "New entry"}
      </h3>

      <Field label="Title">
        <input
          ref={titleRef}
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (error.title) setError((prev) => ({ ...prev, title: undefined }));
          }}
          placeholder="e.g. Beta-blocker teaching points"
          className="w-full rounded border border-line bg-paper px-[11px] py-[9px] font-sans text-sm text-ink outline-none focus:border-ink"
        />
        {error.title && <p className="mt-1 text-xs text-c-crit">{error.title}</p>}
      </Field>

      <Field label="Topic">
        <input
          ref={topicRef}
          type="text"
          list="topic-suggestions"
          value={topic}
          onChange={(e) => {
            setTopic(e.target.value);
            if (error.topic) setError((prev) => ({ ...prev, topic: undefined }));
          }}
          placeholder="e.g. Fundamentals, or make up your own"
          className="w-full rounded border border-line bg-paper px-[11px] py-[9px] font-sans text-sm text-ink outline-none focus:border-ink"
        />
        <datalist id="topic-suggestions">
          {existingTopics.map((t) => (
            <option key={t} value={t} />
          ))}
        </datalist>
        {error.topic ? (
          <p className="mt-1 text-xs text-c-crit">{error.topic}</p>
        ) : (
          <p className="-mt-1 font-mono text-[10.5px] text-ink-soft opacity-75">
            Type any topic — new ones are created automatically
          </p>
        )}
      </Field>

      <Field label="Notes">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="What do you need to remember? One entry can hold a whole lecture — use # for a heading, - for a bullet, ** for bold."
          className="min-h-[120px] w-full resize-y rounded border border-line bg-paper px-[11px] py-[9px] font-sans text-sm leading-[1.5] text-ink outline-none focus:border-ink"
        />
        <p className="-mt-1 font-mono text-[10.5px] text-ink-soft opacity-75">
          # heading · - bullet · **bold** · leave a blank line between
          sections
        </p>
      </Field>

      <Field label="Tags (comma separated)">
        <input
          type="text"
          value={tagsRaw}
          onChange={(e) => setTagsRaw(e.target.value)}
          placeholder="e.g. cardiac, dosing, nclex"
          className="w-full rounded border border-line bg-paper px-[11px] py-[9px] font-sans text-sm text-ink outline-none focus:border-ink"
        />
      </Field>

      <Field label="Reference link (optional)">
        <input
          type="text"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="https://"
          className="w-full rounded border border-line bg-paper px-[11px] py-[9px] font-sans text-sm text-ink outline-none focus:border-ink"
        />
      </Field>

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
          onClick={handleSubmit}
          disabled={isSaving}
          className="rounded bg-ink px-4 py-2.5 text-[13.5px] font-semibold text-paper transition-opacity hover:opacity-88 disabled:opacity-50"
        >
          {isSaving ? "Saving…" : note ? "Save changes" : "Add entry"}
        </button>
      </div>
    </ModalShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-4 first:mt-0">
      <label className="mb-1.5 block font-mono text-[10.5px] tracking-[0.08em] text-ink-soft uppercase">
        {label}
      </label>
      {children}
    </div>
  );
}
