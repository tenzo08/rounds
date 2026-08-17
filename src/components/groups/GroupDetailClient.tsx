"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { GroupsSidebar } from "@/components/groups/GroupsSidebar";
import { GroupSettingsModal } from "@/components/groups/GroupSettingsModal";
import { NoteCard } from "@/components/binder/NoteCard";
import { TileGrid } from "@/components/binder/TileGrid";
import { GroupNoteViewModal } from "@/components/groups/GroupNoteViewModal";
import { QuizModal, type QuizCard } from "@/components/binder/QuizModal";
import { IdleLogout } from "@/components/IdleLogout";
import { signOutAction } from "@/lib/actions/auth";
import { topicColor } from "@/lib/topics";
import type {
  GroupDetailDTO,
  GroupFeedNoteDTO,
  GroupSummaryDTO,
} from "@/lib/types";

interface GroupDetailClientProps {
  group: GroupDetailDTO;
  groups: GroupSummaryDTO[];
  feedNotes: GroupFeedNoteDTO[];
  currentUserId: string;
  userName: string;
  userEmail: string;
  userImage: string | null;
}

type GroupSelection =
  | { type: "all" }
  | { type: "topic"; topic: string }
  | { type: "folder"; topic: string; folder: string };

export function GroupDetailClient({
  group,
  groups,
  feedNotes,
  currentUserId,
  userName,
  userEmail,
  userImage,
}: GroupDetailClientProps) {
  const router = useRouter();

  const [viewingFeedNoteId, setViewingFeedNoteId] = useState<string | null>(
    null,
  );
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [selection, setSelection] = useState<GroupSelection>({ type: "all" });

  const viewingFeedNote =
    feedNotes.find((n) => n.id === viewingFeedNoteId) ?? null;

  const quizCards: QuizCard[] = feedNotes.map((n) => ({
    id: n.id,
    title: n.title,
    focus: n.focus,
    description: n.description,
    topic: n.topic,
    folder: n.folder,
  }));

  // Notes are shared in from many different owners' personal topic/folder
  // structures — there's no shared Topic/Folder table to join against here,
  // so the browsing tree is built straight from whatever topic/folder names
  // are already attached to each shared note.
  const topicTree = useMemo(() => {
    const byTopic = new Map<string, Map<string, number>>();
    for (const note of feedNotes) {
      if (!byTopic.has(note.topic)) byTopic.set(note.topic, new Map());
      const folders = byTopic.get(note.topic)!;
      folders.set(note.folder, (folders.get(note.folder) ?? 0) + 1);
    }
    return Array.from(byTopic.entries())
      .map(([topic, folders]) => ({
        topic,
        count: Array.from(folders.values()).reduce((a, b) => a + b, 0),
        folders: Array.from(folders.entries())
          .map(([folder, count]) => ({ folder, count }))
          .sort((a, b) => a.folder.localeCompare(b.folder)),
      }))
      .sort((a, b) => a.topic.localeCompare(b.topic));
  }, [feedNotes]);

  const visibleNotes =
    selection.type === "folder"
      ? feedNotes.filter(
          (n) => n.topic === selection.topic && n.folder === selection.folder,
        )
      : [];

  return (
    <div className="flex h-dvh flex-col overflow-hidden md:flex-row">
      <IdleLogout />
      <GroupsSidebar
        groups={groups}
        activeGroupId={group.id}
        userName={userName}
        userEmail={userEmail}
        userImage={userImage}
        onSignOut={() => {
          void signOutAction();
        }}
      />

      <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0 px-4 pt-6 md:px-10 md:pt-8.5">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-5">
          <div className="min-w-0">
            <h2 className="m-0 mb-1 font-serif text-[22px] text-ink">
              {group.name}
            </h2>
            <p className="m-0 text-[13.5px] text-ink-soft">
              {group.members.length}{" "}
              {group.members.length === 1 ? "member" : "members"} ·{" "}
              {group.currentUserRole === "admin"
                ? "You are an admin"
                : "You are a member"}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => setIsQuizOpen(true)}
              className="min-h-[44px] rounded border border-line px-4 py-2.5 text-[13.5px] font-semibold text-ink transition-opacity hover:opacity-88"
            >
              Quiz
            </button>
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="min-h-[44px] rounded border border-line px-4 py-2.5 text-[13.5px] font-semibold text-ink transition-opacity hover:opacity-88"
            >
              Settings
            </button>
          </div>
        </div>

        {selection.type !== "all" && (
          <div className="mb-2 flex items-center gap-1.5 font-mono text-[11px] text-ink-soft">
            <button
              type="button"
              onClick={() => setSelection({ type: "all" })}
              className="hover:text-ink hover:underline"
            >
              All topics
            </button>
            {selection.type === "folder" && (
              <>
                <span>/</span>
                <button
                  type="button"
                  onClick={() => setSelection({ type: "topic", topic: selection.topic })}
                  className="hover:text-ink hover:underline"
                >
                  {selection.topic}
                </button>
              </>
            )}
            <span>/</span>
            <span className="text-ink">
              {selection.type === "topic" ? selection.topic : selection.folder}
            </span>
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-14 md:px-10">
        {feedNotes.length === 0 ? (
          <p className="text-[13.5px] text-ink-soft">
            No notes shared into this group yet.
          </p>
        ) : selection.type === "all" ? (
          <TileGrid
            countLabel="cards"
            items={topicTree.map((t) => ({
              key: t.topic,
              label: t.topic,
              count: t.count,
              color: topicColor(t.topic),
            }))}
            onSelect={(topic) => setSelection({ type: "topic", topic })}
          />
        ) : selection.type === "topic" ? (
          <TileGrid
            countLabel="cards"
            items={
              topicTree
                .find((t) => t.topic === selection.topic)
                ?.folders.map((f) => ({
                  key: f.folder,
                  label: f.folder,
                  count: f.count,
                  color: topicColor(selection.topic),
                })) ?? []
            }
            onSelect={(folder) =>
              setSelection({ type: "folder", topic: selection.topic, folder })
            }
          />
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-[18px]">
            {visibleNotes.map((note) => (
              <NoteCard
                key={note.id}
                id={note.id}
                note={note}
                author={{ name: note.authorName, image: note.authorImage }}
                onClick={() => setViewingFeedNoteId(note.id)}
              />
            ))}
          </div>
        )}
      </div>
      </main>

      {viewingFeedNote && (
        <GroupNoteViewModal
          note={viewingFeedNote}
          onClose={() => setViewingFeedNoteId(null)}
        />
      )}

      {isQuizOpen && (
        <QuizModal
          title={group.name}
          cards={quizCards}
          onClose={() => setIsQuizOpen(false)}
        />
      )}

      {isSettingsOpen && (
        <GroupSettingsModal
          group={group}
          currentUserId={currentUserId}
          onClose={() => setIsSettingsOpen(false)}
          onGroupDeleted={() => router.push("/groups")}
        />
      )}
    </div>
  );
}
