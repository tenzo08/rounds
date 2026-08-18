"use client";

import { useState } from "react";
import { AppSidebarShell } from "@/components/AppSidebarShell";
import { subjectColor } from "@/lib/topics";
import type { SubjectSummaryDTO } from "@/lib/types";

export type ActiveSelection =
  | { type: "all" }
  | { type: "subject"; subject: string }
  | { type: "topic"; subject: string; topic: string }
  | { type: "folder"; subject: string; topic: string; folder: string };

interface SidebarProps {
  selection: ActiveSelection;
  onSelect: (selection: ActiveSelection) => void;
  subjects: SubjectSummaryDTO[];
  allCount: number;
  userName: string;
  userEmail: string;
  userImage: string | null;
  onSignOut: () => void;
  onDropNote?: (
    noteId: string,
    subject: string,
    topic: string,
    folder: string,
  ) => void;
}

function topicKey(subject: string, topic: string): string {
  return `${subject}␟${topic}`;
}

export function Sidebar({
  selection,
  onSelect,
  subjects,
  allCount,
  userName,
  userEmail,
  userImage,
  onSignOut,
  onDropNote,
}: SidebarProps) {
  const activeSubjectName =
    selection.type === "subject" ||
    selection.type === "topic" ||
    selection.type === "folder"
      ? selection.subject
      : null;
  const activeTopicName =
    selection.type === "topic" || selection.type === "folder"
      ? selection.topic
      : null;

  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(
    () => new Set(activeSubjectName ? [activeSubjectName] : []),
  );
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(
    () =>
      new Set(
        activeSubjectName && activeTopicName
          ? [topicKey(activeSubjectName, activeTopicName)]
          : [],
      ),
  );

  function toggleExpandedSubject(name: string) {
    setExpandedSubjects((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  function toggleExpandedTopic(key: string) {
    setExpandedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <AppSidebarShell
      activeNav="binder"
      userName={userName}
      userEmail={userEmail}
      userImage={userImage}
      onSignOut={onSignOut}
    >
      <ul data-tour="sidebar-tree" className="m-0 mt-2 flex list-none flex-col gap-0.5 px-0">
        <Row
          label="All entries"
          count={allCount}
          dot="#8A9199"
          active={selection.type === "all"}
          onClick={() => onSelect({ type: "all" })}
        />
        {subjects.map((s) => {
          const isSubjectExpanded = expandedSubjects.has(s.name);
          const isSubjectActive =
            selection.type === "subject" && selection.subject === s.name;
          return (
            <li key={s.name}>
              <Row
                label={s.name}
                count={s.count}
                dot={subjectColor(s.name)}
                active={isSubjectActive}
                onClick={() => onSelect({ type: "subject", subject: s.name })}
                expandable
                isExpanded={isSubjectExpanded}
                onToggleExpand={() => toggleExpandedSubject(s.name)}
                asListItem={false}
              />
              {isSubjectExpanded && (
                <ul className="m-0 flex list-none flex-col gap-0.5 px-0">
                  {s.topics.map((t) => {
                    const key = topicKey(s.name, t.name);
                    const isTopicExpanded = expandedTopics.has(key);
                    const isTopicActive =
                      selection.type === "topic" &&
                      selection.subject === s.name &&
                      selection.topic === t.name;
                    return (
                      <li key={key}>
                        <TopicRow
                          label={t.name}
                          count={t.count}
                          active={isTopicActive}
                          onClick={() =>
                            onSelect({
                              type: "topic",
                              subject: s.name,
                              topic: t.name,
                            })
                          }
                          isExpanded={isTopicExpanded}
                          onToggleExpand={() => toggleExpandedTopic(key)}
                        />
                        {isTopicExpanded && (
                          <ul className="m-0 flex list-none flex-col gap-0.5 px-0">
                            {t.folders.map((f) => (
                              <FolderRow
                                key={f.name}
                                label={f.name}
                                count={f.count}
                                active={
                                  selection.type === "folder" &&
                                  selection.subject === s.name &&
                                  selection.topic === t.name &&
                                  selection.folder === f.name
                                }
                                onClick={() =>
                                  onSelect({
                                    type: "folder",
                                    subject: s.name,
                                    topic: t.name,
                                    folder: f.name,
                                  })
                                }
                                onDropNote={
                                  onDropNote
                                    ? (noteId) =>
                                        onDropNote(noteId, s.name, t.name, f.name)
                                    : undefined
                                }
                              />
                            ))}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </AppSidebarShell>
  );
}

interface RowProps {
  label: string;
  count: number;
  dot: string;
  active: boolean;
  onClick: () => void;
  expandable?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  asListItem?: boolean;
}

function Row({
  label,
  count,
  dot,
  active,
  onClick,
  expandable,
  isExpanded,
  onToggleExpand,
  asListItem = true,
}: RowProps) {
  const content = (
    <div
      onClick={onClick}
      style={{ "--dot": dot } as React.CSSProperties}
      className={
        "flex min-h-[40px] cursor-pointer items-center gap-2.5 border-l-[3px] py-2.5 pr-[18px] pl-[22px] text-[13.5px] font-medium transition-colors " +
        (active
          ? "rounded-r-md bg-paper font-semibold text-ink border-l-[var(--dot)]"
          : "border-l-transparent text-binder-text hover:bg-binder-soft")
      }
    >
      {expandable && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand?.();
          }}
          aria-label={isExpanded ? "Collapse" : "Expand"}
          className="-ml-1 flex h-5 w-5 shrink-0 items-center justify-center text-[10px] text-binder-text/70"
        >
          {isExpanded ? "▾" : "▸"}
        </button>
      )}
      <span
        className="h-[9px] w-[9px] shrink-0 rounded-[2px]"
        style={{ background: dot }}
      />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <span className="ml-auto shrink-0 font-mono text-[11px] opacity-60">
        {count}
      </span>
    </div>
  );
  return asListItem ? <li>{content}</li> : content;
}

function TopicRow({
  label,
  count,
  active,
  onClick,
  isExpanded,
  onToggleExpand,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={
        "flex min-h-[38px] cursor-pointer items-center gap-2 border-l-[3px] py-2 pr-[18px] pl-[38px] text-[13px] font-medium transition-colors " +
        (active
          ? "rounded-r-md bg-paper font-semibold text-ink border-l-ink/40"
          : "border-l-transparent text-binder-text/90 hover:bg-binder-soft")
      }
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleExpand();
        }}
        aria-label={isExpanded ? "Collapse topic" : "Expand topic"}
        className="-ml-1 flex h-5 w-5 shrink-0 items-center justify-center text-[10px] text-binder-text/70"
      >
        {isExpanded ? "▾" : "▸"}
      </button>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <span className="ml-auto shrink-0 font-mono text-[10.5px] opacity-60">
        {count}
      </span>
    </div>
  );
}

function FolderRow({
  label,
  count,
  active,
  onClick,
  onDropNote,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  onDropNote?: (noteId: string) => void;
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  return (
    <li
      onClick={onClick}
      onDragOver={
        onDropNote
          ? (e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              setIsDragOver(true);
            }
          : undefined
      }
      onDragLeave={onDropNote ? () => setIsDragOver(false) : undefined}
      onDrop={
        onDropNote
          ? (e) => {
              e.preventDefault();
              setIsDragOver(false);
              const noteId = e.dataTransfer.getData("text/plain");
              if (noteId) onDropNote(noteId);
            }
          : undefined
      }
      className={
        "flex min-h-[36px] cursor-pointer items-center gap-2 border-l-[3px] py-2 pr-[18px] pl-[58px] text-[12.5px] transition-colors " +
        (isDragOver
          ? "border-l-ink bg-paper-grid"
          : active
            ? "rounded-r-md bg-paper font-semibold text-ink border-l-ink/40"
            : "border-l-transparent text-binder-text/85 hover:bg-binder-soft")
      }
    >
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <span className="ml-auto shrink-0 font-mono text-[10.5px] opacity-60">
        {count}
      </span>
    </li>
  );
}
