import type { GroupRole } from "@/generated/prisma/client";

export interface NoteDTO {
  id: string;
  title: string;
  topic: string;
  body: string;
  tags: string[];
  link: string | null;
  createdAt: string;
  updatedAt: string;
  sharedGroups: string[];
}

export interface TopicSummaryDTO {
  name: string;
  count: number;
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

export interface ShareableGroupDTO {
  groupId: string;
  groupName: string;
  shared: boolean;
}

export interface GroupFeedNoteDTO {
  id: string;
  title: string;
  topic: string;
  body: string;
  tags: string[];
  link: string | null;
  updatedAt: string;
  authorId: string;
  authorName: string;
  authorImage: string | null;
}

export interface SharedWithMeNoteDTO extends GroupFeedNoteDTO {
  groupNames: string[];
}
