import { prisma } from "@/lib/db/prisma";
import {
  normalizeTitleKey,
  suggestCategory,
  type CategorySuggestion,
  type LearnedCategoryMapping,
} from "@/lib/domain/category-suggestion-engine";
import type { TransactionType } from "@/lib/types";

export async function getLearnedMappingsForUser(
  userId: string
): Promise<LearnedCategoryMapping[]> {
  const rows = await prisma.categoryMapping.findMany({
    where: { userId },
    select: { titleKey: true, category: true, type: true },
  });

  return rows.map((row) => ({
    titleKey: row.titleKey,
    category: row.category,
    type: row.type,
  }));
}

export async function suggestCategoryForUser(
  userId: string,
  title: string,
  type: TransactionType
): Promise<CategorySuggestion | null> {
  const learned = await getLearnedMappingsForUser(userId);
  return suggestCategory(title, type, learned);
}

/** Persist user override / learned mapping from a saved transaction. */
export async function upsertLearnedCategoryMapping(
  userId: string,
  title: string,
  category: string,
  type: TransactionType
): Promise<void> {
  const titleKey = normalizeTitleKey(title);
  const trimmedCategory = category.trim();

  if (!titleKey || !trimmedCategory) return;

  await prisma.categoryMapping.upsert({
    where: {
      userId_titleKey_type: {
        userId,
        titleKey,
        type,
      },
    },
    create: {
      userId,
      titleKey,
      category: trimmedCategory,
      type,
    },
    update: {
      category: trimmedCategory,
    },
  });
}
