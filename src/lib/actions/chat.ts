"use server";

import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireMembership(groupId: string, userId: string): Promise<void> {
  const membership = await prisma.groupMembership.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  if (!membership) {
    throw new Error("Not a member of this group");
  }
}

const bodySchema = z.string().trim().min(1).max(2000);

export async function sendGroupMessage(
  groupId: string,
  body: string,
): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not signed in");
  }
  const userId = session.user.id;
  await requireMembership(groupId, userId);
  const validBody = bodySchema.parse(body);

  await prisma.message.create({
    data: { groupId, senderId: userId, body: validBody },
  });
}

export interface ChatMessageDTO {
  id: string;
  body: string;
  createdAt: string;
  senderId: string;
  senderName: string;
  senderImage: string | null;
}

// Only the most recent messages — this is a lightweight in-app chat, not a
// full message archive. Pagination for older history is a reasonable follow
// -up once a group actually accumulates that much traffic.
const MESSAGE_HISTORY_LIMIT = 100;

export async function getGroupMessages(groupId: string): Promise<ChatMessageDTO[]> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not signed in");
  }
  const userId = session.user.id;
  await requireMembership(groupId, userId);

  const messages = await prisma.message.findMany({
    where: { groupId },
    include: { sender: { select: { displayName: true, avatarUrl: true } } },
    orderBy: { createdAt: "desc" },
    take: MESSAGE_HISTORY_LIMIT,
  });

  return messages
    .map((m) => ({
      id: m.id,
      body: m.body,
      createdAt: m.createdAt.toISOString(),
      senderId: m.senderId,
      senderName: m.sender.displayName,
      senderImage: m.sender.avatarUrl,
    }))
    .reverse();
}
