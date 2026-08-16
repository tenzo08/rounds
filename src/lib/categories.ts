import { Category } from "@/generated/prisma/client";

export interface CategoryMeta {
  id: Category;
  label: string;
  hex: string;
}

export const CATEGORIES: CategoryMeta[] = [
  { id: "fundamentals", label: "Fundamentals", hex: "#4A7C59" },
  { id: "pharm", label: "Pharmacology", hex: "#6B5B95" },
  { id: "medsurg", label: "Med-Surg", hex: "#3B6E8F" },
  { id: "obpeds", label: "OB & Peds", hex: "#C4547D" },
  { id: "psych", label: "Psych / MH", hex: "#3A8F8C" },
  { id: "crit", label: "Critical Care", hex: "#B33A3A" },
];

export function categoryMeta(id: Category): CategoryMeta {
  const found = CATEGORIES.find((c) => c.id === id);
  if (!found) {
    throw new Error(`Unknown category: ${id}`);
  }
  return found;
}
