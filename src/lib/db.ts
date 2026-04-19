import Dexie, { type Table } from "dexie";
import type {
  Task,
  Note,
  CalendarEvent,
  PomodoroSession,
  TaskCategory,
  Settings,
} from "@/types/models";

export type StoredSettings = Settings & { id: "singleton" };

export class FlowDB extends Dexie {
  tasks!: Table<Task, string>;
  notes!: Table<Note, string>;
  events!: Table<CalendarEvent, string>;
  sessions!: Table<PomodoroSession, string>;
  categories!: Table<TaskCategory, string>;
  settings!: Table<StoredSettings, string>;

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

export const DEFAULT_CATEGORIES: TaskCategory[] = [
  { id: "cat-work", name: "Work", color: "#0A84FF" },
  { id: "cat-personal", name: "Personal", color: "#BF5AF2" },
  { id: "cat-health", name: "Health", color: "#30D158" },
  { id: "cat-study", name: "Study", color: "#FF9F0A" },
];

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
