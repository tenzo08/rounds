"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveFolderId } from "@/lib/server/notesShared";

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not signed in");
  }
  return session.user.id;
}

const cardSchema = z.object({
  title: z.string().trim().min(1).max(200),
  focus: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(20000),
});

export async function importFlashcards(
  topic: string,
  folder: string,
  cards: { title: string; focus: string; description: string }[],
): Promise<{ created: number }> {
  const userId = await requireUserId();
  const validTopic = z.string().trim().min(1).max(60).parse(topic);
  const validFolder = z.string().trim().min(1).max(60).parse(folder);
  const validCards = z.array(cardSchema).min(1).max(200).parse(cards);

  const folderId = await resolveFolderId(userId, validTopic, validFolder);

  await prisma.note.createMany({
    data: validCards.map((card) => ({
      ownerId: userId,
      folderId,
      title: card.title,
      focus: card.focus,
      description: card.description,
    })),
  });

  revalidatePath("/");
  return { created: validCards.length };
}
