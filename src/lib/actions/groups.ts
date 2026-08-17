"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyGroupChanged } from "@/lib/server/notifyGroup";
import type { GroupRole } from "@/generated/prisma/client";
import type { UserSearchResultDTO } from "@/lib/types";

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not signed in");
  }
  return session.user.id;
}

async function requireGroupAdmin(
  groupId: string,
  userId: string,
): Promise<void> {
  const membership = await prisma.groupMembership.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  if (!membership || membership.role !== "admin") {
    throw new Error("Only group admins can do this");
  }
}

async function countOtherAdmins(
  groupId: string,
  excludingUserId: string,
): Promise<number> {
  return prisma.groupMembership.count({
    where: {
      groupId,
      role: "admin",
      userId: { not: excludingUserId },
    },
  });
}

const groupNameSchema = z.string().trim().min(1, "Group name is required").max(100);

export async function createGroup(name: string): Promise<{ id: string }> {
  const userId = await requireUserId();
  const validName = groupNameSchema.parse(name);

  const group = await prisma.group.create({
    data: {
      name: validName,
      createdBy: userId,
      memberships: {
        create: { userId, role: "admin" },
      },
    },
  });

  revalidatePath("/groups");
  return { id: group.id };
}

export async function renameGroup(
  groupId: string,
  name: string,
): Promise<void> {
  const userId = await requireUserId();
  await requireGroupAdmin(groupId, userId);
  const validName = groupNameSchema.parse(name);

  await prisma.group.update({
    where: { id: groupId },
    data: { name: validName },
  });

  revalidatePath("/groups");
  revalidatePath(`/groups/${groupId}`);
  await notifyGroupChanged(groupId);
}

export async function deleteGroup(groupId: string): Promise<void> {
  const userId = await requireUserId();
  await requireGroupAdmin(groupId, userId);

  await prisma.group.delete({ where: { id: groupId } });

  revalidatePath("/groups");
  await notifyGroupChanged(groupId);
}

export async function addMember(
  groupId: string,
  targetUserId: string,
): Promise<void> {
  const userId = await requireUserId();
  await requireGroupAdmin(groupId, userId);

  const existing = await prisma.groupMembership.findUnique({
    where: { groupId_userId: { groupId, userId: targetUserId } },
  });
  if (existing) {
    throw new Error("That person is already a member of this group");
  }

  await prisma.groupMembership.create({
    data: { groupId, userId: targetUserId, role: "member" },
  });

  revalidatePath(`/groups/${groupId}`);
  await notifyGroupChanged(groupId);
}

export async function removeMember(
  groupId: string,
  targetUserId: string,
): Promise<void> {
  const userId = await requireUserId();
  await requireGroupAdmin(groupId, userId);

  const target = await prisma.groupMembership.findUnique({
    where: { groupId_userId: { groupId, userId: targetUserId } },
  });
  if (!target) {
    throw new Error("That person is not a member of this group");
  }
  if (target.role === "admin") {
    const remaining = await countOtherAdmins(groupId, targetUserId);
    if (remaining === 0) {
      throw new Error("Cannot remove the only admin of a group");
    }
  }

  // Leaving/being removed from a group should also pull the person's own
  // notes out of it — otherwise their flashcards would keep showing up in
  // the group's shared feed for members who can no longer see them coming
  // from that person at all.
  await prisma.$transaction([
    prisma.noteShare.deleteMany({
      where: { groupId, note: { ownerId: targetUserId } },
    }),
    prisma.groupMembership.delete({
      where: { groupId_userId: { groupId, userId: targetUserId } },
    }),
  ]);

  revalidatePath(`/groups/${groupId}`);
  revalidatePath("/");
  await notifyGroupChanged(groupId);
}

// A member removing themselves — unlike removeMember, this doesn't require
// admin rights, only that you're actually a member. Same "don't strand a
// group with zero admins" guard, and the same note-unsharing cleanup.
export async function leaveGroup(groupId: string): Promise<void> {
  const userId = await requireUserId();

  const membership = await prisma.groupMembership.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  if (!membership) {
    throw new Error("You are not a member of this group");
  }
  if (membership.role === "admin") {
    const remaining = await countOtherAdmins(groupId, userId);
    if (remaining === 0) {
      throw new Error(
        "You're the only admin — promote someone else first, or delete the group instead.",
      );
    }
  }

  await prisma.$transaction([
    prisma.noteShare.deleteMany({
      where: { groupId, note: { ownerId: userId } },
    }),
    prisma.groupMembership.delete({
      where: { groupId_userId: { groupId, userId } },
    }),
  ]);

  revalidatePath(`/groups/${groupId}`);
  revalidatePath("/groups");
  revalidatePath("/");
  await notifyGroupChanged(groupId);
}

export async function setMemberRole(
  groupId: string,
  targetUserId: string,
  role: GroupRole,
): Promise<void> {
  const userId = await requireUserId();
  await requireGroupAdmin(groupId, userId);

  const target = await prisma.groupMembership.findUnique({
    where: { groupId_userId: { groupId, userId: targetUserId } },
  });
  if (!target) {
    throw new Error("That person is not a member of this group");
  }
  if (target.role === "admin" && role === "member") {
    const remaining = await countOtherAdmins(groupId, targetUserId);
    if (remaining === 0) {
      throw new Error("Cannot demote the only admin of a group");
    }
  }

  await prisma.groupMembership.update({
    where: { groupId_userId: { groupId, userId: targetUserId } },
    data: { role },
  });

  revalidatePath(`/groups/${groupId}`);
  await notifyGroupChanged(groupId);
}

export async function searchUsersForGroup(
  groupId: string,
  query: string,
): Promise<UserSearchResultDTO[]> {
  const userId = await requireUserId();
  await requireGroupAdmin(groupId, userId);

  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return [];
  }

  const existingMemberIds = (
    await prisma.groupMembership.findMany({
      where: { groupId },
      select: { userId: true },
    })
  ).map((m) => m.userId);

  const users = await prisma.user.findMany({
    where: {
      id: { notIn: existingMemberIds },
      OR: [
        { displayName: { contains: trimmed, mode: "insensitive" } },
        { email: { contains: trimmed, mode: "insensitive" } },
      ],
    },
    take: 10,
  });

  return users.map((u) => ({
    id: u.id,
    name: u.displayName,
    email: u.email,
    image: u.avatarUrl,
  }));
}
