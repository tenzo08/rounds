"use server";

import { SignJWT } from "jose";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function getSecret(): Uint8Array {
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) {
    throw new Error("Realtime is not configured (missing SUPABASE_JWT_SECRET)");
  }
  return new TextEncoder().encode(secret);
}

// Mints a short-lived token authorizing the caller to receive Supabase
// Realtime events (chat messages, note shares, membership changes) scoped
// to exactly this group — only after confirming, right now, that they're
// actually a member. The token expires in 5 minutes; the client re-mints
// and re-authenticates on an interval, so someone removed from a group
// loses live access within minutes even if their tab stays open.
export async function mintGroupRealtimeToken(groupId: string): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not signed in");
  }
  const userId = session.user.id;

  const membership = await prisma.groupMembership.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  if (!membership) {
    throw new Error("Not a member of this group");
  }

  return new SignJWT({ role: "authenticated", user_id: userId, group_id: groupId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(getSecret());
}
