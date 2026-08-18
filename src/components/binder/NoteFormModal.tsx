"use client";

import { useRef, useState } from "react";
import { ModalShell } from "@/components/binder/ModalShell";
import { SubjectTopicFolderFields } from "@/components/binder/SubjectTopicFolderFields";
import { subjectColor } from "@/lib/topics";
import type { NoteInput } from "@/lib/actions/notes";
import type { NoteDTO, SubjectSummaryDTO } from "@/lib/types";

interface NoteFormModalProps {
  note: NoteDTO | null;
  defaultSubject: string;
  defaultTopic: string;
  defaultFolder: string;
  subjects: SubjectSummaryDTO[];
  onClose: () => void;
  onSubmit: (input: NoteInput) => void;
  isSaving: boolean;
}

export function NoteFormModal({
  note,
  defaultSubject,
  defaultTopic,
  defaultFolder,
  subjects,
  onClose,
  onSubmit,
  isSaving,
}: NoteFormModalProps) {
  const [subject, setSubject] = useState(note?.subject ?? defaultSubject);
  const [topic, setTopic] = useState(note?.topic ?? defaultTopic);
  const [folder, setFolder] = useState(note?.folder ?? defaultFolder);
  const [focus, setFocus] = useState(note?.focus ?? "");
  const [description, setDescription] = useState(note?.description ?? "");
  const [error, setError] = useState<{
    subject?: string;
    topic?: string;
    folder?: string;
    focus?: string;
    description?: string;
  }>({});
  const subjectRef = useRef<HTMLInputElement>(null);
  const topicRef = useRef<HTMLInputElement>(null);
  const folderRef = useRef<HTMLInputElement>(null);
  const focusRef = useRef<HTMLInputElement>(null);

  const color = subjectColor(subject || defaultSubject);

  function handleSubmit() {
    const trimmedSubject = subject.trim();
    const trimmedTopic = topic.trim();
    const trimmedFolder = folder.trim();
    const trimmedFocus = focus.trim();
    const trimmedDescription = description.trim();
    const nextError: typeof error = {};
    if (!trimmedSubject) nextError.subject = "Subject is required";
    if (!trimmedTopic) nextError.topic = "Topic is required";
    if (!trimmedFolder) nextError.folder = "Folder is required";
    if (!trimmedFocus) nextError.focus = "Focus is required";
    if (!trimmedDescription) nextError.description = "Description is required";

    if (Object.keys(nextError).length > 0) {
      setError(nextError);
      if (nextError.subject) subjectRef.current?.focus();
      else if (nextError.topic) topicRef.current?.focus();
      else if (nextError.folder) folderRef.current?.focus();
      else if (nextError.focus) focusRef.current?.focus();
      return;
    }

    onSubmit({
      subject: trimmedSubject,
      topic: trimmedTopic,
      folder: trimmedFolder,
      focus: trimmedFocus,
      description: trimmedDescription,
    });
  }

  return (
    <ModalShell accentColor={color} onClose={onClose}>
      <h3 className="m-0 font-serif text-[19px] text-ink">
        {note ? "Edit flashcard" : "New flashcard"}
      </h3>

      <div className="mt-4">
        <SubjectTopicFolderFields
          subjects={subjects}
          subject={subject}
          topic={topic}
          folder={folder}
          onSubjectChange={(v) => {
            setSubject(v);
            if (error.subject) setError((prev) => ({ ...prev, subject: undefined }));
          }}
          onTopicChange={(v) => {
            setTopic(v);
            if (error.topic) setError((prev) => ({ ...prev, topic: undefined }));
          }}
          onFolderChange={(v) => {
            setFolder(v);
            if (error.folder) setError((prev) => ({ ...prev, folder: undefined }));
          }}
          subjectError={error.subject}
          topicError={error.topic}
          folderError={error.folder}
          subjectRef={subjectRef}
          topicRef={topicRef}
          folderRef={folderRef}
        />
      </div>

      <Field label="Focus (the word or phrase to memorize)">
        <input
          ref={focusRef}
          type="text"
          value={focus}
          onChange={(e) => {
            setFocus(e.target.value);
            if (error.focus) setError((prev) => ({ ...prev, focus: undefined }));
          }}
          placeholder="e.g. Hypokalemia"
          className="w-full rounded border border-line bg-paper px-[11px] py-[9px] font-sans text-sm text-ink outline-none focus:border-ink"
        />
        {error.focus && <p className="mt-1 text-xs text-c-crit">{error.focus}</p>}
      </Field>

      <Field label="Description">
        <textarea
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            if (error.description)
              setError((prev) => ({ ...prev, description: undefined }));
          }}
          placeholder="What do you need to remember about it? Use # for a heading, - for a bullet, ** for bold."
          className="min-h-[120px] w-full resize-y rounded border border-line bg-paper px-[11px] py-[9px] font-sans text-sm leading-[1.5] text-ink outline-none focus:border-ink"
        />
        {error.description ? (
          <p className="mt-1 text-xs text-c-crit">{error.description}</p>
        ) : (
          <p className="-mt-1 font-mono text-[10.5px] text-ink-soft opacity-75">
            Keep it flashcard-sized — a few sentences, not a full lecture
          </p>
        )}
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
          {isSaving ? "Saving…" : note ? "Save changes" : "Add flashcard"}
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
