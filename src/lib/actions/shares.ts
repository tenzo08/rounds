"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyGroupChanged } from "@/lib/server/notifyGroup";
import type { ShareableGroupDTO } from "@/lib/types";

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not signed in");
  }
  return session.user.id;
}

async function requireNoteOwner(noteId: string, userId: string): Promise<void> {
  const note = await prisma.note.findUnique({
    where: { id: noteId },
    select: { ownerId: true },
  });
  if (!note || note.ownerId !== userId) {
    throw new Error("Note not found or you do not have permission to share it");
  }
}

export async function getShareableGroups(
  noteId: string,
): Promise<ShareableGroupDTO[]> {
  const userId = await requireUserId();
  await requireNoteOwner(noteId, userId);

  const [memberships, shares] = await Promise.all([
    prisma.groupMembership.findMany({
      where: { userId },
      include: { group: true },
      orderBy: { group: { name: "asc" } },
    }),
    prisma.noteShare.findMany({ where: { noteId }, select: { groupId: true } }),
  ]);

  const sharedGroupIds = new Set(shares.map((s) => s.groupId));

  return memberships.map((m) => ({
    groupId: m.group.id,
    groupName: m.group.name,
    shared: sharedGroupIds.has(m.group.id),
  }));
}

export async function setNoteShare(
  noteId: string,
  groupId: string,
  shared: boolean,
): Promise<void> {
  const userId = await requireUserId();
  await requireNoteOwner(noteId, userId);

  const membership = await prisma.groupMembership.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  if (!membership) {
    throw new Error("You are not a member of that group");
  }

  if (shared) {
    await prisma.noteShare.upsert({
      where: { noteId_groupId: { noteId, groupId } },
      update: {},
      create: { noteId, groupId },
    });
  } else {
    await prisma.noteShare.deleteMany({ where: { noteId, groupId } });
  }

  revalidatePath("/");
  revalidatePath(`/groups/${groupId}`);
  await notifyGroupChanged(groupId);
}

export async function bulkShareNotes(
  noteIds: string[],
  groupId: string,
  revalidateAfterShare = true,
): Promise<{ shared: number }> {
  const userId = await requireUserId();
  const validIds = z.array(z.string()).min(1).max(200).parse(noteIds);
  const shouldRevalidate = z.boolean().parse(revalidateAfterShare);

  const membership = await prisma.groupMembership.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  if (!membership) {
    throw new Error("You are not a member of that group");
  }

  const owned = await prisma.note.findMany({
    where: { id: { in: validIds }, ownerId: userId },
    select: { id: true },
  });
  if (owned.length === 0) {
    return { shared: 0 };
  }

  await prisma.noteShare.createMany({
    data: owned.map((note) => ({ noteId: note.id, groupId })),
    skipDuplicates: true,
  });

  if (shouldRevalidate) {
    revalidatePath("/");
    revalidatePath(`/groups/${groupId}`);
    await notifyGroupChanged(groupId);
  }
  return { shared: owned.length };
}

export async function finalizeBulkShares(groupIds: string[]): Promise<void> {
  const userId = await requireUserId();
  const validGroupIds = z.array(z.string()).min(1).max(200).parse(groupIds);
  const memberships = await prisma.groupMembership.findMany({
    where: { userId, groupId: { in: validGroupIds } },
    select: { groupId: true },
  });

  revalidatePath("/");
  for (const { groupId } of memberships) {
    revalidatePath(`/groups/${groupId}`);
    await notifyGroupChanged(groupId);
  }
}
