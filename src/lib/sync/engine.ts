import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { db, tableFor, dexiePutSilent } from "@/lib/db";
import { SUPABASE_TABLE } from "@/types/database";
import type { EntityRowMap } from "@/lib/sync/mappers";
import { fromSupabase, toSupabase } from "@/lib/sync/mappers";
import type { SyncEntity, SyncQueueItem } from "@/types/models";
import { useSync } from "@/stores/sync";
import { subscribeRealtime, unsubscribeRealtime } from "@/lib/sync/realtime";
import { adoptOrphans, listPending, pendingCount, removeItem } from "@/lib/sync/queue";

type StoreReload = () => Promise<void>;
const ENTITIES: SyncEntity[] = ["task", "note", "event", "session", "category", "settings"];

let supabase: SupabaseClient | null = null;
let activeUserId: string | null = null;
let channel: RealtimeChannel | null = null;

let flushScheduled = false;
let flushing = false;
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let retryAttempt = 0;

function nowIso() {
  return new Date().toISOString();
}

function setStatus(s: "idle" | "syncing" | "offline" | "error") {
  useSync.getState().setStatus(s);
}

async function refreshPendingCount() {
  if (!activeUserId) return;
  useSync.getState().setPendingCount(await pendingCount(activeUserId));
}

/* ───── Store reload bridge ───── */
async function reloadStoreFor(entity: SyncEntity): Promise<void> {
  if (typeof window === "undefined") return;
  switch (entity) {
    case "task": {
      const m = await import("@/stores/tasks");
      await m.useTasks.getState().load();
      break;
    }
    case "note": {
      const m = await import("@/stores/notes");
      await m.useNotes.getState().load();
      break;
    }
    case "event": {
      const m = await import("@/stores/events");
      await m.useEvents.getState().load();
      break;
    }
    case "session": {
      const m = await import("@/stores/pomodoro");
      await m.usePomodoro.getState().loadSessions();
      break;
    }
    case "category":
    case "settings": {
      const m = await import("@/stores/ui");
      await m.useUI.getState().load();
      break;
    }
  }
}

/* ───── Apply inbound row ───── */
async function applyInbound(entity: SyncEntity, row: EntityRowMap[SyncEntity]): Promise<boolean> {
  const serverUpdated = (row as { updated_at: string }).updated_at;
  const serverDeleted = (row as { deleted_at: string | null }).deleted_at;
  const id = entity === "settings" ? "singleton" : (row as { id: string }).id;

  const existing = (await tableFor(entity).get(id)) as
    | { updatedAt?: string; deletedAt?: string | null }
    | undefined;

  if (existing?.updatedAt && existing.updatedAt >= serverUpdated) return false;

  if (serverDeleted) {
    // Keep the tombstone locally so echoes LWW correctly; stores filter it out.
    const mapped = fromSupabase(entity, row) as unknown as { [k: string]: unknown };
    await dexiePutSilent(entity, mapped as never);
    return true;
  }

  const mapped = fromSupabase(entity, row) as unknown as { [k: string]: unknown };
  await dexiePutSilent(entity, mapped as never);
  return true;
}

/* ───── Initial pull ───── */
export async function initialPull(userId: string): Promise<{ appliedAny: boolean }> {
  if (!supabase) supabase = createClient();
  const sync = useSync.getState();
  const lastSynced = sync.lastSyncedAt;

  let appliedAny = false;
  let newestSeen = lastSynced;

  for (const entity of ENTITIES) {
    const table = SUPABASE_TABLE[entity];
    let query = supabase.from(table).select("*").eq("user_id", userId);
    if (lastSynced) query = query.gt("updated_at", lastSynced);
    const { data, error } = await query;
    if (error) throw error;
    if (!data || data.length === 0) continue;
    for (const row of data as EntityRowMap[SyncEntity][]) {
      const applied = await applyInbound(entity, row);
      if (applied) {
        appliedAny = true;
        const u = (row as { updated_at: string }).updated_at;
        if (!newestSeen || u > newestSeen) newestSeen = u;
      }
    }
    await reloadStoreFor(entity);
  }

  if (newestSeen) useSync.getState().setLastSyncedAt(newestSeen);
  return { appliedAny };
}

/* ───── First-time catch-up: enqueue existing local records ───── */
async function catchUpPushOnce(userId: string): Promise<void> {
  if (!db) return;
  await adoptOrphans(userId);

  const haveSynced = useSync.getState().lastSyncedAt;
  if (haveSynced) return; // only on very first sync with this browser

  const existingQueue = await db.syncQueue.toArray();
  const already = new Set(existingQueue.map((q) => `${q.entity}:${q.recordId}`));

  async function enqueueAll<E extends SyncEntity>(entity: E): Promise<number> {
    const rows = (await tableFor(entity).toArray()) as { id: string }[];
    if (!rows.length) return 0;
    const items: Omit<SyncQueueItem, "id">[] = rows
      .filter((r) => !already.has(`${entity}:${r.id}`))
      .map((r) => ({
        entity,
        operation: "upsert",
        recordId: r.id,
        userId,
        createdAt: nowIso(),
      }));
    if (items.length) await db.syncQueue.bulkAdd(items);
    return items.length;
  }

  let total = 0;
  for (const e of ENTITIES) total += await enqueueAll(e);
  if (total > 0) await refreshPendingCount();
}

