import { create } from "zustand";
import { db, uid } from "@/lib/db";
import type { CalendarEvent } from "@/types/models";

type EventsState = {
  events: CalendarEvent[];
  loaded: boolean;
  load: () => Promise<void>;
  add: (e: Omit<CalendarEvent, "id"> & { id?: string }) => Promise<CalendarEvent>;
  addMany: (events: CalendarEvent[]) => Promise<void>;
  remove: (id: string) => Promise<void>;
};

export const useEvents = create<EventsState>((set, get) => ({
  events: [],
  loaded: false,
  load: async () => {
    if (!db) return;
    const events = await db.events.toArray();
    set({ events, loaded: true });
  },
  add: async (e) => {
    const ev: CalendarEvent = { ...(e as CalendarEvent), id: e.id ?? uid() };
    await db.events.put(ev);
    set({ events: [...get().events, ev] });
    return ev;
  },
  addMany: async (events) => {
    await db.events.bulkPut(events);
    set({ events: [...get().events, ...events] });
  },
  remove: async (id) => {
    await db.events.delete(id);
    set({ events: get().events.filter((x) => x.id !== id) });
  },
}));
