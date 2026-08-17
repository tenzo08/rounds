"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

// One shared browser client per tab — Supabase's realtime connection is a
// single websocket the channels multiplex over, so components should reuse
// this rather than each creating their own.
export function getSupabaseRealtimeClient(): SupabaseClient {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) {
      throw new Error("Realtime is not configured (missing Supabase public env vars)");
    }
    client = createClient(url, anonKey);
  }
  return client;
}
