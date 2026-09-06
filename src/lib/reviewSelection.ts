interface SelectableItem {
  include: boolean;
}

export function setAllIncluded<T extends SelectableItem>(
  items: T[],
  include: boolean,
): T[] {
  return items.map((item) => ({ ...item, include }));
}

export function getSelectionSummary(items: SelectableItem[]): {
  selectedCount: number;
  allSelected: boolean;
  partiallySelected: boolean;
} {
  const selectedCount = items.filter((item) => item.include).length;
  const allSelected = items.length > 0 && selectedCount === items.length;

  return {
    selectedCount,
    allSelected,
    partiallySelected: selectedCount > 0 && !allSelected,
  };
}
