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
    <aside className="flex flex-col bg-binder py-7 text-binder-text md:h-screen md:w-[220px] md:shrink-0 md:overflow-y-auto">
      <div className="mb-2.5 border-b border-[#333d47] px-[22px] pb-[26px]">
        <p className="m-0 mb-1.5 font-mono text-[10.5px] tracking-[0.14em] text-[#8A9199] uppercase">
          Student Resource Binder
        </p>
        <h1 className="m-0 font-serif text-[26px] leading-[1.15] font-bold text-white">
          The Rounds
        </h1>
        <p className="m-0 mt-2 text-xs leading-[1.5] text-[#9AA1A8]">
          Chart what you learn, rotation by rotation.
        </p>
      </div>

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

      <div className="mt-auto hidden items-center gap-2.5 px-[22px] pt-6 md:flex">
        {userImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={userImage}
            alt=""
            className="h-8 w-8 shrink-0 rounded-full"
          />
        ) : (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-binder-soft text-xs font-semibold">
            {userName.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="m-0 truncate text-xs font-medium text-binder-text">
            {userName}
          </p>
          <p className="m-0 truncate text-[10.5px] text-[#6E757C]">
            {userEmail}
          </p>
        </div>
        <button
          type="button"
          onClick={onSignOut}
          className="shrink-0 font-mono text-[10.5px] text-[#9AA1A8] uppercase transition-colors hover:text-binder-text"
        >
          Sign out
        </button>
      </div>
    </aside>
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
