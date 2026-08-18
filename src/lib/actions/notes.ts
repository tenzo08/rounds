"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  resolveFolderId,
  cleanupIfEmpty,
  findAffectedGroupIds,
  notifyGroups,
  DEFAULT_FOLDER_NAMES,
} from "@/lib/server/notesShared";

const noteInputSchema = z.object({
  subject: z.string().trim().min(1, "Subject is required").max(60),
  topic: z.string().trim().min(1, "Topic is required").max(60),
  folder: z.string().trim().min(1, "Folder is required").max(60),
  focus: z.string().trim().min(1, "Focus is required").max(120),
  description: z.string().trim().min(1, "Description is required").max(20000),
});

export type NoteInput = z.infer<typeof noteInputSchema>;

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not signed in");
  }
  return session.user.id;
}

const nameSchema = z.string().trim().min(1).max(60);

async function resolveOwnedSubject(userId: string, subjectName: string) {
  const validName = nameSchema.parse(subjectName);
  const subject = await prisma.subject.findUnique({
    where: { ownerId_name: { ownerId: userId, name: validName } },
    select: { id: true },
  });
  if (!subject) {
    throw new Error("Subject not found");
  }
  return subject;
}

async function resolveOwnedTopic(
  userId: string,
  subjectName: string,
  topicName: string,
) {
  const subject = await resolveOwnedSubject(userId, subjectName);
  const validName = nameSchema.parse(topicName);
  const topic = await prisma.topic.findUnique({
    where: { subjectId_name: { subjectId: subject.id, name: validName } },
    select: { id: true, subjectId: true },
  });
  if (!topic) {
    throw new Error("Topic not found");
  }
  return topic;
}

async function resolveOwnedFolder(
  userId: string,
  subjectName: string,
  topicName: string,
  folderName: string,
) {
  const topic = await resolveOwnedTopic(userId, subjectName, topicName);
  const validName = nameSchema.parse(folderName);
  const folder = await prisma.folder.findUnique({
    where: { topicId_name: { topicId: topic.id, name: validName } },
    select: { id: true, topicId: true },
  });
  if (!folder) {
    throw new Error("Folder not found");
  }
  return folder;
}

export async function createNote(input: NoteInput): Promise<void> {
  const userId = await requireUserId();
  const data = noteInputSchema.parse(input);
  const folderId = await resolveFolderId(
    userId,
    data.subject,
    data.topic,
    data.folder,
  );

  await prisma.note.create({
    data: {
      ownerId: userId,
      folderId,
      focus: data.focus,
      description: data.description,
    },
  });

  revalidatePath("/");
}

export async function updateNote(
  noteId: string,
  input: NoteInput,
): Promise<void> {
  const userId = await requireUserId();
  const data = noteInputSchema.parse(input);

  const existing = await prisma.note.findUnique({
    where: { id: noteId },
    select: { ownerId: true, folderId: true },
  });
  if (!existing || existing.ownerId !== userId) {
    throw new Error("Note not found or you do not have permission to edit it");
  }

  const folderId = await resolveFolderId(
    userId,
    data.subject,
    data.topic,
    data.folder,
  );
  const affectedGroupIds = await findAffectedGroupIds([noteId]);

  await prisma.note.update({
    where: { id: noteId },
    data: {
      folderId,
      focus: data.focus,
      description: data.description,
    },
  });

  if (folderId !== existing.folderId) {
    await cleanupIfEmpty(existing.folderId);
  }

  revalidatePath("/");
  await notifyGroups(affectedGroupIds);
}

export async function deleteNote(noteId: string): Promise<void> {
  const userId = await requireUserId();

  const existing = await prisma.note.findUnique({
    where: { id: noteId },
    select: { ownerId: true, folderId: true },
  });
  if (!existing || existing.ownerId !== userId) {
    throw new Error(
      "Note not found or you do not have permission to delete it",
    );
  }

  const affectedGroupIds = await findAffectedGroupIds([noteId]);

  await prisma.note.delete({ where: { id: noteId } });
  await cleanupIfEmpty(existing.folderId);

  revalidatePath("/");
  await notifyGroups(affectedGroupIds);
}

const bulkMoveSchema = z.object({
  noteIds: z.array(z.string()).min(1).max(200),
  subject: z.string().trim().min(1, "Subject is required").max(60),
  topic: z.string().trim().min(1, "Topic is required").max(60),
  folder: z.string().trim().min(1, "Folder is required").max(60),
});

