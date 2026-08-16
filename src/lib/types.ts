import type { Category } from "@/generated/prisma/client";

export interface NoteDTO {
  id: string;
  title: string;
  category: Category;
  body: string;
  tags: string[];
  link: string | null;
  createdAt: string;
  updatedAt: string;
}
