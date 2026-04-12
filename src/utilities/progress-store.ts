export type TaskProgress = {
  taskId: string;
  status: "running" | "completed" | "error";
  total: number;
  processed: number;
  updated: number;
  failed: number;
  rateLimited: number;
  startedAt: number;
  finishedAt: number | null;
  error?: string;
  logs?: string[]; // to store error logs or warning logs
};

const store = new Map<string, TaskProgress>();

export function startTask(taskId: string, total: number) {
  store.set(taskId, {
    taskId,
    status: "running",
    total,
    processed: 0,
    updated: 0,
    failed: 0,
    rateLimited: 0,
    startedAt: Date.now(),
    finishedAt: null,
    logs: [],
  });
}

export function updateTask(taskId: string, update: Partial<TaskProgress>) {
  const current = store.get(taskId);
  if (current) {
    store.set(taskId, { ...current, ...update });
  }
}

export function addLogEntry(taskId: string, log: string) {
  const current = store.get(taskId);
  if (current) {
    store.set(taskId, { ...current, logs: [...(current.logs || []), log] });
  }
}

export function completeTask(taskId: string) {
  const current = store.get(taskId);
  if (current) {
    store.set(taskId, { ...current, status: "completed", finishedAt: Date.now() });
  }
}

export function failTask(taskId: string, errorMessage: string) {
  const current = store.get(taskId);
  if (current) {
    store.set(taskId, { ...current, status: "error", error: errorMessage, finishedAt: Date.now() });
  }
}

export function getTaskProgress(taskId: string): TaskProgress | undefined {
  return store.get(taskId);
}
