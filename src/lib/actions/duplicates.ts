"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeFocus } from "@/lib/mdFlashcards";

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not signed in");
  }
  return session.user.id;
}

interface FocusEntry {
  noteId: string;
  subject: string;
  topic: string;
  folder: string;
  ownerName: string;
  isOwnNote: boolean;
}

export interface DuplicateMatch {
  focus: string;
  existingSubject: string;
  existingTopic: string;
  existingFolder: string;
  existingOwnerName: string;
}

const folderSelect = {
  name: true,
  topic: { select: { name: true, subject: { select: { name: true } } } },
} as const;

// Used by the .md import flow: flags candidate focus terms that already
// exist somewhere the student can see (their own binder or a group's shared
// notes) — surfaced so they can decide, never auto-dropped.
export async function checkDuplicateFocuses(
  focuses: string[],
): Promise<DuplicateMatch[]> {
  const userId = await requireUserId();
  const normalizedTargets = new Set(focuses.map(normalizeFocus));
  if (normalizedTargets.size === 0) return [];

  const [ownNotes, sharedNotes] = await Promise.all([
    prisma.note.findMany({
      where: { ownerId: userId },
      select: {
        focus: true,
        folder: { select: folderSelect },
      },
    }),
    prisma.note.findMany({
      where: {
        ownerId: { not: userId },
        shares: { some: { group: { memberships: { some: { userId } } } } },
      },
      select: {
        focus: true,
        folder: { select: folderSelect },
        owner: { select: { displayName: true } },
      },
    }),
  ]);

  const matches: DuplicateMatch[] = [];
  for (const note of ownNotes) {
    const normalized = normalizeFocus(note.focus);
    if (normalizedTargets.has(normalized)) {
      matches.push({
        focus: normalized,
        existingSubject: note.folder.topic.subject.name,
        existingTopic: note.folder.topic.name,
        existingFolder: note.folder.name,
        existingOwnerName: "you",
      });
    }
  }
  for (const note of sharedNotes) {
    const normalized = normalizeFocus(note.focus);
    if (normalizedTargets.has(normalized)) {
      matches.push({
        focus: normalized,
        existingSubject: note.folder.topic.subject.name,
        existingTopic: note.folder.topic.name,
        existingFolder: note.folder.name,
        existingOwnerName: note.owner.displayName,
      });
    }
  }
  return matches;
}

export interface DuplicateGroup {
  focus: string;
  entries: FocusEntry[];
}

// Standalone scan across everything the student can see (own binder + every
// group's shared notes), independent of any import — for a "just check what
// I already have" pass. Read-only: it only reports groups of 2+ notes that
// share a normalized focus term; deleting/editing is a separate, explicit
// action the student takes afterward.
export async function findDuplicateFocusGroups(): Promise<DuplicateGroup[]> {
  const userId = await requireUserId();

  const [ownNotes, sharedNotes] = await Promise.all([
    prisma.note.findMany({
      where: { ownerId: userId },
      select: {
        id: true,
        focus: true,
        folder: { select: folderSelect },
      },
    }),
    prisma.note.findMany({
      where: {
        ownerId: { not: userId },
        shares: { some: { group: { memberships: { some: { userId } } } } },
      },
      select: {
        id: true,
        focus: true,
        folder: { select: folderSelect },
        owner: { select: { displayName: true } },
      },
    }),
  ]);

  const byFocus = new Map<string, FocusEntry[]>();
  function add(focus: string, entry: FocusEntry) {
    const key = normalizeFocus(focus);
    if (!byFocus.has(key)) byFocus.set(key, []);
    byFocus.get(key)!.push(entry);
  }

  for (const n of ownNotes) {
    add(n.focus, {
      noteId: n.id,
      subject: n.folder.topic.subject.name,
      topic: n.folder.topic.name,
      folder: n.folder.name,
      ownerName: "You",
      isOwnNote: true,
    });
  }
  for (const n of sharedNotes) {
    add(n.focus, {
      noteId: n.id,
      subject: n.folder.topic.subject.name,
      topic: n.folder.topic.name,
      folder: n.folder.name,
      ownerName: n.owner.displayName,
      isOwnNote: false,
    });
  }

  const groups: DuplicateGroup[] = [];
  for (const [focus, entries] of byFocus) {
    if (entries.length > 1) groups.push({ focus, entries });
  }
  return groups.sort((a, b) => b.entries.length - a.entries.length);
}
