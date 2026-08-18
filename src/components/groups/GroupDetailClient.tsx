"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { GroupsSidebar } from "@/components/groups/GroupsSidebar";
import { GroupSettingsModal } from "@/components/groups/GroupSettingsModal";
import { NoteCard } from "@/components/binder/NoteCard";
import { TileGrid } from "@/components/binder/TileGrid";
import { GroupNoteViewModal } from "@/components/groups/GroupNoteViewModal";
import { QuizModal, type QuizCard } from "@/components/binder/QuizModal";
import { GroupAutoRefresh } from "@/components/groups/GroupAutoRefresh";
import { IdleLogout } from "@/components/IdleLogout";
import { signOutAction } from "@/lib/actions/auth";
import { subjectColor } from "@/lib/topics";
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
  | { type: "subject"; subject: string }
  | { type: "topic"; subject: string; topic: string }
  | { type: "folder"; subject: string; topic: string; folder: string };

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
    focus: n.focus,
    description: n.description,
    subject: n.subject,
    topic: n.topic,
    folder: n.folder,
  }));

  // Notes are shared in from many different owners' personal subject/topic/
  // folder structures — there's no shared Subject/Topic/Folder table to join
  // against here, so the browsing tree is built straight from whatever
  // subject/topic/folder names are already attached to each shared note.
  const subjectTree = useMemo(() => {
    const bySubject = new Map<string, Map<string, Map<string, number>>>();
    for (const note of feedNotes) {
      if (!bySubject.has(note.subject)) bySubject.set(note.subject, new Map());
      const topics = bySubject.get(note.subject)!;
      if (!topics.has(note.topic)) topics.set(note.topic, new Map());
      const folders = topics.get(note.topic)!;
      folders.set(note.folder, (folders.get(note.folder) ?? 0) + 1);
    }
    return Array.from(bySubject.entries())
      .map(([subject, topics]) => ({
        subject,
        count: Array.from(topics.values()).reduce(
          (sum, folders) =>
            sum + Array.from(folders.values()).reduce((a, b) => a + b, 0),
          0,
        ),
        topics: Array.from(topics.entries())
          .map(([topic, folders]) => ({
            topic,
            count: Array.from(folders.values()).reduce((a, b) => a + b, 0),
            folders: Array.from(folders.entries())
              .map(([folder, count]) => ({ folder, count }))
              .sort((a, b) => a.folder.localeCompare(b.folder)),
          }))
          .sort((a, b) => a.topic.localeCompare(b.topic)),
      }))
      .sort((a, b) => a.subject.localeCompare(b.subject));
  }, [feedNotes]);

  const visibleNotes =
    selection.type === "folder"
      ? feedNotes.filter(
          (n) =>
            n.subject === selection.subject &&
            n.topic === selection.topic &&
            n.folder === selection.folder,
        )
      : [];

  return (
    <div className="flex h-dvh flex-col overflow-hidden md:flex-row">
      <IdleLogout />
      <GroupAutoRefresh groupId={group.id} />
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
      <div className="shrink-0 px-4 pt-4 md:px-10 md:pt-8.5">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-3 md:gap-5">
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
          <div className="flex shrink-0 gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setIsQuizOpen(true)}
              className="min-h-[34px] rounded border border-line px-2.5 py-1.5 text-[12px] font-semibold text-ink transition-opacity hover:opacity-88 sm:min-h-[44px] sm:px-4 sm:py-2.5 sm:text-[13.5px]"
            >
              Quiz
            </button>
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="min-h-[34px] rounded border border-line px-2.5 py-1.5 text-[12px] font-semibold text-ink transition-opacity hover:opacity-88 sm:min-h-[44px] sm:px-4 sm:py-2.5 sm:text-[13.5px]"
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
              All subjects
            </button>
            {(selection.type === "topic" || selection.type === "folder") && (
              <>
                <span>/</span>
                <button
                  type="button"
                  onClick={() =>
                    setSelection({ type: "subject", subject: selection.subject })
                  }
                  className="hover:text-ink hover:underline"
                >
                  {selection.subject}
                </button>
              </>
            )}
            {selection.type === "folder" && (
              <>
                <span>/</span>
                <button
                  type="button"
                  onClick={() =>
                    setSelection({
                      type: "topic",
                      subject: selection.subject,
                      topic: selection.topic,
                    })
                  }
                  className="hover:text-ink hover:underline"
                >
                  {selection.topic}
                </button>
              </>
            )}
            <span>/</span>
            <span className="text-ink">
              {selection.type === "subject"
                ? selection.subject
                : selection.type === "topic"
                  ? selection.topic
                  : selection.folder}
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
            items={subjectTree.map((s) => ({
              key: s.subject,
              label: s.subject,
              count: s.count,
              color: subjectColor(s.subject),
            }))}
            onSelect={(subject) => setSelection({ type: "subject", subject })}
          />
        ) : selection.type === "subject" ? (
          <TileGrid
            countLabel="cards"
            items={
              subjectTree
                .find((s) => s.subject === selection.subject)
                ?.topics.map((t) => ({
                  key: t.topic,
                  label: t.topic,
                  count: t.count,
                  color: subjectColor(selection.subject),
                })) ?? []
            }
            onSelect={(topic) =>
              setSelection({ type: "topic", subject: selection.subject, topic })
            }
          />
        ) : selection.type === "topic" ? (
          <TileGrid
            countLabel="cards"
            items={
              subjectTree
                .find((s) => s.subject === selection.subject)
                ?.topics.find((t) => t.topic === selection.topic)
                ?.folders.map((f) => ({
                  key: f.folder,
                  label: f.folder,
                  count: f.count,
                  color: subjectColor(selection.subject),
                })) ?? []
            }
            onSelect={(folder) =>
              setSelection({
                type: "folder",
                subject: selection.subject,
                topic: selection.topic,
                folder,
              })
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
          onLeft={() => router.push("/groups")}
        />
      )}
    </div>
  );
}
