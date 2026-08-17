"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GroupsSidebar } from "@/components/groups/GroupsSidebar";
import { GroupSettingsModal } from "@/components/groups/GroupSettingsModal";
import { NoteCard } from "@/components/binder/NoteCard";
import { GroupNoteViewModal } from "@/components/groups/GroupNoteViewModal";
import { QuizModal, type QuizCard } from "@/components/binder/QuizModal";
import { signOutAction } from "@/lib/actions/auth";
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

  return (
    <div className="flex h-dvh flex-col overflow-hidden md:flex-row">
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
        <div className="mb-6.5 flex flex-wrap items-start justify-between gap-5">
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
              className="rounded border border-line px-4 py-2.5 text-[13.5px] font-semibold text-ink transition-opacity hover:opacity-88"
            >
              Quiz
            </button>
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="rounded border border-line px-4 py-2.5 text-[13.5px] font-semibold text-ink transition-opacity hover:opacity-88"
            >
              Settings
            </button>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-14 md:px-10">
        {feedNotes.length === 0 ? (
          <p className="text-[13.5px] text-ink-soft">
            No notes shared into this group yet.
          </p>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-[18px]">
            {feedNotes.map((note) => (
              <NoteCard
                key={note.id}
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
