"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Uploaded pictures are downscaled client-side and stored as a data: URI —
// there's no external file storage set up, and this keeps the profile
// picture an actual uploaded image rather than a pasted link. ~300KB caps
// the base64 payload for a small square avatar with headroom.
const MAX_AVATAR_LENGTH = 300_000;

const profileInputSchema = z.object({
  displayName: z.string().trim().min(1, "Nickname is required").max(60),
  // Omit entirely to leave the stored picture untouched (e.g. saving just a
  // nickname change) — "" clears it, a data: URI sets a freshly uploaded one.
  // Never accepts a pasted link.
  avatarUrl: z
    .string()
    .trim()
    .max(MAX_AVATAR_LENGTH, "Image is too large")
    .refine(
      (v) => v === "" || /^data:image\/(png|jpeg|webp);base64,/.test(v),
      "Must be an uploaded image",
    )
    .optional(),
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
      ...(data.avatarUrl !== undefined && {
        avatarUrl: data.avatarUrl || null,
      }),
    },
  });

  revalidatePath("/");
  revalidatePath("/groups", "layout");
}
