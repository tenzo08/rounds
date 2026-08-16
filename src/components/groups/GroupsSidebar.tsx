import Link from "next/link";
import { AppSidebarShell } from "@/components/AppSidebarShell";
import type { GroupSummaryDTO } from "@/lib/types";

interface GroupsSidebarProps {
  groups: GroupSummaryDTO[];
  activeGroupId: string | null;
  userName: string;
  userEmail: string;
  userImage: string | null;
  onSignOut: () => void;
}

export function GroupsSidebar({
  groups,
  activeGroupId,
  userName,
  userEmail,
  userImage,
  onSignOut,
}: GroupsSidebarProps) {
  return (
    <AppSidebarShell
      activeNav="groups"
      userName={userName}
      userEmail={userEmail}
      userImage={userImage}
      onSignOut={onSignOut}
    >
      <ul className="m-0 mt-2 flex list-none flex-col gap-0.5 px-0">
        {groups.length === 0 && (
          <li className="px-[22px] py-2.5 font-mono text-[11px] text-[#6E757C]">
            No groups yet
          </li>
        )}
        {groups.map((g) => (
          <li key={g.id}>
            <Link
              href={`/groups/${g.id}`}
              className={
                "flex items-center gap-2.5 border-l-[3px] py-2.5 pr-[18px] pl-[22px] text-[13.5px] font-medium transition-colors " +
                (activeGroupId === g.id
                  ? "rounded-r-md bg-paper font-semibold text-ink"
                  : "border-l-transparent text-binder-text hover:bg-binder-soft")
              }
            >
              <span className="min-w-0 flex-1 truncate">{g.name}</span>
              <span className="font-mono text-[11px] opacity-60">
                {g.memberCount}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </AppSidebarShell>
  );
}
