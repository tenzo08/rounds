"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveFolderId, cleanupIfEmpty } from "@/lib/server/notesShared";

const noteInputSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
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

export async function createNote(input: NoteInput): Promise<void> {
  const userId = await requireUserId();
  const data = noteInputSchema.parse(input);
  const folderId = await resolveFolderId(userId, data.topic, data.folder);

  await prisma.note.create({
    data: {
      ownerId: userId,
      title: data.title,
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

  const folderId = await resolveFolderId(userId, data.topic, data.folder);

  await prisma.note.update({
    where: { id: noteId },
    data: {
      title: data.title,
      folderId,
      focus: data.focus,
      description: data.description,
    },
  });

  if (folderId !== existing.folderId) {
    await cleanupIfEmpty(existing.folderId);
  }

  revalidatePath("/");
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

  await prisma.note.delete({ where: { id: noteId } });
  await cleanupIfEmpty(existing.folderId);

  revalidatePath("/");
}

const bulkMoveSchema = z.object({
  noteIds: z.array(z.string()).min(1).max(200),
  topic: z.string().trim().min(1, "Topic is required").max(60),
  folder: z.string().trim().min(1, "Folder is required").max(60),
});

export async function bulkMoveNotes(input: {
  noteIds: string[];
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

  const folderId = await resolveFolderId(userId, data.topic, data.folder);
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

  await prisma.note.deleteMany({ where: { id: { in: owned.map((n) => n.id) } } });

  const folderIds = [...new Set(owned.map((n) => n.folderId))];
  for (const folderId of folderIds) {
    await cleanupIfEmpty(folderId);
  }

  revalidatePath("/");
  return { deleted: owned.length };
}

export async function deleteTopic(topicName: string): Promise<void> {
  const userId = await requireUserId();
  const validName = z.string().trim().min(1).max(60).parse(topicName);

  // Deleting the Topic cascades to its Folders, their Notes, and those
  // Notes' NoteShares (all FKs are onDelete: Cascade) — this intentionally
  // removes the notes inside it too, unlike the automatic empty-folder/
  // topic cleanup elsewhere, which only ever removes already-empty
  // containers.
  const result = await prisma.topic.deleteMany({
    where: { ownerId: userId, name: validName },
  });
  if (result.count === 0) {
    throw new Error("Topic not found");
  }

  revalidatePath("/");
}
