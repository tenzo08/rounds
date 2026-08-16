import type { Category, GroupRole } from "@/generated/prisma/client";

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

export interface GroupSummaryDTO {
  id: string;
  name: string;
  role: GroupRole;
  memberCount: number;
}

export interface GroupMemberDTO {
  userId: string;
  name: string;
  email: string;
  image: string | null;
  role: GroupRole;
}

export interface GroupDetailDTO {
  id: string;
  name: string;
  members: GroupMemberDTO[];
  currentUserRole: GroupRole;
}

export interface UserSearchResultDTO {
  id: string;
  name: string;
  email: string;
  image: string | null;
}
