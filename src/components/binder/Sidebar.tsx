"use client";

import { useState } from "react";
import { AppSidebarShell } from "@/components/AppSidebarShell";
import { topicColor } from "@/lib/topics";
import type { TopicSummaryDTO } from "@/lib/types";

export type ActiveSelection =
  | { type: "all" }
  | { type: "topic"; topic: string }
  | { type: "folder"; topic: string; folder: string };

interface SidebarProps {
  selection: ActiveSelection;
  onSelect: (selection: ActiveSelection) => void;
  topics: TopicSummaryDTO[];
  allCount: number;
  userName: string;
  userEmail: string;
  userImage: string | null;
  onSignOut: () => void;
}

export function Sidebar({
  selection,
  onSelect,
  topics,
  allCount,
  userName,
  userEmail,
  userImage,
  onSignOut,
}: SidebarProps) {
  const activeTopicName =
    selection.type === "topic" || selection.type === "folder"
      ? selection.topic
      : null;
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(activeTopicName ? [activeTopicName] : []),
  );

  function toggleExpanded(name: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
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
      <ul className="m-0 mt-2 flex list-none flex-col gap-0.5 px-0">
        <Row
          label="All entries"
          count={allCount}
          dot="#8A9199"
          active={selection.type === "all"}
          onClick={() => onSelect({ type: "all" })}
        />
        {topics.map((t) => {
          const isExpanded = expanded.has(t.name);
          const isTopicActive =
            selection.type === "topic" && selection.topic === t.name;
          return (
            <li key={t.name}>
              <Row
                label={t.name}
                count={t.count}
                dot={topicColor(t.name)}
                active={isTopicActive}
                onClick={() => onSelect({ type: "topic", topic: t.name })}
                expandable
                isExpanded={isExpanded}
                onToggleExpand={() => toggleExpanded(t.name)}
                asListItem={false}
              />
              {isExpanded && (
                <ul className="m-0 flex list-none flex-col gap-0.5 px-0">
                  {t.folders.map((f) => (
                    <FolderRow
                      key={f.name}
                      label={f.name}
                      count={f.count}
                      active={
                        selection.type === "folder" &&
                        selection.topic === t.name &&
                        selection.folder === f.name
                      }
                      onClick={() =>
                        onSelect({ type: "folder", topic: t.name, folder: f.name })
                      }
                    />
                  ))}
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
          aria-label={isExpanded ? "Collapse topic" : "Expand topic"}
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

function FolderRow({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <li
      onClick={onClick}
      className={
        "flex min-h-[36px] cursor-pointer items-center gap-2 border-l-[3px] py-2 pr-[18px] pl-[42px] text-[12.5px] transition-colors " +
        (active
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
