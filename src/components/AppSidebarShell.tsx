import Link from "next/link";
import type { ReactNode } from "react";

interface AppSidebarShellProps {
  activeNav: "binder" | "groups";
  userName: string;
  userEmail: string;
  userImage: string | null;
  onSignOut: () => void;
  children: ReactNode;
}

export function AppSidebarShell({
  activeNav,
  userName,
  userEmail,
  userImage,
  onSignOut,
  children,
}: AppSidebarShellProps) {
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

      <nav className="flex gap-1 px-[18px] pb-2">
        <Link
          href="/"
          className={
            "rounded px-2.5 py-1.5 font-mono text-[11px] tracking-[0.06em] uppercase transition-colors " +
            (activeNav === "binder"
              ? "bg-binder-soft text-binder-text"
              : "text-[#8A9199] hover:text-binder-text")
          }
        >
          My Binder
        </Link>
        <Link
          href="/groups"
          className={
            "rounded px-2.5 py-1.5 font-mono text-[11px] tracking-[0.06em] uppercase transition-colors " +
            (activeNav === "groups"
              ? "bg-binder-soft text-binder-text"
              : "text-[#8A9199] hover:text-binder-text")
          }
        >
          Groups
        </Link>
      </nav>

      {children}

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
