"use client";

import { useEffect, useRef } from "react";
import { signOutAction } from "@/lib/actions/auth";

const IDLE_LIMIT_MS = 10 * 60 * 1000;
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

  useEffect(() => {
    function reset() {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        void signOutAction();
      }, IDLE_LIMIT_MS);
    }

    reset();
    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, reset, { passive: true });
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, reset);
      }
    };
  }, []);

  return null;
}
