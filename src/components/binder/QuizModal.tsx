"use client";

import { useMemo, useRef, useState } from "react";
import { ModalShell } from "@/components/binder/ModalShell";
import { subjectColor } from "@/lib/topics";
import { renderMarkdown } from "@/lib/markdown";
import { redactFocusFromText } from "@/lib/mdFlashcards";

export interface QuizCard {
  id: string;
  focus: string;
  description: string;
  subject: string;
  topic: string;
  folder: string;
}

interface QuizFolderGroup {
  folder: string;
  count: number;
}

interface QuizTopicGroup {
  topic: string;
  folders: QuizFolderGroup[];
}

interface QuizSubjectGroup {
  subject: string;
  topics: QuizTopicGroup[];
}

interface QuizResult {
  card: QuizCard;
  userAnswer: string;
  correct: boolean;
}

interface QuizModalProps {
  title: string;
  cards: QuizCard[];
  onClose: () => void;
}

type QuizMode = "type" | "flip";

function folderKey(subject: string, topic: string, folder: string): string {
  return `${subject}␟${topic}␟${folder}`;
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Lenient on purpose — capitalization and stray whitespace shouldn't count
// against a student who clearly knows the term.
function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

type Step = "mode" | "setup" | "playing" | "done" | "review";

export function QuizModal({ title, cards, onClose }: QuizModalProps) {
  const groups = useMemo<QuizSubjectGroup[]>(() => {
    const bySubject = new Map<string, Map<string, Map<string, number>>>();
    for (const card of cards) {
      if (!bySubject.has(card.subject)) bySubject.set(card.subject, new Map());
      const topics = bySubject.get(card.subject)!;
      if (!topics.has(card.topic)) topics.set(card.topic, new Map());
      const folders = topics.get(card.topic)!;
      folders.set(card.folder, (folders.get(card.folder) ?? 0) + 1);
    }
    return Array.from(bySubject.entries())
      .map(([subject, topics]) => ({
        subject,
        topics: Array.from(topics.entries())
          .map(([topic, folders]) => ({
            topic,
            folders: Array.from(folders.entries())
              .map(([folder, count]) => ({ folder, count }))
              .sort((a, b) => a.folder.localeCompare(b.folder)),
          }))
          .sort((a, b) => a.topic.localeCompare(b.topic)),
      }))
      .sort((a, b) => a.subject.localeCompare(b.subject));
  }, [cards]);

  const allKeys = useMemo(
    () =>
      groups.flatMap((g) =>
        g.topics.flatMap((t) =>
          t.folders.map((f) => folderKey(g.subject, t.topic, f.folder)),
        ),
      ),
    [groups],
  );

  const [mode, setMode] = useState<QuizMode>("type");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [step, setStep] = useState<Step>("mode");
  const [deck, setDeck] = useState<QuizCard[]>([]);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [checked, setChecked] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [lastCorrect, setLastCorrect] = useState(false);
  const [results, setResults] = useState<QuizResult[]>([]);
  const answerRef = useRef<HTMLInputElement>(null);

  const availablePool =
    selected.size === 0
      ? cards
      : cards.filter((c) =>
          selected.has(folderKey(c.subject, c.topic, c.folder)),
        );
  const [maxItemsInput, setMaxItemsInput] = useState<string>("");
  const maxItems = Math.max(
    1,
    Math.min(
      Number(maxItemsInput) || availablePool.length,
      availablePool.length || 1,
    ),
  );

  function toggleFolder(subject: string, topic: string, folder: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      const key = folderKey(subject, topic, folder);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleTopic(subject: string, topicGroup: QuizTopicGroup) {
    setSelected((prev) => {
      const next = new Set(prev);
      const keys = topicGroup.folders.map((f) =>
        folderKey(subject, topicGroup.topic, f.folder),
      );
      const allSelected = keys.every((k) => next.has(k));
      for (const k of keys) {
        if (allSelected) next.delete(k);
        else next.add(k);
      }
      return next;
    });
  }

  function toggleSubject(subjectGroup: QuizSubjectGroup) {
    setSelected((prev) => {
      const next = new Set(prev);
      const keys = subjectGroup.topics.flatMap((t) =>
        t.folders.map((f) => folderKey(subjectGroup.subject, t.topic, f.folder)),
      );
      const allSelected = keys.every((k) => next.has(k));
      for (const k of keys) {
        if (allSelected) next.delete(k);
        else next.add(k);
      }
      return next;
    });
  }

  const allSelected = allKeys.length > 0 && allKeys.every((k) => selected.has(k));
  function toggleSelectAll() {
    setSelected(allSelected ? new Set() : new Set(allKeys));
  }

  function startQuiz() {
    if (availablePool.length === 0) return;
    setDeck(shuffle(availablePool).slice(0, maxItems));
    setIndex(0);
    setAnswer("");
    setChecked(false);
    setRevealed(false);
    setResults([]);
    setStep("playing");
  }

  function handleCheck() {
    if (!answer.trim() || !current) return;
    const correct = normalize(answer) === normalize(current.focus);
    setLastCorrect(correct);
    setResults((prev) => [...prev, { card: current, userAnswer: answer, correct }]);
    setChecked(true);
  }

  function handleFlipGrade(correct: boolean) {
    if (!current) return;
    setResults((prev) => [...prev, { card: current, userAnswer: "", correct }]);
    advanceCard();
  }

  function advanceCard() {
    if (index + 1 >= deck.length) {
      setStep("done");
    } else {
      setIndex((i) => i + 1);
      setAnswer("");
      setChecked(false);
      setRevealed(false);
      requestAnimationFrame(() => answerRef.current?.focus());
    }
  }

  function handleNext() {
    advanceCard();
  }

  const current = deck[index];
  const color = current ? subjectColor(current.subject) : "#4A7C59";
  const score = results.filter((r) => r.correct).length;
  const scorePercent = deck.length > 0 ? Math.round((score / deck.length) * 100) : 0;

  return (
    <ModalShell accentColor={color} onClose={onClose}>
      {step === "mode" && (
        <>
          <h3 className="m-0 pr-6 font-serif text-[19px] text-ink">
            Quiz: {title}
          </h3>
          <p className="mt-1 mb-4 text-[13px] text-ink-soft">
            How do you want to be quizzed?
          </p>
          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => {
                setMode("type");
                setStep("setup");
              }}
              className="rounded border border-line bg-card px-4 py-3 text-left transition-colors hover:border-ink"
            >
              <p className="m-0 font-serif text-[15px] text-ink">Type the answer</p>
              <p className="m-0 mt-0.5 text-[12.5px] text-ink-soft">
                You&apos;ll see the description and type the term it describes —
                graded automatically.
              </p>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("flip");
                setStep("setup");
              }}
              className="rounded border border-line bg-card px-4 py-3 text-left transition-colors hover:border-ink"
            >
              <p className="m-0 font-serif text-[15px] text-ink">Flip the card</p>
              <p className="m-0 mt-0.5 text-[12.5px] text-ink-soft">
                You&apos;ll see the description, guess the term in your head, then
                tap the card to reveal it and grade yourself.
              </p>
            </button>
          </div>
          <div className="mt-[22px] flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-line px-4 py-2.5 text-[13.5px] font-semibold text-ink transition-opacity hover:opacity-88"
            >
              Cancel
            </button>
          </div>
        </>
      )}

      {step === "setup" && (
        <>
          <h3 className="m-0 pr-6 font-serif text-[19px] text-ink">
            Quiz: {title}
          </h3>
          <p className="mt-1 mb-4 text-[13px] text-ink-soft">
            {mode === "type"
              ? "You'll see the description and type the term it's describing."
              : "You'll see the description, then tap the card to reveal the term."}{" "}
            Pick subjects, topics, or folders to include, or select all.
          </p>
          {groups.length === 0 ? (
            <p className="text-[13.5px] text-ink-soft">
              No flashcards available to quiz on yet.
            </p>
          ) : (
            <>
              <label className="mb-2 flex min-h-[36px] cursor-pointer items-center gap-2.5 rounded border border-line bg-paper-grid px-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="h-3.5 w-3.5"
                />
                <span className="text-[12.5px] font-semibold text-ink">
                  Select all
                </span>
              </label>
              <div className="max-h-[38vh] overflow-y-auto rounded border border-line">
                {groups.map((group) => {
                  const subjectKeys = group.topics.flatMap((t) =>
                    t.folders.map((f) =>
                      folderKey(group.subject, t.topic, f.folder),
                    ),
                  );
                  const subjectAllSelected =
                    subjectKeys.length > 0 &&
                    subjectKeys.every((k) => selected.has(k));
                  return (
                    <div key={group.subject} className="border-b border-line last:border-b-0">
                      <label className="flex min-h-[40px] cursor-pointer items-center gap-2.5 bg-paper-grid px-3 py-2">
                        <input
                          type="checkbox"
                          checked={subjectAllSelected}
                          onChange={() => toggleSubject(group)}
                          className="h-3.5 w-3.5 shrink-0"
                        />
                        <span
                          className="h-[9px] w-[9px] shrink-0 rounded-[2px]"
                          style={{ background: subjectColor(group.subject) }}
                        />
                        <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-ink">
                          {group.subject}
                        </span>
                      </label>
                      {group.topics.map((t) => {
                        const topicKeys = t.folders.map((f) =>
                          folderKey(group.subject, t.topic, f.folder),
                        );
                        const topicAllSelected =
                          topicKeys.length > 0 &&
                          topicKeys.every((k) => selected.has(k));
                        return (
                          <div key={t.topic}>
                            <label className="flex min-h-[38px] cursor-pointer items-center gap-2.5 py-1.5 pr-3 pl-7">
                              <input
                                type="checkbox"
                                checked={topicAllSelected}
                                onChange={() => toggleTopic(group.subject, t)}
                                className="h-3.5 w-3.5 shrink-0"
                              />
                              <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold text-ink-soft">
                                {t.topic}
                              </span>
                            </label>
                            {t.folders.map((f) => (
                              <label
                                key={f.folder}
                                className="flex min-h-[36px] cursor-pointer items-center gap-2.5 px-3 py-1.5 pl-12"
                              >
                                <input
                                  type="checkbox"
                                  checked={selected.has(
                                    folderKey(group.subject, t.topic, f.folder),
                                  )}
                                  onChange={() =>
                                    toggleFolder(group.subject, t.topic, f.folder)
                                  }
                                  className="h-3.5 w-3.5 shrink-0"
                                />
                                <span className="min-w-0 flex-1 truncate text-[12.5px] text-ink-soft">
                                  {f.folder}
                                </span>
                                <span className="shrink-0 font-mono text-[10.5px] text-ink-soft opacity-60">
                                  {f.count}
                                </span>
                              </label>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>

              <div className="mt-4">
                <label className="mb-1.5 block font-mono text-[10.5px] tracking-[0.08em] text-ink-soft uppercase">
                  Number of cards (up to {availablePool.length})
                </label>
                <input
                  type="number"
                  min={1}
                  max={availablePool.length || 1}
                  value={maxItemsInput}
                  onChange={(e) => setMaxItemsInput(e.target.value)}
                  placeholder={String(availablePool.length || 0)}
                  className="w-[120px] rounded border border-line bg-paper px-[11px] py-[9px] font-sans text-sm text-ink outline-none focus:border-ink"
                />
              </div>
            </>
          )}
          <div className="mt-[22px] flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setStep("mode")}
              className="rounded border border-line px-4 py-2.5 text-[13.5px] font-semibold text-ink transition-opacity hover:opacity-88"
            >
              Back
            </button>
            <button
              type="button"
              onClick={startQuiz}
              disabled={availablePool.length === 0}
              className="rounded bg-ink px-4 py-2.5 text-[13.5px] font-semibold text-paper transition-opacity hover:opacity-88 disabled:opacity-50"
            >
              Start quiz
            </button>
          </div>
        </>
      )}

      {step === "playing" && current && mode === "type" && (
        <>
          <div className="mb-3 flex items-center justify-between font-mono text-[11px] text-ink-soft">
            <span>
              Card {index + 1} / {deck.length}
            </span>
            <span>
              {current.subject} / {current.topic} / {current.folder}
            </span>
          </div>
          <div
            className="rounded-[3px] px-3.5 py-3 text-sm leading-[1.6] text-ink"
            style={{ background: `${color}1a` }}
          >
            {renderMarkdown(
              redactFocusFromText(current.description, current.focus),
            )}
          </div>

          <div className="mt-3.5">
            <label className="mb-1.5 block font-mono text-[10.5px] tracking-[0.08em] text-ink-soft uppercase">
              What term does this describe?
            </label>
            <input
              ref={answerRef}
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (checked) handleNext();
                  else handleCheck();
                }
              }}
              disabled={checked}
              autoFocus
              placeholder="Type your answer…"
              className="w-full rounded border border-line bg-paper px-[11px] py-[9px] font-sans text-sm text-ink outline-none focus:border-ink disabled:opacity-70"
            />
          </div>

          {checked && (
            <div className="mt-3.5 rounded-[3px] border border-line px-3.5 py-3">
              <p className="m-0 mb-1 font-mono text-[10.5px] tracking-[0.08em] text-ink-soft uppercase">
                {current.topic}
              </p>
              <p className="m-0 font-serif text-[19px] leading-[1.3] text-ink">
                {current.focus}
              </p>
              <p
                className={
                  "m-0 mt-1.5 text-[12.5px] font-semibold " +
                  (lastCorrect ? "text-c-fund" : "text-c-crit")
                }
              >
                {lastCorrect ? "Correct!" : `You typed "${answer}" — not quite.`}
              </p>
            </div>
          )}

          <div className="mt-[22px] flex flex-wrap items-center justify-between gap-2.5">
            <span className="font-mono text-[11px] text-ink-soft">
              Score: {score} / {results.length}
            </span>
            {!checked ? (
              <button
                type="button"
                onClick={handleCheck}
                disabled={!answer.trim()}
                className="rounded bg-ink px-4 py-2.5 text-[13.5px] font-semibold text-paper transition-opacity hover:opacity-88 disabled:opacity-50"
              >
                Check answer
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="rounded bg-ink px-4 py-2.5 text-[13.5px] font-semibold text-paper transition-opacity hover:opacity-88"
              >
                {index + 1 >= deck.length ? "Finish" : "Next"}
              </button>
            )}
          </div>
        </>
      )}

      {step === "playing" && current && mode === "flip" && (
        <>
          <div className="mb-3 flex items-center justify-between font-mono text-[11px] text-ink-soft">
            <span>
              Card {index + 1} / {deck.length}
            </span>
            <span>
              {current.subject} / {current.topic} / {current.folder}
            </span>
          </div>

          <div
            onClick={() => setRevealed(true)}
            className="flex min-h-[180px] cursor-pointer flex-col justify-center rounded-[3px] px-3.5 py-4 text-sm leading-[1.6] text-ink"
            style={{ background: `${color}1a` }}
          >
            {!revealed ? (
              <>
                {renderMarkdown(
                  redactFocusFromText(current.description, current.focus),
                )}
                <p className="m-0 mt-4 text-center font-mono text-[11px] text-ink-soft">
                  Guess it in your head, then tap to reveal
                </p>
              </>
            ) : (
              <div className="text-center">
                <p className="m-0 mb-1 font-mono text-[10.5px] tracking-[0.08em] text-ink-soft uppercase">
                  {current.topic}
                </p>
                <p className="m-0 font-serif text-[24px] leading-[1.3] text-ink">
                  {current.focus}
                </p>
              </div>
            )}
          </div>

          {revealed && (
            <div className="mt-3.5 text-sm leading-[1.65] text-ink">
              {renderMarkdown(current.description)}
            </div>
          )}

          <div className="mt-[22px] flex flex-wrap items-center justify-between gap-2.5">
            <span className="font-mono text-[11px] text-ink-soft">
              Score: {score} / {results.length}
            </span>
            {!revealed ? (
              <button
                type="button"
                onClick={() => setRevealed(true)}
                className="rounded bg-ink px-4 py-2.5 text-[13.5px] font-semibold text-paper transition-opacity hover:opacity-88"
              >
                Reveal
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleFlipGrade(false)}
                  className="rounded border border-line px-4 py-2.5 text-[13.5px] font-semibold text-c-crit transition-opacity hover:opacity-88"
                >
                  Missed it
                </button>
                <button
                  type="button"
                  onClick={() => handleFlipGrade(true)}
                  className="rounded bg-ink px-4 py-2.5 text-[13.5px] font-semibold text-paper transition-opacity hover:opacity-88"
                >
                  Got it
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {step === "done" && (
        <>
          <h3 className="m-0 pr-6 font-serif text-[19px] text-ink">
            Quiz complete
          </h3>
          <p className="mt-2 mb-1 font-serif text-[28px] text-ink">
            {score} / {deck.length}{" "}
            <span className="font-sans text-[15px] font-normal text-ink-soft">
              ({scorePercent}%)
            </span>
          </p>
          <p className="mt-1 text-[13.5px] text-ink-soft">
            This session isn&apos;t saved, so quiz again anytime.
          </p>
          <div className="mt-[22px] flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-line px-4 py-2.5 text-[13.5px] font-semibold text-ink transition-opacity hover:opacity-88"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => setStep("review")}
              className="rounded border border-line px-4 py-2.5 text-[13.5px] font-semibold text-ink transition-opacity hover:opacity-88"
            >
              Review
            </button>
            <button
              type="button"
              onClick={() => setStep("mode")}
              className="rounded bg-ink px-4 py-2.5 text-[13.5px] font-semibold text-paper transition-opacity hover:opacity-88"
            >
              Quiz again
            </button>
          </div>
        </>
      )}

      {step === "review" && (
        <>
          <h3 className="m-0 pr-6 font-serif text-[19px] text-ink">
            Review — {score} / {deck.length} correct
          </h3>
          <div className="mt-3.5 max-h-[55vh] overflow-y-auto rounded border border-line">
            {results.map((r, i) => (
              <div key={i} className="border-b border-line px-3.5 py-3 last:border-b-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="m-0 font-serif text-[15px] text-ink">{r.card.focus}</p>
                  <span
                    className={
                      "shrink-0 font-mono text-[10.5px] font-semibold uppercase " +
                      (r.correct ? "text-c-fund" : "text-c-crit")
                    }
                  >
                    {r.correct ? "Correct" : "Missed"}
                  </span>
                </div>
                {!r.correct && r.userAnswer && (
                  <p className="m-0 mt-0.5 text-[12px] text-ink-soft">
                    You typed: &ldquo;{r.userAnswer}&rdquo;
                  </p>
                )}
                <p className="m-0 mt-1.5 text-[12.5px] leading-[1.5] text-ink-soft">
                  {r.card.description}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-[22px] flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setStep("done")}
              className="rounded border border-line px-4 py-2.5 text-[13.5px] font-semibold text-ink transition-opacity hover:opacity-88"
            >
              Back
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded bg-ink px-4 py-2.5 text-[13.5px] font-semibold text-paper transition-opacity hover:opacity-88"
            >
              Close
            </button>
          </div>
        </>
      )}
    </ModalShell>
  );
}
