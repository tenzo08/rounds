"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { TOUR_STEPS } from "@/components/tour/tourSteps";
import { TourOverlay } from "@/components/tour/TourOverlay";

interface TourContextValue {
  isOpen: boolean;
  // Whether the current step wants the mobile hamburger drawer forced
  // open — AppSidebarShell (mounted fresh per page, so it can't hold this
  // itself) reads this to sync its own local drawer state.
  wantsDrawerOpen: boolean;
  open: () => void;
}

const TourContext = createContext<TourContextValue | null>(null);

export function useTour(): TourContextValue {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error("useTour must be used within TourProvider");
  return ctx;
}

// Mounted once in the root layout (not inside AppSidebarShell, which
// remounts on every route change) so the tour's progress survives the
// cross-route navigation it does for Groups-related steps.
export function TourProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [startPathname, setStartPathname] = useState<string | null>(null);

  const step = TOUR_STEPS[stepIndex];
  const isLast = stepIndex === TOUR_STEPS.length - 1;

  function open() {
    setStartPathname(pathname);
    setStepIndex(0);
    setIsOpen(true);
  }

  function close() {
    setIsOpen(false);
    // Leave the app exactly where the student found it, not mid-tour on
    // whatever route the last step happened to navigate to.
    if (startPathname && startPathname !== pathname) {
      router.push(startPathname);
    }
    setStartPathname(null);
  }

  function goNext() {
    if (isLast) {
      close();
      return;
    }
    setStepIndex((i) => i + 1);
  }

  function goBack() {
    setStepIndex((i) => Math.max(0, i - 1));
  }

  return (
    <TourContext.Provider
      value={{
        isOpen,
        wantsDrawerOpen: isOpen && !!step.sidebarChrome,
        open,
      }}
    >
      {children}
      {isOpen && (
        <TourOverlay
          step={step}
          stepIndex={stepIndex}
          totalSteps={TOUR_STEPS.length}
          isLast={isLast}
          onNext={goNext}
          onBack={goBack}
          onClose={close}
        />
      )}
    </TourContext.Provider>
  );
}
