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
