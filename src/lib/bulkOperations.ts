export const BULK_BATCH_SIZE = 200;

export interface TargetedBatchTask<TItem, TTarget> {
  target: TTarget;
  items: TItem[];
}

export function chunkBulkItems<T>(items: T[]): T[][] {
  const batches: T[][] = [];
  for (let index = 0; index < items.length; index += BULK_BATCH_SIZE) {
    batches.push(items.slice(index, index + BULK_BATCH_SIZE));
  }
  return batches;
}

export async function runSequentialBatches<T>(
  items: T[],
  runBatch: (batch: T[]) => Promise<void>,
  onProgress?: (completed: number, total: number, batch: T[]) => void,
): Promise<{ completed: number; total: number }> {
  let completed = 0;
  for (const batch of chunkBulkItems(items)) {
    await runBatch(batch);
    completed += batch.length;
    onProgress?.(completed, items.length, batch);
  }
  return { completed, total: items.length };
}

export function createTargetedBatchTasks<TItem, TTarget>(
  items: TItem[],
  targets: TTarget[],
): TargetedBatchTask<TItem, TTarget>[] {
  return targets.flatMap((target) =>
    chunkBulkItems(items).map((batch) => ({ target, items: batch })),
  );
}

export async function runSequentialBatchTasks<TItem, TTarget>(
  tasks: TargetedBatchTask<TItem, TTarget>[],
  runTask: (task: TargetedBatchTask<TItem, TTarget>) => Promise<void>,
  onProgress?: (
    completed: number,
    total: number,
    task: TargetedBatchTask<TItem, TTarget>,
  ) => void,
): Promise<{ completed: number; total: number }> {
  const total = tasks.reduce((sum, task) => sum + task.items.length, 0);
  let completed = 0;
  for (const task of tasks) {
    await runTask(task);
    completed += task.items.length;
    onProgress?.(completed, total, task);
  }
  return { completed, total };
}
