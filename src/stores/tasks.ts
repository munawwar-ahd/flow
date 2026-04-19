import { create } from "zustand";
import { db, syncedDelete, syncedPut, uid } from "@/lib/db";
import type { Task } from "@/types/models";

type TasksState = {
  tasks: Task[];
  loaded: boolean;
  load: () => Promise<void>;
  add: (partial: Partial<Task> & { title: string; startAt: string; durationMin: number }) => Promise<Task>;
  update: (id: string, patch: Partial<Task>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  toggle: (id: string) => Promise<void>;
};

const nowIso = () => new Date().toISOString();

export const useTasks = create<TasksState>((set, get) => ({
  tasks: [],
  loaded: false,
  load: async () => {
    if (!db) return;
    const all = await db.tasks.toArray();
    const tasks = all.filter((t) => !t.deletedAt);
    set({ tasks, loaded: true });
  },
  add: async (partial) => {
    const now = nowIso();
    const t: Task = {
      id: uid(),
      title: partial.title,
      notes: partial.notes,
      linkedNoteId: partial.linkedNoteId,
      categoryId: partial.categoryId,
      startAt: partial.startAt,
      durationMin: partial.durationMin,
      completed: false,
      subtasks: partial.subtasks ?? [],
      reminderMin: partial.reminderMin,
      recurrence: partial.recurrence,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    await syncedPut("task", t);
    set({ tasks: [...get().tasks, t] });
    return t;
  },
  update: async (id, patch) => {
    const t = get().tasks.find((x) => x.id === id);
    if (!t) return;
    const next = { ...t, ...patch, updatedAt: nowIso() };
    await syncedPut("task", next);
    set({ tasks: get().tasks.map((x) => (x.id === id ? next : x)) });
  },
  remove: async (id) => {
    await syncedDelete("task", id);
    set({ tasks: get().tasks.filter((x) => x.id !== id) });
  },
  toggle: async (id) => {
    const t = get().tasks.find((x) => x.id === id);
    if (!t) return;
    const completed = !t.completed;
    const next: Task = {
      ...t,
      completed,
      completedAt: completed ? nowIso() : undefined,
      updatedAt: nowIso(),
    };
    await syncedPut("task", next);
    set({ tasks: get().tasks.map((x) => (x.id === id ? next : x)) });
  },
}));
