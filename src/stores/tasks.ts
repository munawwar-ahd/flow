import { create } from "zustand";
import { db, uid } from "@/lib/db";
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
    const tasks = await db.tasks.toArray();
    set({ tasks, loaded: true });
  },
  add: async (partial) => {
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
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    await db.tasks.put(t);
    set({ tasks: [...get().tasks, t] });
    return t;
  },
  update: async (id, patch) => {
    const t = get().tasks.find((x) => x.id === id);
    if (!t) return;
    const next = { ...t, ...patch, updatedAt: nowIso() };
    await db.tasks.put(next);
    set({ tasks: get().tasks.map((x) => (x.id === id ? next : x)) });
  },
  remove: async (id) => {
    await db.tasks.delete(id);
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
    await db.tasks.put(next);
    set({ tasks: get().tasks.map((x) => (x.id === id ? next : x)) });
  },
}));
