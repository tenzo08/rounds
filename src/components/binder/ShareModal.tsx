"use client";

import { useEffect, useState, useTransition } from "react";
import { ModalShell } from "@/components/binder/ModalShell";
import { getShareableGroups, setNoteShare } from "@/lib/actions/shares";
import type { ShareableGroupDTO } from "@/lib/types";

interface ShareModalProps {
  noteId: string;
  accentColor: string;
  onClose: () => void;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

export function ShareModal({ noteId, accentColor, onClose }: ShareModalProps) {
  const [groups, setGroups] = useState<ShareableGroupDTO[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    getShareableGroups(noteId)
      .then(setGroups)
      .catch((err) => setError(getErrorMessage(err)));
  }, [noteId]);

  function handleToggle(groupId: string, nextShared: boolean) {
    setGroups((prev) =>
      prev
        ? prev.map((g) =>
            g.groupId === groupId ? { ...g, shared: nextShared } : g,
          )
        : prev,
    );
    startTransition(async () => {
      try {
        await setNoteShare(noteId, groupId, nextShared);
      } catch (err) {
        setError(getErrorMessage(err));
        setGroups((prev) =>
          prev
            ? prev.map((g) =>
                g.groupId === groupId ? { ...g, shared: !nextShared } : g,
              )
            : prev,
        );
      }
    });
  }

  return (
    <ModalShell accentColor={accentColor} onClose={onClose}>
      <h3 className="m-0 font-serif text-[19px] text-ink">
        Share into a group
      </h3>
      <p className="mt-1.5 mb-4 text-[13px] text-ink-soft">
        Members of a checked group can read this note — only you can edit or
        delete it.
      </p>

      {error && <p className="mb-3 text-sm text-c-crit">{error}</p>}

      {groups === null ? (
        <p className="text-sm text-ink-soft">Loading your groups…</p>
      ) : groups.length === 0 ? (
        <p className="text-sm text-ink-soft">
          You aren&apos;t in any groups yet. Create one from the Groups page
          first.
        </p>
      ) : (
        <ul className="divide-y divide-line rounded border border-line bg-card">
          {groups.map((g) => (
            <li
              key={g.groupId}
              className="flex items-center justify-between gap-3 px-3.5 py-3"
            >
              <span className="min-w-0 truncate text-sm text-ink">
                {g.groupName}
              </span>
              <label className="flex shrink-0 items-center gap-2 text-xs text-ink-soft">
                <input
                  type="checkbox"
                  checked={g.shared}
                  disabled={isPending}
                  onChange={(e) => handleToggle(g.groupId, e.target.checked)}
                  className="h-4 w-4"
                />
                Shared
              </label>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-[22px] flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="rounded border border-line px-4 py-2.5 text-[13.5px] font-semibold text-ink transition-opacity hover:opacity-88"
        >
          Done
        </button>
      </div>
    </ModalShell>
  );
}
