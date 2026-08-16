"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const profileInputSchema = z.object({
  displayName: z.string().trim().min(1, "Nickname is required").max(60),
  avatarUrl: z
    .string()
    .trim()
    .refine(
      (v) => v === "" || /^https?:\/\//i.test(v),
      "Must be a link starting with http:// or https://",
    ),
});

export type ProfileInput = z.infer<typeof profileInputSchema>;

export async function updateProfile(input: ProfileInput): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not signed in");
  }
  const data = profileInputSchema.parse(input);

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      displayName: data.displayName,
      avatarUrl: data.avatarUrl || null,
    },
  });

  revalidatePath("/");
  revalidatePath("/groups", "layout");
}
