"use client";

import { useState } from "react";
import { ModalShell } from "@/components/binder/ModalShell";
import { bulkShareNotes } from "@/lib/actions/shares";
import type { GroupSummaryDTO } from "@/lib/types";

interface BulkShareModalProps {
  noteIds: string[];
  groups: GroupSummaryDTO[];
  onClose: () => void;
  onShared: () => void;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

export function BulkShareModal({
  noteIds,
  groups,
  onClose,
  onShared,
}: BulkShareModalProps) {
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(
    new Set(),
  );
  const [error, setError] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  function toggleGroup(groupId: string) {
    setSelectedGroupIds((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }

  async function handleShare() {
    if (selectedGroupIds.size === 0) {
      setError("Pick at least one group.");
      return;
    }
    setIsSharing(true);
    setError(null);
    try {
      for (const groupId of selectedGroupIds) {
        await bulkShareNotes(noteIds, groupId);
      }
      onShared();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSharing(false);
    }
  }

  return (
    <ModalShell accentColor="#1E2823" onClose={onClose}>
      <h3 className="m-0 pr-6 font-serif text-[19px] text-ink">
        Share {noteIds.length} flashcard{noteIds.length === 1 ? "" : "s"}
      </h3>
      <p className="mt-1 mb-4 text-[13px] text-ink-soft">
        Members of a checked group can read these cards — only you can edit
        or delete them.
      </p>

      {groups.length === 0 ? (
        <p className="text-sm text-ink-soft">
          You aren&apos;t in any groups yet. Create one from the Groups page
          first.
        </p>
      ) : (
        <ul className="divide-y divide-line rounded border border-line bg-card">
          {groups.map((g) => (
            <li key={g.id} className="flex items-center justify-between gap-3 px-3.5 py-3">
              <span className="min-w-0 truncate text-sm text-ink">{g.name}</span>
              <label className="flex shrink-0 items-center gap-2 text-xs text-ink-soft">
                <input
                  type="checkbox"
                  checked={selectedGroupIds.has(g.id)}
                  onChange={() => toggleGroup(g.id)}
                  className="h-4 w-4"
                />
                Share
              </label>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="mt-3 text-sm text-c-crit">{error}</p>}

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
          onClick={handleShare}
          disabled={isSharing || groups.length === 0}
          className="rounded bg-ink px-4 py-2.5 text-[13.5px] font-semibold text-paper transition-opacity hover:opacity-88 disabled:opacity-50"
        >
          {isSharing ? "Sharing…" : "Share"}
        </button>
      </div>
    </ModalShell>
  );
}
