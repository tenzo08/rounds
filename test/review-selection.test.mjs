import assert from "node:assert/strict";
import test from "node:test";

import {
  getSelectionSummary,
  setAllIncluded,
} from "../src/lib/reviewSelection.ts";

test("select all includes duplicate and non-duplicate review cards", () => {
  const cards = [
    { focus: "A", duplicateOf: null, include: true },
    { focus: "B", duplicateOf: "Existing card", include: false },
  ];

  assert.deepEqual(
    setAllIncluded(cards, true).map((card) => card.include),
    [true, true],
  );
});

test("selection summary represents none, some, and all selected cards", () => {
  assert.deepEqual(getSelectionSummary([{ include: false }, { include: false }]), {
    selectedCount: 0,
    allSelected: false,
    partiallySelected: false,
  });
  assert.deepEqual(getSelectionSummary([{ include: true }, { include: false }]), {
    selectedCount: 1,
    allSelected: false,
    partiallySelected: true,
  });
  assert.deepEqual(getSelectionSummary([{ include: true }, { include: true }]), {
    selectedCount: 2,
    allSelected: true,
    partiallySelected: false,
  });
});