export async function bulkMoveNotes(input: {
  noteIds: string[];
  subject: string;
  topic: string;
  folder: string;
}): Promise<{ moved: number }> {
  const userId = await requireUserId();
  const data = bulkMoveSchema.parse(input);

  // Scope strictly to the caller's own notes — ignore/skip any id that
  // doesn't belong to them rather than trusting the client-provided list.
  const owned = await prisma.note.findMany({
    where: { id: { in: data.noteIds }, ownerId: userId },
    select: { id: true, folderId: true },
  });
  if (owned.length === 0) {
    return { moved: 0 };
  }

  const affectedGroupIds = await findAffectedGroupIds(owned.map((n) => n.id));
  const folderId = await resolveFolderId(
    userId,
    data.subject,
    data.topic,
    data.folder,
  );
  await prisma.note.updateMany({
    where: { id: { in: owned.map((n) => n.id) } },
    data: { folderId },
  });

  const oldFolderIds = [...new Set(owned.map((n) => n.folderId))].filter(
    (id) => id !== folderId,
  );
  for (const oldFolderId of oldFolderIds) {
    await cleanupIfEmpty(oldFolderId);
  }

  revalidatePath("/");
  await notifyGroups(affectedGroupIds);
  return { moved: owned.length };
}

export async function bulkDeleteNotes(
  noteIds: string[],
): Promise<{ deleted: number }> {
  const userId = await requireUserId();
  const validIds = z.array(z.string()).min(1).max(200).parse(noteIds);

  const owned = await prisma.note.findMany({
    where: { id: { in: validIds }, ownerId: userId },
    select: { id: true, folderId: true },
  });
  if (owned.length === 0) {
    return { deleted: 0 };
  }

  const affectedGroupIds = await findAffectedGroupIds(owned.map((n) => n.id));
  await prisma.note.deleteMany({ where: { id: { in: owned.map((n) => n.id) } } });

  const folderIds = [...new Set(owned.map((n) => n.folderId))];
  for (const folderId of folderIds) {
    await cleanupIfEmpty(folderId);
  }

  revalidatePath("/");
  await notifyGroups(affectedGroupIds);
  return { deleted: owned.length };
}

export async function renameSubject(
  subjectName: string,
  newName: string,
): Promise<void> {
  const userId = await requireUserId();
  const validNew = nameSchema.parse(newName);
  const subject = await resolveOwnedSubject(userId, subjectName);
  if (subjectName.trim() === validNew) return;

  const conflict = await prisma.subject.findUnique({
    where: { ownerId_name: { ownerId: userId, name: validNew } },
    select: { id: true },
  });
  if (conflict) {
    throw new Error(`A subject named "${validNew}" already exists`);
  }

  const noteIds = (
    await prisma.note.findMany({
      where: { ownerId: userId, folder: { topic: { subjectId: subject.id } } },
      select: { id: true },
    })
  ).map((n) => n.id);
  const affectedGroupIds = await findAffectedGroupIds(noteIds);

  await prisma.subject.update({
    where: { id: subject.id },
    data: { name: validNew },
  });

  revalidatePath("/");
  await notifyGroups(affectedGroupIds);
}

export async function renameTopic(
  subjectName: string,
  topicName: string,
  newName: string,
): Promise<void> {
  const userId = await requireUserId();
  const validNew = nameSchema.parse(newName);
  const topic = await resolveOwnedTopic(userId, subjectName, topicName);
  if (topicName.trim() === validNew) return;

  const conflict = await prisma.topic.findUnique({
    where: { subjectId_name: { subjectId: topic.subjectId, name: validNew } },
    select: { id: true },
  });
  if (conflict) {
    throw new Error(`A topic named "${validNew}" already exists`);
  }

  const noteIds = (
    await prisma.note.findMany({
      where: { ownerId: userId, folder: { topicId: topic.id } },
      select: { id: true },
    })
  ).map((n) => n.id);
  const affectedGroupIds = await findAffectedGroupIds(noteIds);

  await prisma.topic.update({
    where: { id: topic.id },
    data: { name: validNew },
  });

  revalidatePath("/");
  await notifyGroups(affectedGroupIds);
}

export async function renameFolder(
  subjectName: string,
  topicName: string,
  folderName: string,
  newName: string,
): Promise<void> {
  const userId = await requireUserId();
  const validNew = nameSchema.parse(newName);
  const folder = await resolveOwnedFolder(
    userId,
    subjectName,
    topicName,
    folderName,
  );
  if (folderName.trim() === validNew) return;

  const conflict = await prisma.folder.findUnique({
    where: { topicId_name: { topicId: folder.topicId, name: validNew } },
    select: { id: true },
  });
  if (conflict) {
    throw new Error(`A folder named "${validNew}" already exists`);
  }

  const noteIds = (
    await prisma.note.findMany({
      where: { ownerId: userId, folderId: folder.id },
      select: { id: true },
    })
  ).map((n) => n.id);
  const affectedGroupIds = await findAffectedGroupIds(noteIds);

  await prisma.folder.update({
    where: { id: folder.id },
    data: { name: validNew },
  });

  revalidatePath("/");
  await notifyGroups(affectedGroupIds);
}

