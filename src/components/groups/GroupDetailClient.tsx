"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { GroupsSidebar } from "@/components/groups/GroupsSidebar";
import { NoteCard } from "@/components/binder/NoteCard";
import { GroupNoteViewModal } from "@/components/groups/GroupNoteViewModal";
import {
  addMember,
  removeMember,
  renameGroup,
  deleteGroup,
  setMemberRole,
  searchUsersForGroup,
} from "@/lib/actions/groups";
import { signOutAction } from "@/lib/actions/auth";
import type {
  GroupDetailDTO,
  GroupFeedNoteDTO,
  GroupSummaryDTO,
  UserSearchResultDTO,
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

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
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
  const isAdmin = group.currentUserRole === "admin";

  const [viewingFeedNoteId, setViewingFeedNoteId] = useState<string | null>(
    null,
  );
  const viewingFeedNote =
    feedNotes.find((n) => n.id === viewingFeedNoteId) ?? null;

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(group.name);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserSearchResultDTO[]>(
    [],
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const trimmedQuery = searchQuery.trim();
  const visibleResults = trimmedQuery.length >= 2 ? searchResults : [];

  useEffect(() => {
    if (!isAdmin || trimmedQuery.length < 2) {
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      searchUsersForGroup(group.id, trimmedQuery)
        .then((results) => {
          if (!cancelled) setSearchResults(results);
        })
        .catch((err) => {
          if (!cancelled) setError(getErrorMessage(err));
        });
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [trimmedQuery, isAdmin, group.id]);

  function handleRename() {
    const trimmed = nameDraft.trim();
    if (!trimmed || trimmed === group.name) {
      setIsEditingName(false);
      setNameDraft(group.name);
      return;
    }
    startTransition(async () => {
      try {
        await renameGroup(group.id, trimmed);
        setIsEditingName(false);
      } catch (err) {
        setError(getErrorMessage(err));
      }
    });
  }

  function handleDeleteGroup() {
    if (!window.confirm(`Delete "${group.name}"? This cannot be undone.`)) {
      return;
    }
    startTransition(async () => {
      try {
        await deleteGroup(group.id);
        router.push("/groups");
      } catch (err) {
        setError(getErrorMessage(err));
      }
    });
  }

  function handleAddMember(userId: string) {
    startTransition(async () => {
      try {
        await addMember(group.id, userId);
        setSearchQuery("");
        setSearchResults([]);
      } catch (err) {
        setError(getErrorMessage(err));
      }
    });
  }

  function handleRemoveMember(userId: string) {
    startTransition(async () => {
      try {
        await removeMember(group.id, userId);
      } catch (err) {
        setError(getErrorMessage(err));
      }
    });
  }

  function handleToggleRole(userId: string, currentRole: "admin" | "member") {
    const nextRole = currentRole === "admin" ? "member" : "admin";
    if (
      userId === currentUserId &&
      nextRole === "member" &&
      !window.confirm(
        "Give up your admin rights in this group? You'll keep read/write access to your own notes, but won't be able to manage members or rename/delete the group unless another admin promotes you again.",
      )
    ) {
      return;
    }
    startTransition(async () => {
      try {
        await setMemberRole(group.id, userId, nextRole);
      } catch (err) {
        setError(getErrorMessage(err));
      }
    });
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
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

      <main className="flex-1 px-4 pt-6 pb-14 md:px-10 md:pt-8.5">
        <div className="mb-6.5 flex flex-wrap items-start justify-between gap-5">
          <div className="min-w-0">
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  type="text"
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRename();
                    if (e.key === "Escape") {
                      setIsEditingName(false);
                      setNameDraft(group.name);
                    }
                  }}
                  className="rounded border border-line bg-card px-2.5 py-1 font-serif text-[22px] text-ink outline-none focus:border-ink"
                />
                <button
                  type="button"
                  onClick={handleRename}
                  className="rounded bg-ink px-3 py-1.5 text-xs font-semibold text-paper"
                >
                  Save
                </button>
              </div>
            ) : (
              <h2 className="m-0 mb-1 font-serif text-[22px] text-ink">
                {group.name}
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setIsEditingName(true)}
                    className="ml-2.5 align-middle font-mono text-[11px] font-normal text-ink-soft hover:text-ink"
                  >
                    rename
                  </button>
                )}
              </h2>
            )}
            <p className="m-0 text-[13.5px] text-ink-soft">
              {group.members.length}{" "}
              {group.members.length === 1 ? "member" : "members"} ·{" "}
              {isAdmin ? "You are an admin" : "You are a member"}
            </p>
          </div>
          {isAdmin && (
            <button
              type="button"
              onClick={handleDeleteGroup}
              disabled={isPending}
              className="rounded bg-c-crit px-4 py-2.5 text-[13.5px] font-semibold text-white transition-opacity hover:opacity-88 disabled:opacity-50"
            >
              Delete group
            </button>
          )}
        </div>

        {error && <p className="mb-4 text-sm text-c-crit">{error}</p>}

        <h3 className="m-0 mb-3 font-mono text-[11px] tracking-[0.08em] text-ink-soft uppercase">
          Shared notes
        </h3>
        {feedNotes.length === 0 ? (
          <p className="mb-8 text-[13.5px] text-ink-soft">
            No notes shared into this group yet.
          </p>
        ) : (
          <div className="mb-8 grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-[18px]">
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

        <h3 className="m-0 mb-3 font-mono text-[11px] tracking-[0.08em] text-ink-soft uppercase">
          Members
        </h3>

        {isAdmin && (
          <div className="mb-8 max-w-md">
            <label className="mb-1.5 block font-mono text-[10.5px] tracking-[0.08em] text-ink-soft uppercase">
              Add a member
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email…"
              className="w-full rounded border border-line bg-card px-3 py-2.5 font-sans text-sm text-ink outline-none focus:border-ink"
            />
            {visibleResults.length > 0 && (
              <ul className="mt-2 divide-y divide-line rounded border border-line bg-card">
                {visibleResults.map((u) => (
                  <li
                    key={u.id}
                    className="flex items-center justify-between gap-3 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="m-0 truncate text-sm text-ink">
                        {u.name}
                      </p>
                      <p className="m-0 truncate text-xs text-ink-soft">
                        {u.email}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddMember(u.id)}
                      disabled={isPending}
                      className="shrink-0 rounded border border-line px-3 py-1.5 text-xs font-semibold text-ink hover:bg-paper-grid disabled:opacity-50"
                    >
                      Add
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <ul className="max-w-md divide-y divide-line rounded border border-line bg-card">
          {group.members.map((m) => (
            <li
              key={m.userId}
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                {m.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.image}
                    alt=""
                    className="h-8 w-8 shrink-0 rounded-full"
                  />
                ) : (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-paper-grid text-xs font-semibold text-ink-soft">
                    {m.name.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="m-0 truncate text-sm text-ink">
                    {m.name} {m.userId === currentUserId && "(you)"}
                  </p>
                  <p className="m-0 truncate text-xs text-ink-soft">
                    {m.email}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="rounded-[3px] bg-paper-grid px-[7px] py-[3px] font-mono text-[10px] text-ink-soft uppercase">
                  {m.role}
                </span>
                {isAdmin && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleToggleRole(m.userId, m.role)}
                      disabled={isPending}
                      className="rounded border border-line px-2.5 py-1 text-xs font-medium text-ink hover:bg-paper-grid disabled:opacity-50"
                    >
                      {m.role === "admin" ? "Demote" : "Promote"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(m.userId)}
                      disabled={isPending}
                      className="rounded border border-line px-2.5 py-1 text-xs font-medium text-c-crit hover:bg-paper-grid disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      </main>

      {viewingFeedNote && (
        <GroupNoteViewModal
          note={viewingFeedNote}
          onClose={() => setViewingFeedNoteId(null)}
        />
      )}
    </div>
  );
}