/* ───── Push queue drain ───── */
export function scheduleFlush(): void {
  if (flushScheduled || flushing) return;
  flushScheduled = true;
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(() => {
    flushScheduled = false;
    void flushNow();
  }, 150);
}

export async function flushNow(): Promise<void> {
  if (flushing) return;
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    setStatus("offline");
    return;
  }
  if (!activeUserId) return;
  if (!supabase) supabase = createClient();

  flushing = true;
  try {
    let items = await listPending(activeUserId);
    while (items.length > 0) {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setStatus("offline");
        break;
      }
      setStatus("syncing");
      const item = items[0];
      try {
        await pushItem(item, activeUserId);
        if (item.id != null) await removeItem(item.id);
        retryAttempt = 0;
      } catch (err) {
        // Transient failure: backoff then stop this drain.
        const delay = Math.min(30_000, 1000 * Math.pow(2, retryAttempt));
        retryAttempt = Math.min(retryAttempt + 1, 5);
        setStatus("error");
        setTimeout(() => void flushNow(), delay);
        await refreshPendingCount();
        return;
      }
      items = await listPending(activeUserId);
    }
    await refreshPendingCount();
    if (typeof navigator !== "undefined" && !navigator.onLine) setStatus("offline");
    else setStatus("idle");
    useSync.getState().setLastSyncedAt(nowIso());
  } finally {
    flushing = false;
  }
}

async function pushItem(item: SyncQueueItem, userId: string): Promise<void> {
  if (!supabase) supabase = createClient();
  const entity = item.entity;
  const tableName = SUPABASE_TABLE[entity];

  const id = entity === "settings" ? "singleton" : item.recordId;
  const record = (await tableFor(entity).get(id)) as
    | { id: string; updatedAt?: string; deletedAt?: string | null }
    | undefined;

  if (!record) {
    // Nothing to push (already hard-deleted locally).
    return;
  }

  const row = toSupabase(entity, record as never, userId);
  const onConflict = entity === "settings" ? "user_id" : "id";
  const { error } = await supabase
    .from(tableName)
    .upsert(row as never, { onConflict });
  if (error) throw error;
}

/* ───── Realtime handler ───── */
async function onRealtime(
  entity: SyncEntity,
  row: { id: string; updated_at: string },
  _eventType: "INSERT" | "UPDATE" | "DELETE"
): Promise<void> {
  try {
    const full = row as unknown as EntityRowMap[SyncEntity];
    const applied = await applyInbound(entity, full);
    if (applied) {
      await reloadStoreFor(entity);
      useSync.getState().setLastSyncedAt(row.updated_at);
    }
  } catch {
    // swallow — keep realtime quiet
  }
}

/* ───── Lifecycle ───── */
let onlineHandler: (() => void) | null = null;
let offlineHandler: (() => void) | null = null;

export async function startSync(userId: string): Promise<void> {
  if (activeUserId === userId) return;
  await stopSync();
  activeUserId = userId;
  supabase = createClient();

  if (typeof window !== "undefined") {
    onlineHandler = () => {
      setStatus("syncing");
      void flushNow();
    };
    offlineHandler = () => setStatus("offline");
    window.addEventListener("online", onlineHandler);
    window.addEventListener("offline", offlineHandler);
  }

  const hadLastSync = !!useSync.getState().lastSyncedAt;
  const dexieEmpty = db ? (await db.tasks.count()) + (await db.notes.count()) === 0 : true;
  const showOverlay = !hadLastSync && dexieEmpty;
  useSync.getState().setShowOverlay(showOverlay);

  setStatus("syncing");
  try {
    const { appliedAny } = await initialPull(userId);
    // If overlay was shown but nothing came down AND local is still empty,
    // the account is brand-new — skip the overlay.
    if (showOverlay && !appliedAny) {
      useSync.getState().setShowOverlay(false);
    } else if (showOverlay) {
      // Leave a beat for the spinner to feel intentional.
      setTimeout(() => useSync.getState().setShowOverlay(false), 400);
    }

    await catchUpPushOnce(userId);
    await refreshPendingCount();
    channel = subscribeRealtime(supabase, userId, (entity, row, ev) => {
      void onRealtime(entity, row, ev);
    });
    useSync.getState().setInitialPullComplete(true);
    await flushNow();
  } catch (err) {
    useSync.getState().setShowOverlay(false);
    setStatus("error");
  }
}

export async function stopSync(): Promise<void> {
  if (supabase && channel) {
    await unsubscribeRealtime(supabase, channel);
  }
  channel = null;
  activeUserId = null;
  if (typeof window !== "undefined") {
    if (onlineHandler) window.removeEventListener("online", onlineHandler);
    if (offlineHandler) window.removeEventListener("offline", offlineHandler);
    onlineHandler = null;
    offlineHandler = null;
  }
  useSync.getState().setInitialPullComplete(false);
  useSync.getState().setShowOverlay(false);
  setStatus("idle");
}

export function currentUserId(): string | null {
  return activeUserId;
}
