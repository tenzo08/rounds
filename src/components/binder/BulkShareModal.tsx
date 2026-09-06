"use client";

import { useState } from "react";
import { ModalShell } from "@/components/binder/ModalShell";
import {
  bulkShareNotes,
  finalizeBulkShares,
} from "@/lib/actions/shares";
import {
  createTargetedBatchTasks,
  runSequentialBatches,
  runSequentialBatchTasks,
  type TargetedBatchTask,
} from "@/lib/bulkOperations";
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
  const [pendingTasks, setPendingTasks] = useState<
    TargetedBatchTask<string, string>[] | null
  >(null);
  const [shareProgress, setShareProgress] = useState<{
    completed: number;
    total: number;
  } | null>(null);

  function toggleGroup(groupId: string) {
    if (pendingTasks) return;
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
    const tasks =
      pendingTasks ??
      createTargetedBatchTasks(noteIds, Array.from(selectedGroupIds));
    const total =
      shareProgress?.total ?? noteIds.length * selectedGroupIds.size;
    const completedBefore = shareProgress?.completed ?? 0;
    let completedTasks = 0;
    let completedThisAttempt = 0;
    let allBatchesShared = false;
    const touchedGroupIds = new Set<string>();
    setShareProgress({ completed: completedBefore, total });
    try {
      await runSequentialBatchTasks(
        tasks,
        async ({ target: groupId, items }) => {
          await bulkShareNotes(items, groupId, false);
          touchedGroupIds.add(groupId);
        },
        (completed) => {
          completedTasks += 1;
          completedThisAttempt = completed;
          setShareProgress({ completed: completedBefore + completed, total });
        },
      );
      allBatchesShared = true;
      setPendingTasks([]);
      await runSequentialBatches(Array.from(selectedGroupIds), async (batch) => {
        await finalizeBulkShares(batch);
      });
      onShared();
    } catch (err) {
      const completed = completedBefore + completedThisAttempt;
      setShareProgress({ completed, total });
      setPendingTasks(tasks.slice(completedTasks));
      if (!allBatchesShared && touchedGroupIds.size > 0) {
        try {
          await runSequentialBatches(
            Array.from(touchedGroupIds),
            async (batch) => {
              await finalizeBulkShares(batch);
            },
          );
        } catch {
          // The acknowledged shares remain saved even if refresh fails.
        }
      }
      if (allBatchesShared) {
        setError(
          `All ${total} group-card shares were saved, but the binder could not refresh. Close this window and reload the page.`,
        );
      } else if (completedThisAttempt > 0 || completedBefore > 0) {
        setError(
          `${completed} of ${total} group-card shares were saved. Press Retry remaining to continue.`,
        );
      } else {
        setError(getErrorMessage(err));
      }
    } finally {
      setIsSharing(false);
    }
  }

  return (
    <ModalShell
      accentColor="#1E2823"
      onClose={isSharing ? () => undefined : onClose}
    >
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
            <li
              key={g.id}
              className="flex items-center justify-between gap-3 px-3.5 py-3"
            >
              <span className="min-w-0 truncate text-sm text-ink">{g.name}</span>
              <label className="flex shrink-0 items-center gap-2 text-xs text-ink-soft">
                <input
                  type="checkbox"
                  checked={selectedGroupIds.has(g.id)}
                  disabled={isSharing || pendingTasks !== null}
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

      {isSharing && shareProgress && (
        <div className="mt-3" role="status" aria-live="polite">
          <p className="m-0 text-[12.8px] font-semibold text-ink">
            Sharing {shareProgress.completed} of {shareProgress.total}…
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-paper-grid">
            <div
              className="h-full bg-ink transition-[width] duration-200"
              style={{
                width: `${(shareProgress.completed / shareProgress.total) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      <div className="mt-[22px] flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          disabled={isSharing}
          className="rounded border border-line px-4 py-2.5 text-[13.5px] font-semibold text-ink transition-opacity hover:opacity-88"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={pendingTasks?.length === 0 ? onClose : handleShare}
          disabled={isSharing || groups.length === 0}
          className="rounded bg-ink px-4 py-2.5 text-[13.5px] font-semibold text-paper transition-opacity hover:opacity-88 disabled:opacity-50"
        >
          {isSharing && shareProgress
            ? `Sharing ${shareProgress.completed} of ${shareProgress.total}…`
            : pendingTasks?.length === 0
              ? "Close"
              : pendingTasks
                ? "Retry remaining"
                : "Share"}
        </button>
      </div>
    </ModalShell>
  );
}
