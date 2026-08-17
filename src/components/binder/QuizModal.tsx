"use client";

import { useMemo, useState } from "react";
import { ModalShell } from "@/components/binder/ModalShell";
import { topicColor } from "@/lib/topics";
import { renderMarkdown } from "@/lib/markdown";

export interface QuizCard {
  id: string;
  title: string;
  focus: string;
  description: string;
  topic: string;
  folder: string;
}

interface QuizTopicGroup {
  topic: string;
  folders: { folder: string; count: number }[];
}

interface QuizModalProps {
  title: string;
  cards: QuizCard[];
  onClose: () => void;
}

function folderKey(topic: string, folder: string): string {
  return `${topic} ${folder}`;
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

type Step = "setup" | "playing" | "done";

export function QuizModal({ title, cards, onClose }: QuizModalProps) {
  const groups = useMemo<QuizTopicGroup[]>(() => {
    const byTopic = new Map<string, Map<string, number>>();
    for (const card of cards) {
      if (!byTopic.has(card.topic)) byTopic.set(card.topic, new Map());
      const folders = byTopic.get(card.topic)!;
      folders.set(card.folder, (folders.get(card.folder) ?? 0) + 1);
    }
    return Array.from(byTopic.entries())
      .map(([topic, folders]) => ({
        topic,
        folders: Array.from(folders.entries())
          .map(([folder, count]) => ({ folder, count }))
          .sort((a, b) => a.folder.localeCompare(b.folder)),
      }))
      .sort((a, b) => a.topic.localeCompare(b.topic));
  }, [cards]);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [step, setStep] = useState<Step>("setup");
  const [deck, setDeck] = useState<QuizCard[]>([]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [gotIt, setGotIt] = useState(0);
  const [missed, setMissed] = useState(0);

  function toggleFolder(topic: string, folder: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      const key = folderKey(topic, folder);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleTopic(group: QuizTopicGroup) {
    setSelected((prev) => {
      const next = new Set(prev);
      const keys = group.folders.map((f) => folderKey(group.topic, f.folder));
      const allSelected = keys.every((k) => next.has(k));
      for (const k of keys) {
        if (allSelected) next.delete(k);
        else next.add(k);
      }
      return next;
    });
  }

  function startQuiz() {
    const pool =
      selected.size === 0
        ? cards
        : cards.filter((c) => selected.has(folderKey(c.topic, c.folder)));
    if (pool.length === 0) return;
    setDeck(shuffle(pool));
    setIndex(0);
    setRevealed(false);
    setGotIt(0);
    setMissed(0);
    setStep("playing");
  }

  function mark(correct: boolean) {
    if (correct) setGotIt((n) => n + 1);
    else setMissed((n) => n + 1);
    if (index + 1 >= deck.length) {
      setStep("done");
    } else {
      setIndex((i) => i + 1);
      setRevealed(false);
    }
  }

  const current = deck[index];
  const color = current ? topicColor(current.topic) : "#4A7C59";

  return (
    <ModalShell accentColor={color} onClose={onClose}>
      {step === "setup" && (
        <>
          <h3 className="m-0 font-serif text-[19px] text-ink">Quiz: {title}</h3>
          <p className="mt-1 mb-4 text-[13px] text-ink-soft">
            Pick topics or folders to quiz on, or leave nothing checked to
            quiz on everything.
          </p>
          {groups.length === 0 ? (
            <p className="text-[13.5px] text-ink-soft">
              No flashcards available to quiz on yet.
            </p>
          ) : (
            <div className="max-h-[45vh] overflow-y-auto rounded border border-line">
              {groups.map((group) => {
                const keys = group.folders.map((f) =>
                  folderKey(group.topic, f.folder),
                );
                const allSelected =
                  keys.length > 0 && keys.every((k) => selected.has(k));
                return (
                  <div key={group.topic} className="border-b border-line last:border-b-0">
                    <label className="flex min-h-[40px] cursor-pointer items-center gap-2.5 bg-paper-grid px-3 py-2">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={() => toggleTopic(group)}
                        className="h-3.5 w-3.5"
                      />
                      <span
                        className="h-[9px] w-[9px] shrink-0 rounded-[2px]"
                        style={{ background: topicColor(group.topic) }}
                      />
                      <span className="text-[13px] font-semibold text-ink">
                        {group.topic}
                      </span>
                    </label>
                    {group.folders.map((f) => (
                      <label
                        key={f.folder}
                        className="flex min-h-[36px] cursor-pointer items-center gap-2.5 px-3 py-1.5 pl-9"
                      >
                        <input
                          type="checkbox"
                          checked={selected.has(folderKey(group.topic, f.folder))}
                          onChange={() => toggleFolder(group.topic, f.folder)}
                          className="h-3.5 w-3.5"
                        />
                        <span className="flex-1 truncate text-[12.5px] text-ink-soft">
                          {f.folder}
                        </span>
                        <span className="font-mono text-[10.5px] text-ink-soft opacity-60">
                          {f.count}
                        </span>
                      </label>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
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
              onClick={startQuiz}
              disabled={cards.length === 0}
              className="rounded bg-ink px-4 py-2.5 text-[13.5px] font-semibold text-paper transition-opacity hover:opacity-88 disabled:opacity-50"
            >
              Start quiz
            </button>
          </div>
        </>
      )}

      {step === "playing" && current && (
        <>
          <div className="mb-3 flex items-center justify-between font-mono text-[11px] text-ink-soft">
            <span>
              Card {index + 1} / {deck.length}
            </span>
            <span>
              {current.topic} / {current.folder}
            </span>
          </div>
          <div
            onClick={() => setRevealed(true)}
            className="flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-[3px] px-5 py-8 text-center"
            style={{ background: `${color}1a` }}
          >
            <p className="m-0 mb-1 font-mono text-[10.5px] tracking-[0.08em] text-ink-soft uppercase">
              {current.title}
            </p>
            <p className="m-0 font-serif text-[24px] leading-[1.3] text-ink">
              {current.focus}
            </p>
            {!revealed && (
              <p className="mt-4 font-mono text-[11px] text-ink-soft">
                Tap to reveal
              </p>
            )}
          </div>

          {revealed && (
            <div className="mt-3.5 text-sm leading-[1.65] text-ink">
              {renderMarkdown(current.description)}
            </div>
          )}

          <div className="mt-[22px] flex flex-wrap items-center justify-between gap-2.5">
            <span className="font-mono text-[11px] text-ink-soft">
              ✓ {gotIt} · ✕ {missed}
            </span>
            {revealed ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => mark(false)}
                  className="rounded border border-line px-4 py-2.5 text-[13.5px] font-semibold text-c-crit transition-opacity hover:opacity-88"
                >
                  Missed it
                </button>
                <button
                  type="button"
                  onClick={() => mark(true)}
                  className="rounded bg-ink px-4 py-2.5 text-[13.5px] font-semibold text-paper transition-opacity hover:opacity-88"
                >
                  Got it
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setRevealed(true)}
                className="rounded bg-ink px-4 py-2.5 text-[13.5px] font-semibold text-paper transition-opacity hover:opacity-88"
              >
                Reveal
              </button>
            )}
          </div>
        </>
      )}

      {step === "done" && (
        <>
          <h3 className="m-0 font-serif text-[19px] text-ink">Quiz complete</h3>
          <p className="mt-2 text-[13.5px] text-ink-soft">
            You reviewed {deck.length} card{deck.length === 1 ? "" : "s"} —{" "}
            {gotIt} got it, {missed} missed. This session isn&apos;t saved,
            so quiz again anytime.
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
              onClick={() => setStep("setup")}
              className="rounded bg-ink px-4 py-2.5 text-[13.5px] font-semibold text-paper transition-opacity hover:opacity-88"
            >
              Quiz again
            </button>
          </div>
        </>
      )}
    </ModalShell>
  );
}
