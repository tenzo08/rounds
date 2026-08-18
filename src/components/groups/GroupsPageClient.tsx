"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GroupsSidebar } from "@/components/groups/GroupsSidebar";
import { CreateGroupModal } from "@/components/groups/CreateGroupModal";
import { signOutAction } from "@/lib/actions/auth";
import { createGroup } from "@/lib/actions/groups";
import type { GroupSummaryDTO } from "@/lib/types";

interface GroupsPageClientProps {
  groups: GroupSummaryDTO[];
  userName: string;
  userEmail: string;
  userImage: string | null;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

export function GroupsPageClient({
  groups,
  userName,
  userEmail,
  userImage,
}: GroupsPageClientProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCreate(name: string) {
    startTransition(async () => {
      try {
        const { id } = await createGroup(name);
        setIsModalOpen(false);
        router.push(`/groups/${id}`);
      } catch (err) {
        setError(getErrorMessage(err));
      }
    });
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <GroupsSidebar
        groups={groups}
        activeGroupId={null}
        userName={userName}
        userEmail={userEmail}
        userImage={userImage}
        onSignOut={() => {
          void signOutAction();
        }}
      />

      <main className="flex-1 px-4 pt-6 pb-14 md:px-10 md:pt-8.5">
        <div className="mb-6.5 flex flex-wrap items-end justify-between gap-5">
          <div>
            <h2 className="m-0 mb-1 font-serif text-[22px] text-ink">
              Groups
            </h2>
            <p className="m-0 text-[13.5px] text-ink-soft">
              Study groups and clinical cohorts you belong to.
            </p>
          </div>
          <button
            type="button"
            data-tour="create-group-button"
            onClick={() => setIsModalOpen(true)}
            className="rounded bg-ink px-4 py-2.5 text-[13.5px] font-semibold text-paper transition-opacity hover:opacity-88"
          >
            + New group
          </button>
        </div>

        {error && <p className="mb-4 text-sm text-c-crit">{error}</p>}

        {groups.length === 0 ? (
          <div className="py-[70px] text-center text-ink-soft">
            <h3 className="m-0 mb-2 font-serif text-[19px] text-ink">
              No groups yet
            </h3>
            <p className="m-0 text-[13.5px]">
              Create a group to start sharing notes with classmates.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-[18px]">
            {groups.map((g) => (
              <Link
                key={g.id}
                href={`/groups/${g.id}`}
                className="block rounded-[3px] border border-line bg-card px-4 pt-4 pb-3.5 shadow-[0_1px_0_rgba(0,0,0,0.04)] transition-[transform,box-shadow] duration-150 ease-out motion-reduce:transition-none motion-safe:hover:-translate-y-[3px] motion-safe:hover:shadow-[0_10px_20px_rgba(30,40,35,0.12)]"
              >
                <div className="mb-2 font-mono text-[10px] font-medium tracking-[0.08em] text-ink-soft uppercase">
                  {g.role === "admin" ? "Admin" : "Member"}
                </div>
                <h3 className="m-0 mb-2 font-serif text-[16.5px] leading-[1.3] text-ink">
                  {g.name}
                </h3>
                <p className="m-0 text-[12.8px] text-ink-soft">
                  {g.memberCount} {g.memberCount === 1 ? "member" : "members"}
                </p>
              </Link>
            ))}
          </div>
        )}
      </main>

      {isModalOpen && (
        <CreateGroupModal
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleCreate}
          isSaving={isPending}
        />
      )}
    </div>
  );
}
