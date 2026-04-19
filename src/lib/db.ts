import Dexie, { type Table } from "dexie";
import type {
  Task,
  Note,
  CalendarEvent,
  PomodoroSession,
  TaskCategory,
  Settings,
  SyncQueueItem,
  SyncEntity,
} from "@/types/models";

export type StoredSettings = Settings & { id: "singleton" };

export class FlowDB extends Dexie {
  tasks!: Table<Task, string>;
  notes!: Table<Note, string>;
  events!: Table<CalendarEvent, string>;
  sessions!: Table<PomodoroSession, string>;
  categories!: Table<TaskCategory, string>;
  settings!: Table<StoredSettings, string>;
  syncQueue!: Table<SyncQueueItem, number>;

  constructor() {
    super("flow");

    this.version(1).stores({
      tasks: "id, startAt, completed, categoryId, updatedAt",
      notes: "id, updatedAt",
      events: "id, startAt, source",
      sessions: "id, taskId, startedAt",
      categories: "id",
      settings: "id",
    });

    this.version(2)
      .stores({
        tasks: "id, startAt, completed, categoryId, updatedAt, deletedAt",
        notes: "id, updatedAt, deletedAt",
        events: "id, startAt, source, updatedAt, deletedAt",
        sessions: "id, taskId, startedAt, updatedAt, deletedAt",
        categories: "id, updatedAt, deletedAt",
        settings: "id, updatedAt",
        syncQueue: "++id, entity, operation, recordId, userId, createdAt",
      })
      .upgrade(async (tx) => {
        const now = new Date().toISOString();
        const stampAll = async (name: string) => {
          const t = tx.table(name);
          await t.toCollection().modify((r: Record<string, unknown>) => {
            if (!r.updatedAt) r.updatedAt = now;
            if (!r.createdAt) r.createdAt = now;
            if (r.deletedAt === undefined) r.deletedAt = null;
          });
        };
        await Promise.all([
          stampAll("tasks"),
          stampAll("notes"),
          stampAll("events"),
          stampAll("sessions"),
          stampAll("categories"),
          stampAll("settings"),
        ]);
      });
  }
}

export const db = typeof window !== "undefined" ? new FlowDB() : (null as unknown as FlowDB);

export const DEFAULT_SETTINGS: Settings = {
  theme: "system",
  pomodoro: {
    workMin: 25,
    shortBreakMin: 5,
    longBreakMin: 15,
    cyclesBeforeLongBreak: 4,
  },
  focusMode: {
    ambientSound: "none",
    muteNotifications: true,
  },
  timelineHourHeight: 60,
  weekStartsOn: 1,
  onboarded: false,
};

const nowIso = () => new Date().toISOString();

export const DEFAULT_CATEGORIES: TaskCategory[] = [
  { id: "cat-work", name: "Work", color: "#0A84FF", createdAt: nowIso(), updatedAt: nowIso(), deletedAt: null },
  { id: "cat-personal", name: "Personal", color: "#BF5AF2", createdAt: nowIso(), updatedAt: nowIso(), deletedAt: null },
  { id: "cat-health", name: "Health", color: "#30D158", createdAt: nowIso(), updatedAt: nowIso(), deletedAt: null },
  { id: "cat-study", name: "Study", color: "#FF9F0A", createdAt: nowIso(), updatedAt: nowIso(), deletedAt: null },
];

export const uid = (): string =>
  Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

type EntityRecordMap = {
  task: Task;
  note: Note;
  event: CalendarEvent;
  session: PomodoroSession;
  category: TaskCategory;
  settings: StoredSettings;
};

export function tableFor<E extends SyncEntity>(entity: E): Table<EntityRecordMap[E], string> {
  switch (entity) {
    case "task":
      return db.tasks as unknown as Table<EntityRecordMap[E], string>;
    case "note":
      return db.notes as unknown as Table<EntityRecordMap[E], string>;
    case "event":
      return db.events as unknown as Table<EntityRecordMap[E], string>;
    case "session":
      return db.sessions as unknown as Table<EntityRecordMap[E], string>;
    case "category":
      return db.categories as unknown as Table<EntityRecordMap[E], string>;
    case "settings":
      return db.settings as unknown as Table<EntityRecordMap[E], string>;
  }
}

function getCurrentUserId(): string {
  if (typeof window === "undefined") return "";
  // Lazy require to avoid import cycle on server.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { useAuthStore } = require("@/stores/auth") as typeof import("@/stores/auth");
  return useAuthStore.getState().user?.id ?? "";
}

async function notifyQueueChanged() {
  if (typeof window === "undefined") return;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require("@/stores/sync") as typeof import("@/stores/sync");
  const count = await db.syncQueue.count();
  mod.useSync.getState().setPendingCount(count);
  // trigger engine flush on write
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const eng = require("@/lib/sync/engine") as typeof import("@/lib/sync/engine");
  eng.scheduleFlush();
}

/**
 * Write a record to Dexie with updatedAt stamped, and enqueue a sync upsert.
 * Caller owns createdAt (set on first write).
 */
export async function syncedPut<E extends SyncEntity>(
  entity: E,
  record: EntityRecordMap[E]
): Promise<void> {
  if (!db) return;
  const stamped = { ...record, updatedAt: nowIso() } as EntityRecordMap[E];
  const table = tableFor(entity);
  await table.put(stamped);
  const userId = getCurrentUserId();
  await db.syncQueue.add({
    entity,
    operation: "upsert",
    recordId: (stamped as { id: string }).id,
    userId,
    createdAt: nowIso(),
  });
  await notifyQueueChanged();
}

export async function syncedBulkPut<E extends SyncEntity>(
  entity: E,
  records: EntityRecordMap[E][]
): Promise<void> {
  if (!db || records.length === 0) return;
  const stamped = records.map(
    (r) => ({ ...r, updatedAt: nowIso() }) as EntityRecordMap[E]
  );
  const table = tableFor(entity);
  await table.bulkPut(stamped);
  const userId = getCurrentUserId();
  await db.syncQueue.bulkAdd(
    stamped.map((r) => ({
      entity,
      operation: "upsert" as const,
      recordId: (r as { id: string }).id,
      userId,
      createdAt: nowIso(),
    }))
  );
  await notifyQueueChanged();
}

/**
 * Soft delete: stamp deletedAt/updatedAt, keep in Dexie so it can still push.
 * Stores are responsible for removing the record from their in-memory list.
 */
export async function syncedDelete<E extends SyncEntity>(
  entity: E,
  id: string
): Promise<void> {
  if (!db) return;
  const table = tableFor(entity);
  const existing = (await table.get(id)) as (EntityRecordMap[E] & { deletedAt?: string | null }) | undefined;
  if (!existing) return;
  const now = nowIso();
  const tombstoned = { ...existing, updatedAt: now, deletedAt: now } as EntityRecordMap[E];
  await table.put(tombstoned);
  const userId = getCurrentUserId();
  await db.syncQueue.add({
    entity,
    operation: "delete",
    recordId: id,
    userId,
    createdAt: now,
  });
  await notifyQueueChanged();
}

/**
 * Write without enqueueing a sync job. Used by the sync engine when
 * applying inbound server changes so we don't echo them back up.
 */
export async function dexiePutSilent<E extends SyncEntity>(
  entity: E,
  record: EntityRecordMap[E]
): Promise<void> {
  if (!db) return;
  await tableFor(entity).put(record);
}

export async function dexieDeleteSilent<E extends SyncEntity>(
  entity: E,
  id: string
): Promise<void> {
  if (!db) return;
  await tableFor(entity).delete(id);
}
