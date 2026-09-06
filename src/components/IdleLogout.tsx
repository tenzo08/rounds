"use client";

import { useEffect, useRef } from "react";
import {
  refreshSessionAction,
  signOutAction,
} from "@/lib/actions/auth";
import {
  IDLE_LIMIT_MS,
  hasSessionGoneIdle,
  shouldRefreshSession,
} from "@/lib/idleSession";

const ACTIVITY_EVENTS = [
  "mousemove",
  "mousedown",
  "keydown",
  "touchstart",
  "scroll",
] as const;

// Signs the student out (and clears the session cookie, via the same
// server-side signOut() the manual "Sign out" button uses) after 10 minutes
// with no mouse/keyboard/touch/scroll activity on the page.
export function IdleLogout() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActivityAtRef = useRef(0);
  const lastRefreshAtRef = useRef(0);
  const isSigningOutRef = useRef(false);

  useEffect(() => {
    lastActivityAtRef.current = Date.now();

    function signOutExpiredSession() {
      if (isSigningOutRef.current) return;
      isSigningOutRef.current = true;
      void signOutAction();
    }

    function scheduleIdleCheck() {
      if (timerRef.current) clearTimeout(timerRef.current);
      const remaining = Math.max(
        0,
        IDLE_LIMIT_MS - (Date.now() - lastActivityAtRef.current),
      );
      timerRef.current = setTimeout(checkForIdleSession, remaining);
    }

    function checkForIdleSession() {
      if (hasSessionGoneIdle(lastActivityAtRef.current, Date.now())) {
        signOutExpiredSession();
        return;
      }
      scheduleIdleCheck();
    }

    function refreshSessionIfDue(now: number) {
      if (!shouldRefreshSession(lastRefreshAtRef.current, now)) return;
      lastRefreshAtRef.current = now;
      void refreshSessionAction()
        .then((isAuthenticated) => {
          if (!isAuthenticated) signOutExpiredSession();
        })
        .catch(() => {
          // Ask the server to render either a working app or the sign-in
          // screen instead of leaving an unusable authenticated-looking UI.
          window.location.reload();
        });
    }

    function recordActivity() {
      const now = Date.now();
      if (hasSessionGoneIdle(lastActivityAtRef.current, now)) {
        signOutExpiredSession();
        return;
      }
      lastActivityAtRef.current = now;
      scheduleIdleCheck();
      refreshSessionIfDue(now);
    }

    function handleVisibilityChange() {
      if (document.visibilityState !== "visible") return;
      const now = Date.now();
      if (hasSessionGoneIdle(lastActivityAtRef.current, now)) {
        signOutExpiredSession();
        return;
      }
      refreshSessionIfDue(now);
    }

    scheduleIdleCheck();
    refreshSessionIfDue(Date.now());
    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, recordActivity, { passive: true });
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, recordActivity);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return null;
}
