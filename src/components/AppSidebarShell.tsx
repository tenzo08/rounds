"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { EditProfileModal } from "@/components/EditProfileModal";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTour } from "@/components/tour/TourContext";

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

function EditIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
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
  const tour = useTour();

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

  // The tour is owned by a provider mounted at the root layout (so its
  // progress survives this component remounting on route changes), but the
  // hamburger drawer is local state here. On a phone-width viewport, the
  // sidebar footer/nav/tree this component renders only exists inside the
  // drawer, so force it open for a step that points at them and closed for
  // every other step — and closed again once the tour ends, so the page
  // ends up looking exactly like it did before the tour started.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!tour.isOpen) {
        setIsDrawerOpen(false);
        return;
      }
      if (window.innerWidth < 768) {
        setIsDrawerOpen(tour.wantsDrawerOpen);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [tour.isOpen, tour.wantsDrawerOpen]);

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
      </div>
      {/* One consistent row of icon buttons instead of two rows mixing
          bordered text buttons and icon buttons — frequent actions on the
          left, Sign out deliberately separated on the right since it's the
          one rare/consequential control here. */}
      <div className="mt-3 flex items-center gap-0.5">
        <button
          type="button"
          data-tour="edit-profile-button"
          onClick={() => setIsEditProfileOpen(true)}
          title="Edit profile"
          aria-label="Edit profile"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded text-binder-text/70 transition-colors duration-150 hover:bg-binder-soft hover:text-binder-text active:scale-[0.94]"
        >
          <EditIcon />
        </button>
        <ThemeToggle />
        <button
          type="button"
          data-tour="help-button"
          onClick={() => tour.open()}
          title="Help"
          aria-label="Open help tour"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded text-binder-text/70 transition-colors duration-150 hover:bg-binder-soft hover:text-binder-text active:scale-[0.94]"
        >
          <HelpIcon />
        </button>
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => {
            closeDrawer();
            onSignOut();
          }}
          title="Sign out"
          aria-label="Sign out"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded text-binder-text/50 transition-colors duration-150 hover:bg-c-crit/10 hover:text-c-crit active:scale-[0.94]"
        >
          <LogoutIcon />
        </button>
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
          className="-ml-2 flex h-11 w-11 items-center justify-center rounded transition-colors duration-150 active:scale-[0.94] active:bg-binder-soft"
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
              className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded text-lg text-binder-text/70 transition-colors duration-150 hover:bg-binder-soft active:scale-[0.94]"
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
    </>
  );
}
