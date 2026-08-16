"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Category } from "@/generated/prisma/client";

const CATEGORY_VALUES = [
  "fundamentals",
  "pharm",
  "medsurg",
  "obpeds",
  "psych",
  "crit",
] as const;

const noteInputSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  category: z.enum(CATEGORY_VALUES),
  body: z.string().max(20000),
  tags: z.array(z.string().trim().min(1).max(40)).max(20),
  link: z
    .string()
    .trim()
    .refine(
      (v) => v === "" || /^https?:\/\//i.test(v),
      "Link must start with http:// or https://",
    ),
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

  await prisma.note.create({
    data: {
      ownerId: userId,
      title: data.title,
      category: data.category as Category,
      body: data.body,
      tags: data.tags,
      link: data.link || null,
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

  // Scoping the update by ownerId (not just id) means a request for another
  // user's note matches zero rows instead of mutating it — this is the
  // server-side enforcement, independent of anything the UI hides.
  const result = await prisma.note.updateMany({
    where: { id: noteId, ownerId: userId },
    data: {
      title: data.title,
      category: data.category as Category,
      body: data.body,
      tags: data.tags,
      link: data.link || null,
    },
  });

  if (result.count === 0) {
    throw new Error("Note not found or you do not have permission to edit it");
  }

  revalidatePath("/");
}

export async function deleteNote(noteId: string): Promise<void> {
  const userId = await requireUserId();

  const result = await prisma.note.deleteMany({
    where: { id: noteId, ownerId: userId },
  });

  if (result.count === 0) {
    throw new Error(
      "Note not found or you do not have permission to delete it",
    );
  }

  revalidatePath("/");
}