// Deleting cascades to everything below the deleted level (its Topics/
// Folders, their Notes, and those Notes' NoteShares — all FKs are
// onDelete: Cascade) — this intentionally removes the notes inside it too,
// unlike the automatic empty-container cleanup elsewhere, which only ever
// removes already-empty containers.

export async function deleteSubject(subjectName: string): Promise<void> {
  const userId = await requireUserId();
  const subject = await resolveOwnedSubject(userId, subjectName);

  const noteIds = (
    await prisma.note.findMany({
      where: { ownerId: userId, folder: { topic: { subjectId: subject.id } } },
      select: { id: true },
    })
  ).map((n) => n.id);
  const affectedGroupIds = await findAffectedGroupIds(noteIds);

  await prisma.subject.delete({ where: { id: subject.id } });

  revalidatePath("/");
  await notifyGroups(affectedGroupIds);
}

export async function deleteTopic(
  subjectName: string,
  topicName: string,
): Promise<void> {
  const userId = await requireUserId();
  const topic = await resolveOwnedTopic(userId, subjectName, topicName);

  const noteIds = (
    await prisma.note.findMany({
      where: { ownerId: userId, folder: { topicId: topic.id } },
      select: { id: true },
    })
  ).map((n) => n.id);
  const affectedGroupIds = await findAffectedGroupIds(noteIds);

  await prisma.topic.delete({ where: { id: topic.id } });

  revalidatePath("/");
  await notifyGroups(affectedGroupIds);
}

export async function deleteFolder(
  subjectName: string,
  topicName: string,
  folderName: string,
): Promise<void> {
  const userId = await requireUserId();
  const folder = await resolveOwnedFolder(
    userId,
    subjectName,
    topicName,
    folderName,
  );

  const noteIds = (
    await prisma.note.findMany({
      where: { ownerId: userId, folderId: folder.id },
      select: { id: true },
    })
  ).map((n) => n.id);
  const affectedGroupIds = await findAffectedGroupIds(noteIds);

  await prisma.folder.delete({ where: { id: folder.id } });

  revalidatePath("/");
  await notifyGroups(affectedGroupIds);
}

// Subjects/Topics/Folders are otherwise only ever created implicitly by
// typing a new name on a note — these let a student set up the structure
// ahead of time, with no flashcard required yet. Each throws a clear
// conflict error on a duplicate name rather than silently reusing the
// existing one, since "create new" here is an explicit, deliberate action.

export async function createSubject(name: string): Promise<void> {
  const userId = await requireUserId();
  const validName = nameSchema.parse(name);

  const existing = await prisma.subject.findUnique({
    where: { ownerId_name: { ownerId: userId, name: validName } },
    select: { id: true },
  });
  if (existing) {
    throw new Error(`A subject named "${validName}" already exists`);
  }

  await prisma.subject.create({ data: { ownerId: userId, name: validName } });
  revalidatePath("/");
}

export async function createTopic(
  subjectName: string,
  topicName: string,
): Promise<void> {
  const userId = await requireUserId();
  const subject = await resolveOwnedSubject(userId, subjectName);
  const validName = nameSchema.parse(topicName);

  const existing = await prisma.topic.findUnique({
    where: { subjectId_name: { subjectId: subject.id, name: validName } },
    select: { id: true },
  });
  if (existing) {
    throw new Error(`A topic named "${validName}" already exists`);
  }

  // Seed the same three exam-period defaults every implicitly-created
  // topic gets, so this one isn't a special case.
  await prisma.$transaction(async (tx) => {
    const created = await tx.topic.create({
      data: { subjectId: subject.id, name: validName },
    });
    await tx.folder.createMany({
      data: DEFAULT_FOLDER_NAMES.map((folderName) => ({
        topicId: created.id,
        name: folderName,
      })),
    });
  });

  revalidatePath("/");
}

export async function createFolder(
  subjectName: string,
  topicName: string,
  folderName: string,
): Promise<void> {
  const userId = await requireUserId();
  const topic = await resolveOwnedTopic(userId, subjectName, topicName);
  const validName = nameSchema.parse(folderName);

  const existing = await prisma.folder.findUnique({
    where: { topicId_name: { topicId: topic.id, name: validName } },
    select: { id: true },
  });
  if (existing) {
    throw new Error(`A folder named "${validName}" already exists`);
  }

  await prisma.folder.create({ data: { topicId: topic.id, name: validName } });
  revalidatePath("/");
}
