import { db } from "@/lib/db";
import type { SyncQueueItem } from "@/types/models";

export async function listPending(userId: string): Promise<SyncQueueItem[]> {
  if (!db) return [];
  const all = await db.syncQueue.orderBy("id").toArray();
  return all.filter((i) => !i.userId || i.userId === userId);
}

export async function removeItem(id: number): Promise<void> {
  if (!db) return;
  await db.syncQueue.delete(id);
}

export async function adoptOrphans(userId: string): Promise<number> {
  if (!db) return 0;
  // items that were enqueued before a user was signed in
  const orphans = await db.syncQueue.where("userId").equals("").toArray();
  if (!orphans.length) return 0;
  await db.syncQueue.bulkPut(orphans.map((o) => ({ ...o, userId })));
  return orphans.length;
}

export async function pendingCount(userId: string): Promise<number> {
  if (!db) return 0;
  const all = await db.syncQueue.toArray();
  return all.filter((i) => !i.userId || i.userId === userId).length;
}

export async function clearAll(): Promise<void> {
  if (!db) return;
  await db.syncQueue.clear();
}
