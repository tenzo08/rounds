import assert from "node:assert/strict";
import test from "node:test";

import {
  getSelectionSummary,
  markItemsImported,
  setAllIncluded,
} from "../src/lib/reviewSelection.ts";
import {
  BULK_BATCH_SIZE,
  chunkBulkItems,
  runSequentialBatches,
} from "../src/lib/bulkOperations.ts";

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

test("1,097 cards are split into automatic batches of at most 200", () => {
  const cards = Array.from({ length: 1_097 }, (_, index) => ({ index }));

  const batches = chunkBulkItems(cards);

  assert.equal(BULK_BATCH_SIZE, 200);
  assert.deepEqual(
    batches.map((batch) => batch.length),
    [200, 200, 200, 200, 200, 97],
  );
  assert.deepEqual(batches.flat(), cards);
});

test("successfully imported cards cannot be selected again", () => {
  const cards = [
    { focus: "A", include: true, imported: false },
    { focus: "B", include: true, imported: false },
    { focus: "C", include: true, imported: false },
  ];

  const afterBatch = markItemsImported(cards, [0, 1]);
  const afterSelectAll = setAllIncluded(afterBatch, true);

  assert.deepEqual(
    afterSelectAll.map(({ include, imported }) => ({ include, imported })),
    [
      { include: false, imported: true },
      { include: false, imported: true },
      { include: true, imported: false },
    ],
  );
});

test("select-all state ignores cards that were already imported", () => {
  assert.deepEqual(
    getSelectionSummary([
      { include: false, imported: true },
      { include: true, imported: false },
    ]),
    {
      selectedCount: 1,
      allSelected: true,
      partiallySelected: false,
    },
  );
});

test("large imports run every batch sequentially without confirmation", async () => {
  const cards = Array.from({ length: 1_097 }, (_, index) => index);
  const batchStarts = [];
  const progress = [];
  let activeBatches = 0;

  const result = await runSequentialBatches(
    cards,
    async (batch) => {
      activeBatches += 1;
      assert.equal(activeBatches, 1);
      batchStarts.push(batch[0]);
      await Promise.resolve();
      activeBatches -= 1;
    },
    (imported, total) => progress.push([imported, total]),
  );

  assert.deepEqual(batchStarts, [0, 200, 400, 600, 800, 1_000]);
  assert.deepEqual(progress.at(-1), [1_097, 1_097]);
  assert.deepEqual(result, { completed: 1_097, total: 1_097 });
});
