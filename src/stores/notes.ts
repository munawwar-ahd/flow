import { create } from "zustand";
import { db, syncedDelete, syncedPut, uid } from "@/lib/db";
import type { Note } from "@/types/models";

type NotesState = {
  notes: Note[];
  loaded: boolean;
  load: () => Promise<void>;
  add: (partial?: Partial<Note>) => Promise<Note>;
  update: (id: string, patch: Partial<Note>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  linkTask: (noteId: string, taskId: string) => Promise<void>;
};

const nowIso = () => new Date().toISOString();

export const useNotes = create<NotesState>((set, get) => ({
  notes: [],
  loaded: false,
  load: async () => {
    if (!db) return;
    const all = await db.notes.toArray();
    const notes = all.filter((n) => !n.deletedAt);
    notes.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    set({ notes, loaded: true });
  },
  add: async (partial) => {
    const now = nowIso();
    const n: Note = {
      id: uid(),
      title: partial?.title ?? "New Note",
      content: partial?.content ?? "",
      linkedTaskIds: partial?.linkedTaskIds ?? [],
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    await syncedPut("note", n);
    set({ notes: [n, ...get().notes] });
    return n;
  },
  update: async (id, patch) => {
    const n = get().notes.find((x) => x.id === id);
    if (!n) return;
    const next = { ...n, ...patch, updatedAt: nowIso() };
    await syncedPut("note", next);
    const notes = get().notes.map((x) => (x.id === id ? next : x));
    notes.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    set({ notes });
  },
  remove: async (id) => {
    await syncedDelete("note", id);
    set({ notes: get().notes.filter((x) => x.id !== id) });
  },
  linkTask: async (noteId, taskId) => {
    const n = get().notes.find((x) => x.id === noteId);
    if (!n) return;
    if (n.linkedTaskIds.includes(taskId)) return;
    const next = { ...n, linkedTaskIds: [...n.linkedTaskIds, taskId], updatedAt: nowIso() };
    await syncedPut("note", next);
    set({ notes: get().notes.map((x) => (x.id === noteId ? next : x)) });
  },
}));
