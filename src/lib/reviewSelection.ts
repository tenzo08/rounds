interface SelectableItem {
  include: boolean;
  imported?: boolean;
}

export const IMPORT_BATCH_SIZE = 200;

export function chunkForImport<T>(items: T[]): T[][] {
  const batches: T[][] = [];
  for (let index = 0; index < items.length; index += IMPORT_BATCH_SIZE) {
    batches.push(items.slice(index, index + IMPORT_BATCH_SIZE));
  }
  return batches;
}

export async function runSequentialImport<T>(
  items: T[],
  importBatch: (batch: T[]) => Promise<void>,
  onProgress?: (imported: number, total: number, batch: T[]) => void,
): Promise<{ imported: number; total: number }> {
  let imported = 0;
  for (const batch of chunkForImport(items)) {
    await importBatch(batch);
    imported += batch.length;
    onProgress?.(imported, items.length, batch);
  }
  return { imported, total: items.length };
}

export function setAllIncluded<T extends SelectableItem>(
  items: T[],
  include: boolean,
): T[] {
  return items.map((item) => ({
    ...item,
    include: item.imported ? false : include,
  }));
}

export function markItemsImported<T extends SelectableItem>(
  items: T[],
  importedIndexes: number[],
): T[] {
  const indexes = new Set(importedIndexes);
  return items.map((item, index) =>
    indexes.has(index)
      ? { ...item, include: false, imported: true }
      : item,
  );
}

export function getSelectionSummary(items: SelectableItem[]): {
  selectedCount: number;
  allSelected: boolean;
  partiallySelected: boolean;
} {
  const selectableItems = items.filter((item) => !item.imported);
  const selectedCount = selectableItems.filter((item) => item.include).length;
  const allSelected =
    selectableItems.length > 0 && selectedCount === selectableItems.length;

  return {
    selectedCount,
    allSelected,
    partiallySelected: selectedCount > 0 && !allSelected,
  };
}
