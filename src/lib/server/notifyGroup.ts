import { createClient } from "@supabase/supabase-js";

let client: ReturnType<typeof createClient> | null = null;

function getClient() {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) return null;
    client = createClient(url, anonKey);
  }
  return client;
}

// Pings a content-free "something changed" broadcast on the group's channel
// right after a mutation succeeds, so open tabs refetch live instead of
// needing a manual reload. Deliberately not gated by RLS/auth like the
// note/message data itself — this channel carries zero actual content (no
// note text, no names), just a nudge to re-fetch from the properly
// -authorized server, so there's nothing sensitive to protect here even if
// someone guessed a group's id. Best-effort: a missed signal just means the
// next real page load (or another change) catches it up, so failures here
// never block the actual mutation.
export async function notifyGroupChanged(groupId: string): Promise<void> {
  try {
    const supabase = getClient();
    if (!supabase) return;
    await supabase.channel(`group-${groupId}`).send({
      type: "broadcast",
      event: "changed",
      payload: {},
    });
  } catch {
    // Best-effort, see above.
  }
}
