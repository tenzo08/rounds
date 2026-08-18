"use client";

import { useEffect, useState, useTransition } from "react";
import { ModalShell } from "@/components/binder/ModalShell";
import { ConfirmModal } from "@/components/binder/ConfirmModal";
import {
  addMember,
  removeMember,
  renameGroup,
  deleteGroup,
  leaveGroup,
  setMemberRole,
  searchUsersForGroup,
} from "@/lib/actions/groups";
import type { GroupDetailDTO, UserSearchResultDTO } from "@/lib/types";

interface GroupSettingsModalProps {
  group: GroupDetailDTO;
  currentUserId: string;
  onClose: () => void;
  onGroupDeleted: () => void;
  onLeft: () => void;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

type PendingConfirm =
  | { type: "none" }
  | { type: "delete-group" }
  | { type: "leave-group" }
  | { type: "demote-self"; userId: string; nextRole: "admin" | "member" };

export function GroupSettingsModal({
  group,
  currentUserId,
  onClose,
  onGroupDeleted,
  onLeft,
}: GroupSettingsModalProps) {
  const isAdmin = group.currentUserRole === "admin";

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(group.name);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserSearchResultDTO[]>(
    [],
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm>({
    type: "none",
  });

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
    setPendingConfirm({ type: "delete-group" });
  }

  function handleLeaveGroup() {
    setPendingConfirm({ type: "leave-group" });
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
    if (userId === currentUserId && nextRole === "member") {
      setPendingConfirm({ type: "demote-self", userId, nextRole });
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
    <>
    <ModalShell accentColor="#1E2823" onClose={onClose}>
      <div className="flex flex-wrap items-start justify-between gap-3">
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
              className="rounded border border-line bg-card px-2.5 py-1 font-serif text-lg text-ink outline-none focus:border-ink"
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
          <h3 className="m-0 min-w-0 font-serif text-lg text-ink">
            {group.name} settings
            {isAdmin && (
              <button
                type="button"
                onClick={() => setIsEditingName(true)}
                className="ml-2.5 align-middle font-mono text-[11px] font-normal text-ink-soft hover:text-ink"
              >
                rename
              </button>
            )}
          </h3>
        )}
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={handleLeaveGroup}
            disabled={isPending}
            className="min-h-[36px] rounded border border-c-crit/40 px-3 text-xs font-semibold text-c-crit transition-colors hover:border-c-crit hover:bg-c-crit/5 disabled:opacity-50"
          >
            Leave group
          </button>
          {isAdmin && (
            <button
              type="button"
              onClick={handleDeleteGroup}
              disabled={isPending}
              className="min-h-[36px] rounded bg-c-crit px-3 text-xs font-semibold text-white transition-opacity hover:opacity-88 disabled:opacity-50"
            >
              Delete group
            </button>
          )}
        </div>
      </div>

      <p className="mt-1 text-[13px] text-ink-soft">
        {group.members.length} {group.members.length === 1 ? "member" : "members"}{" "}
        · {isAdmin ? "You are an admin" : "You are a member"}
      </p>

      {error && <p className="mt-3 text-sm text-c-crit">{error}</p>}

      {isAdmin && (
        <div className="mt-4">
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
                    <p className="m-0 truncate text-sm text-ink">{u.name}</p>
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

      <h4 className="m-0 mt-5 mb-2 font-mono text-[11px] tracking-[0.08em] text-ink-soft uppercase">
        Members
      </h4>
      <ul className="max-h-[40vh] divide-y divide-line overflow-y-auto rounded border border-line bg-card">
        {group.members.map((m) => (
          <li
            key={m.userId}
            className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
          >
            <div className="flex min-w-0 items-center gap-3">
              {m.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={m.image}
                  alt=""
                  className="h-8 w-8 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-paper-grid text-xs font-semibold text-ink-soft">
                  {m.name.slice(0, 1).toUpperCase()}
                </div>
              )}
              <p className="m-0 truncate text-sm text-ink">
                {m.name} {m.userId === currentUserId && "(you)"}
              </p>
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
                    className="min-h-[36px] rounded border border-line px-2.5 text-xs font-medium text-ink hover:bg-paper-grid disabled:opacity-50"
                  >
                    {m.role === "admin" ? "Demote" : "Promote"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(m.userId)}
                    disabled={isPending}
                    className="min-h-[36px] rounded border border-line px-2.5 text-xs font-medium text-c-crit hover:bg-paper-grid disabled:opacity-50"
                  >
                    Remove
                  </button>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-[22px] flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="rounded border border-line px-4 py-2.5 text-[13.5px] font-semibold text-ink transition-opacity hover:opacity-88"
        >
          Close
        </button>
      </div>
    </ModalShell>

    {pendingConfirm.type === "delete-group" && (
      <ConfirmModal
        title="Delete group"
        message={`Delete "${group.name}"? This cannot be undone.`}
        onClose={() => setPendingConfirm({ type: "none" })}
        onConfirm={async () => {
          await deleteGroup(group.id);
          onGroupDeleted();
        }}
      />
    )}

    {pendingConfirm.type === "leave-group" && (
      <ConfirmModal
        title="Leave group"
        message={`Leave "${group.name}"? You can rejoin only if someone adds you back.`}
        confirmLabel="Leave"
        isDestructive={false}
        onClose={() => setPendingConfirm({ type: "none" })}
        onConfirm={async () => {
          await leaveGroup(group.id);
          onLeft();
        }}
      />
    )}

    {pendingConfirm.type === "demote-self" && (
      <ConfirmModal
        title="Give up admin rights"
        message="Give up your admin rights in this group? You'll keep read/write access to your own notes, but won't be able to manage members or rename/delete the group unless another admin promotes you again."
        confirmLabel="Give up admin"
        isDestructive={false}
        onClose={() => setPendingConfirm({ type: "none" })}
        onConfirm={async () => {
          await setMemberRole(group.id, pendingConfirm.userId, pendingConfirm.nextRole);
        }}
      />
    )}
    </>
  );
}
