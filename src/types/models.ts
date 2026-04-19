export type TaskCategory = {
  id: string;
  name: string;
  color: string;
};

export type Subtask = { id: string; title: string; done: boolean };

export type Recurrence = {
  freq: "daily" | "weekly" | "monthly";
  until?: string;
  daysOfWeek?: number[];
};

export type Task = {
  id: string;
  title: string;
  notes?: string;
  linkedNoteId?: string;
  categoryId?: string;
  startAt: string;
  durationMin: number;
  completed: boolean;
  completedAt?: string;
  subtasks: Subtask[];
  reminderMin?: number;
  recurrence?: Recurrence;
  createdAt: string;
  updatedAt: string;
};

export type Note = {
  id: string;
  title: string;
  content: string;
  linkedTaskIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type CalendarEvent = {
  id: string;
  source: "local" | "ics" | "google";
  title: string;
  location?: string;
  startAt: string;
  endAt: string;
  allDay: boolean;
  description?: string;
};

export type PomodoroSession = {
  id: string;
  taskId?: string;
  startedAt: string;
  durationMin: number;
  completed: boolean;
  kind: "work" | "short-break" | "long-break";
};

export type Settings = {
  theme: "system" | "light" | "dark";
  pomodoro: {
    workMin: number;
    shortBreakMin: number;
    longBreakMin: number;
    cyclesBeforeLongBreak: number;
  };
  focusMode: {
    ambientSound: "none" | "brown-noise" | "rain" | "cafe";
    muteNotifications: boolean;
  };
  timelineHourHeight: number;
  weekStartsOn: 0 | 1;
  userName?: string;
  onboarded?: boolean;
};

export const CATEGORY_COLORS = [
  "#FF3B30",
  "#FF9F0A",
  "#FFD60A",
  "#30D158",
  "#64D2FF",
  "#0A84FF",
  "#BF5AF2",
  "#FF375F",
];
