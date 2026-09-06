import assert from "node:assert/strict";
import test from "node:test";

import {
  createTargetedBatchTasks,
  runSequentialBatches,
  runSequentialBatchTasks,
} from "../src/lib/bulkOperations.ts";

test("1,097 items run in sequential batches of at most 200", async () => {
  const items = Array.from({ length: 1_097 }, (_, index) => index);
  const batchSizes = [];
  const progress = [];
  let activeBatches = 0;

  const result = await runSequentialBatches(
    items,
    async (batch) => {
      activeBatches += 1;
      assert.equal(activeBatches, 1);
      batchSizes.push(batch.length);
      await Promise.resolve();
      activeBatches -= 1;
    },
    (completed, total) => progress.push([completed, total]),
  );

  assert.deepEqual(batchSizes, [200, 200, 200, 200, 200, 97]);
  assert.deepEqual(progress.at(-1), [1_097, 1_097]);
  assert.deepEqual(result, { completed: 1_097, total: 1_097 });
});

test("multi-group sharing creates one ordered batch task per group", () => {
  const noteIds = Array.from({ length: 450 }, (_, index) => `note-${index}`);

  const tasks = createTargetedBatchTasks(noteIds, ["group-a", "group-b"]);

  assert.deepEqual(
    tasks.map(({ target, items }) => [target, items.length]),
    [
      ["group-a", 200],
      ["group-a", 200],
      ["group-a", 50],
      ["group-b", 200],
      ["group-b", 200],
      ["group-b", 50],
    ],
  );
});

test("task runner reports completed work and leaves a failed task retryable", async () => {
  const tasks = createTargetedBatchTasks(
    Array.from({ length: 450 }, (_, index) => index),
    ["group-a"],
  );
  let completed = 0;
  let completedTasks = 0;

  await assert.rejects(
    runSequentialBatchTasks(
      tasks,
      async (task) => {
        if (task.items.length === 50) throw new Error("network stopped");
      },
      (completedItems) => {
        completed = completedItems;
        completedTasks += 1;
      },
    ),
    /network stopped/,
  );

  assert.equal(completed, 400);
  const remaining = tasks.slice(completedTasks);
  assert.deepEqual(remaining.map((task) => task.items.length), [50]);
});
