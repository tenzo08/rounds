"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseRealtimeClient } from "@/lib/supabaseRealtime";
import { mintGroupRealtimeToken } from "@/lib/actions/realtime";

const TOKEN_REFRESH_MS = 4 * 60 * 1000;

interface GroupAutoRefreshProps {
  groupId: string;
}

// Silently keeps the group page's server-rendered data (shared notes,
// member list) in sync when anyone changes something — no manual refresh
// needed. Renders nothing; just listens and calls router.refresh() on any
// relevant change.
export function GroupAutoRefresh({ groupId }: GroupAutoRefreshProps) {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    const supabase = getSupabaseRealtimeClient();
    let tokenTimer: ReturnType<typeof setInterval> | null = null;

    async function authenticate() {
      try {
        const token = await mintGroupRealtimeToken(groupId);
        if (!cancelled) await supabase.realtime.setAuth(token);
      } catch {
        // Membership may have just been revoked — the channel will simply
        // stop receiving events once the current token expires.
      }
    }

    const channel = supabase
      .channel(`group-watch-${groupId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "note_shares", filter: `group_id=eq.${groupId}` },
        () => router.refresh(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "group_memberships", filter: `group_id=eq.${groupId}` },
        () => router.refresh(),
      );

    void authenticate().then(() => channel.subscribe());
    tokenTimer = setInterval(() => void authenticate(), TOKEN_REFRESH_MS);

    return () => {
      cancelled = true;
      if (tokenTimer) clearInterval(tokenTimer);
      void supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  return null;
}
