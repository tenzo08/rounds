import { AppSidebarShell } from "@/components/AppSidebarShell";
import { CATEGORIES } from "@/lib/categories";
import type { Category } from "@/generated/prisma/client";

export type ActiveCategory = "all" | Category;

interface SidebarProps {
  activeCategory: ActiveCategory;
  onSelect: (category: ActiveCategory) => void;
  counts: Record<Category, number>;
  allCount: number;
  userName: string;
  userEmail: string;
  userImage: string | null;
  onSignOut: () => void;
}

export function Sidebar({
  activeCategory,
  onSelect,
  counts,
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
      <ul className="m-0 mt-2 flex list-none gap-0.5 overflow-x-auto px-3 md:block md:overflow-visible md:px-0">
        <Tab
          label="All entries"
          count={allCount}
          dot="#8A9199"
          active={activeCategory === "all"}
          onClick={() => onSelect("all")}
        />
        {CATEGORIES.map((c) => (
          <Tab
            key={c.id}
            label={c.label}
            count={counts[c.id] ?? 0}
            dot={c.hex}
            active={activeCategory === c.id}
            onClick={() => onSelect(c.id)}
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
        "flex shrink-0 cursor-pointer items-center gap-2.5 py-2.5 pr-4.5 pl-4 text-[13.5px] font-medium transition-colors md:my-0.5 md:shrink md:border-l-[3px] md:border-l-transparent md:pr-[18px] md:pl-[22px] " +
        (active
          ? "rounded-md bg-paper font-semibold text-ink md:mr-[-1px] md:rounded-l-none md:rounded-r-md md:border-l-[var(--dot)]"
          : "rounded-md text-binder-text hover:bg-binder-soft md:rounded-none")
      }
    >
      <span
        className="h-[9px] w-[9px] shrink-0 rounded-[2px]"
        style={{ background: dot }}
      />
      <span>{label}</span>
      <span className="ml-auto font-mono text-[11px] opacity-60">
        {count}
      </span>
    </li>
  );
}
