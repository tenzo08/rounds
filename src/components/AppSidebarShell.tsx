"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { EditProfileModal } from "@/components/EditProfileModal";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TourOverlay } from "@/components/tour/TourOverlay";

interface AppSidebarShellProps {
  activeNav: "binder" | "groups";
  userName: string;
  userEmail: string;
  userImage: string | null;
  onSignOut: () => void;
  children: ReactNode;
}

function HamburgerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </svg>
  );
}

function HelpIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </svg>
  );
}

export function AppSidebarShell({
  activeNav,
  userName,
  userEmail,
  userImage,
  onSignOut,
  children,
}: AppSidebarShellProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);

  useEffect(() => {
    if (!isDrawerOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsDrawerOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [isDrawerOpen]);

  function closeDrawer() {
    setIsDrawerOpen(false);
  }

  const dedication = (
    <p className="m-0 border-t border-[#333d47] px-[22px] pt-3 font-serif text-[11.5px] italic text-binder-text/50">
      This project is dedicated for my student nurse, Bia.
    </p>
  );

  const navLinks = (
    <nav data-tour="nav-links" className="flex gap-1 px-[18px] pb-2">
      <Link
        href="/"
        onClick={closeDrawer}
        className={
          "min-h-[36px] rounded px-2.5 py-1.5 font-mono text-[11px] tracking-[0.06em] uppercase transition-colors " +
          (activeNav === "binder"
            ? "bg-binder-soft text-binder-text"
            : "text-[#8A9199] hover:text-binder-text")
        }
      >
        My Binder
      </Link>
      <Link
        href="/groups"
        onClick={closeDrawer}
        className={
          "min-h-[36px] rounded px-2.5 py-1.5 font-mono text-[11px] tracking-[0.06em] uppercase transition-colors " +
          (activeNav === "groups"
            ? "bg-binder-soft text-binder-text"
            : "text-[#8A9199] hover:text-binder-text")
        }
      >
        Groups
      </Link>
    </nav>
  );

  const footer = (
    <div className="mb-2 border-b border-[#333d47] px-[22px] pb-5">
      <div className="flex items-center gap-2.5">
        {userImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={userImage} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
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
          onClick={() => {
            closeDrawer();
            onSignOut();
          }}
          className="shrink-0 rounded border border-c-crit/40 px-2.5 py-1 font-mono text-[10px] text-c-crit uppercase transition-colors hover:border-c-crit hover:bg-c-crit/10"
        >
          Sign out
        </button>
      </div>
      <div className="mt-2.5 flex items-center justify-between">
        <button
          type="button"
          data-tour="edit-profile-button"
          onClick={() => setIsEditProfileOpen(true)}
          className="rounded border border-binder-text/25 px-2.5 py-1 font-mono text-[10.5px] text-[#9AA1A8] uppercase transition-colors hover:border-binder-text/50 hover:bg-binder-soft hover:text-binder-text"
        >
          Edit profile
        </button>
        <div className="flex items-center gap-1">
          <button
            type="button"
            data-tour="help-button"
            onClick={() => setIsTourOpen(true)}
            aria-label="Open help tour"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded text-binder-text/70 transition-colors hover:bg-binder-soft hover:text-binder-text"
          >
            <HelpIcon />
          </button>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="flex items-center justify-between bg-binder px-4 py-3 text-binder-text md:hidden">
        <button
          type="button"
          onClick={() => setIsDrawerOpen(true)}
          aria-label="Open menu"
          aria-expanded={isDrawerOpen}
          aria-controls="app-drawer"
          className="-ml-2 flex h-11 w-11 items-center justify-center"
        >
          <HamburgerIcon />
        </button>
        <span className="font-serif text-base font-semibold text-white">
          The Rounds
        </span>
        <div className="w-11" aria-hidden="true" />
      </div>

      {/* Mobile drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            onClick={closeDrawer}
            className="absolute inset-0 bg-[rgba(20,26,22,0.45)]"
          />
          <div
            id="app-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className="relative flex h-full w-[280px] max-w-[85vw] flex-col bg-binder pt-14 pb-7 text-binder-text"
          >
            <button
              type="button"
              onClick={closeDrawer}
              aria-label="Close menu"
              className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded text-lg text-binder-text/70 hover:bg-binder-soft"
            >
              ×
            </button>
            {footer}
            {navLinks}
            {/* Tapping any actual selection inside (a topic, folder, group)
                bubbles up and closes the drawer; the sidebar's own expand/
                collapse chevron already stops propagation, so that alone
                doesn't dismiss it. */}
            <div
              onClick={closeDrawer}
              className="min-h-0 flex-1 overflow-y-auto"
            >
              {children}
            </div>
            {dedication}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden bg-binder py-7 text-binder-text md:sticky md:top-0 md:flex md:h-screen md:w-[220px] md:shrink-0 md:flex-col">
        {footer}
        {navLinks}
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        {dedication}
      </aside>

      {isEditProfileOpen && (
        <EditProfileModal
          currentName={userName}
          currentAvatarUrl={userImage}
          onClose={() => setIsEditProfileOpen(false)}
        />
      )}

      {isTourOpen && <TourOverlay onClose={() => setIsTourOpen(false)} />}
    </>
  );
}
