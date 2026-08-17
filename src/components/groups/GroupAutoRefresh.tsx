"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseRealtimeClient } from "@/lib/supabaseRealtime";

interface GroupAutoRefreshProps {
  groupId: string;
}

// Listens for the content-free "changed" broadcast the server sends after
// any group-relevant mutation (share/unshare a note, add/remove a member,
// rename/delete the group, edit/delete a shared note) and silently re-fetches
// the server-rendered page data — no manual refresh needed. Renders nothing.
export function GroupAutoRefresh({ groupId }: GroupAutoRefreshProps) {
  const router = useRouter();

  useEffect(() => {
    const supabase = getSupabaseRealtimeClient();
    const channel = supabase
      .channel(`group-${groupId}`)
      .on("broadcast", { event: "changed" }, () => router.refresh())
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  return null;
}
