import { create } from "zustand";
import { db, syncedBulkPut, syncedDelete, syncedPut, uid } from "@/lib/db";
import type { CalendarEvent } from "@/types/models";

type EventsState = {
  events: CalendarEvent[];
  loaded: boolean;
  load: () => Promise<void>;
  add: (e: Omit<CalendarEvent, "id" | "createdAt" | "updatedAt" | "deletedAt"> & { id?: string }) => Promise<CalendarEvent>;
  addMany: (events: CalendarEvent[]) => Promise<void>;
  remove: (id: string) => Promise<void>;
};

const nowIso = () => new Date().toISOString();

export const useEvents = create<EventsState>((set, get) => ({
  events: [],
  loaded: false,
  load: async () => {
    if (!db) return;
    const all = await db.events.toArray();
    const events = all.filter((e) => !e.deletedAt);
    set({ events, loaded: true });
  },
  add: async (e) => {
    const now = nowIso();
    const ev: CalendarEvent = {
      ...(e as Omit<CalendarEvent, "id" | "createdAt" | "updatedAt" | "deletedAt">),
      id: e.id ?? uid(),
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    await syncedPut("event", ev);
    set({ events: [...get().events, ev] });
    return ev;
  },
  addMany: async (events) => {
    const now = nowIso();
    const stamped = events.map((e) => ({
      ...e,
      createdAt: e.createdAt ?? now,
      updatedAt: e.updatedAt ?? now,
      deletedAt: e.deletedAt ?? null,
    }));
    await syncedBulkPut("event", stamped);
    set({ events: [...get().events, ...stamped] });
  },
  remove: async (id) => {
    await syncedDelete("event", id);
    set({ events: get().events.filter((x) => x.id !== id) });
  },
}));
