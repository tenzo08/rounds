interface SelectableItem {
  include: boolean;
  imported?: boolean;
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
