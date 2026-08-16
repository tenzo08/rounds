import { AppSidebarShell } from "@/components/AppSidebarShell";
import { topicColor } from "@/lib/topics";
import type { TopicSummaryDTO } from "@/lib/types";

export type ActiveTopic = "all" | string;

interface SidebarProps {
  activeTopic: ActiveTopic;
  onSelect: (topic: ActiveTopic) => void;
  topics: TopicSummaryDTO[];
  allCount: number;
  userName: string;
  userEmail: string;
  userImage: string | null;
  onSignOut: () => void;
}

export function Sidebar({
  activeTopic,
  onSelect,
  topics,
  allCount,
  userName,
  userEmail,
  userImage,
  onSignOut,
}: SidebarProps) {
  return (
    <AppSidebarShell
      activeNav="binder"
      userName={userName}
      userEmail={userEmail}
      userImage={userImage}
      onSignOut={onSignOut}
    >
      <ul className="m-0 mt-2 flex list-none flex-col gap-0.5 px-0">
        <Tab
          label="All entries"
          count={allCount}
          dot="#8A9199"
          active={activeTopic === "all"}
          onClick={() => onSelect("all")}
        />
        {topics.map((t) => (
          <Tab
            key={t.name}
            label={t.name}
            count={t.count}
            dot={topicColor(t.name)}
            active={activeTopic === t.name}
            onClick={() => onSelect(t.name)}
          />
        ))}
      </ul>
    </AppSidebarShell>
  );
}

interface TabProps {
  label: string;
  count: number;
  dot: string;
  active: boolean;
  onClick: () => void;
}

function Tab({ label, count, dot, active, onClick }: TabProps) {
  return (
    <li
      onClick={onClick}
      style={{ "--dot": dot } as React.CSSProperties}
      className={
        "flex min-h-[40px] cursor-pointer items-center gap-2.5 border-l-[3px] py-2.5 pr-[18px] pl-[22px] text-[13.5px] font-medium transition-colors " +
        (active
          ? "rounded-r-md bg-paper font-semibold text-ink border-l-[var(--dot)]"
          : "border-l-transparent text-binder-text hover:bg-binder-soft")
      }
    >
      <span
        className="h-[9px] w-[9px] shrink-0 rounded-[2px]"
        style={{ background: dot }}
      />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <span className="ml-auto shrink-0 font-mono text-[11px] opacity-60">
        {count}
      </span>
    </li>
  );
}
