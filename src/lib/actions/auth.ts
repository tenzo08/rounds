"use server";

import { signOut, updateSession } from "@/lib/auth";

export async function refreshSessionAction(): Promise<boolean> {
  const session = await updateSession({});
  return Boolean(session?.user);
}

export async function signOutAction(): Promise<void> {
  await signOut();
}
