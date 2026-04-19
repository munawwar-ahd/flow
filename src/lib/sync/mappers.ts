import type {
  Task,
  Note,
  CalendarEvent,
  PomodoroSession,
  TaskCategory,
  Settings,
  SyncEntity,
} from "@/types/models";
import type {
  DBTask,
  DBNote,
  DBEvent,
  DBSession,
  DBCategory,
  DBSettings,
} from "@/types/database";
import type { StoredSettings } from "@/lib/db";

const nowIso = () => new Date().toISOString();
const orNull = <T>(v: T | undefined): T | null => (v === undefined ? null : v);

// ───── Task ─────
export function taskToSupabase(t: Task, userId: string): DBTask {
  return {
    id: t.id,
    user_id: userId,
    title: t.title,
    notes: orNull(t.notes),
    linked_note_id: orNull(t.linkedNoteId),
    category_id: orNull(t.categoryId),
    start_at: t.startAt,
    duration_min: t.durationMin,
    completed: t.completed,
    completed_at: orNull(t.completedAt),
    subtasks: t.subtasks ?? [],
    reminder_min: orNull(t.reminderMin),
    recurrence: t.recurrence
      ? {
          freq: t.recurrence.freq,
          until: t.recurrence.until ?? null,
          days_of_week: t.recurrence.daysOfWeek ?? null,
        }
      : null,
    created_at: t.createdAt,
    updated_at: t.updatedAt,
    deleted_at: t.deletedAt ?? null,
  };
}

export function taskFromSupabase(r: DBTask): Task {
  return {
    id: r.id,
    title: r.title,
    notes: r.notes ?? undefined,
    linkedNoteId: r.linked_note_id ?? undefined,
    categoryId: r.category_id ?? undefined,
    startAt: r.start_at,
    durationMin: r.duration_min,
    completed: r.completed,
    completedAt: r.completed_at ?? undefined,
    subtasks: r.subtasks ?? [],
    reminderMin: r.reminder_min ?? undefined,
    recurrence: r.recurrence
      ? {
          freq: r.recurrence.freq,
          until: r.recurrence.until ?? undefined,
          daysOfWeek: r.recurrence.days_of_week ?? undefined,
        }
      : undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    deletedAt: r.deleted_at,
  };
}

// ───── Note ─────
export function noteToSupabase(n: Note, userId: string): DBNote {
  return {
    id: n.id,
    user_id: userId,
    title: n.title,
    content: n.content,
    linked_task_ids: n.linkedTaskIds ?? [],
    created_at: n.createdAt,
    updated_at: n.updatedAt,
    deleted_at: n.deletedAt ?? null,
  };
}
export function noteFromSupabase(r: DBNote): Note {
  return {
    id: r.id,
    title: r.title,
    content: r.content,
    linkedTaskIds: r.linked_task_ids ?? [],
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    deletedAt: r.deleted_at,
  };
}

// ───── Event ─────
export function eventToSupabase(e: CalendarEvent, userId: string): DBEvent {
  return {
    id: e.id,
    user_id: userId,
    source: e.source,
    title: e.title,
    location: orNull(e.location),
    start_at: e.startAt,
    end_at: e.endAt,
    all_day: e.allDay,
    description: orNull(e.description),
    created_at: e.createdAt,
    updated_at: e.updatedAt,
    deleted_at: e.deletedAt ?? null,
  };
}
export function eventFromSupabase(r: DBEvent): CalendarEvent {
  return {
    id: r.id,
    source: r.source,
    title: r.title,
    location: r.location ?? undefined,
    startAt: r.start_at,
    endAt: r.end_at,
    allDay: r.all_day,
    description: r.description ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    deletedAt: r.deleted_at,
  };
}

// ───── PomodoroSession ─────
export function sessionToSupabase(s: PomodoroSession, userId: string): DBSession {
  return {
    id: s.id,
    user_id: userId,
    task_id: orNull(s.taskId),
    started_at: s.startedAt,
    duration_min: s.durationMin,
    completed: s.completed,
    kind: s.kind,
    created_at: s.createdAt,
    updated_at: s.updatedAt,
    deleted_at: s.deletedAt ?? null,
  };
}
export function sessionFromSupabase(r: DBSession): PomodoroSession {
  return {
    id: r.id,
    taskId: r.task_id ?? undefined,
    startedAt: r.started_at,
    durationMin: r.duration_min,
    completed: r.completed,
    kind: r.kind,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    deletedAt: r.deleted_at,
  };
}

// ───── Category ─────
export function categoryToSupabase(c: TaskCategory, userId: string): DBCategory {
  return {
    id: c.id,
    user_id: userId,
    name: c.name,
    color: c.color,
    created_at: c.createdAt,
    updated_at: c.updatedAt,
    deleted_at: c.deletedAt ?? null,
  };
}
export function categoryFromSupabase(r: DBCategory): TaskCategory {
  return {
    id: r.id,
    name: r.name,
    color: r.color,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    deletedAt: r.deleted_at,
  };
}

// ───── Settings ─────
/**
 * Local settings row is always stored with id="singleton". Cloud row is
 * user-scoped. We keep the local id constant; cloud row uses user_id.
 */
export function settingsToSupabase(s: StoredSettings, userId: string): DBSettings {
  return {
    id: userId,
    user_id: userId,
    theme: s.theme,
    pomodoro_work_min: s.pomodoro.workMin,
    pomodoro_short_break_min: s.pomodoro.shortBreakMin,
    pomodoro_long_break_min: s.pomodoro.longBreakMin,
    pomodoro_cycles_before_long_break: s.pomodoro.cyclesBeforeLongBreak,
    focus_ambient_sound: s.focusMode.ambientSound,
    focus_mute_notifications: s.focusMode.muteNotifications,
    timeline_hour_height: s.timelineHourHeight,
    week_starts_on: s.weekStartsOn,
    user_name: orNull(s.userName),
    onboarded: Boolean(s.onboarded),
    created_at: s.createdAt ?? nowIso(),
    updated_at: s.updatedAt ?? nowIso(),
    deleted_at: null,
  };
}
export function settingsFromSupabase(r: DBSettings): StoredSettings {
  return {
    id: "singleton",
    theme: r.theme,
    pomodoro: {
      workMin: r.pomodoro_work_min,
      shortBreakMin: r.pomodoro_short_break_min,
      longBreakMin: r.pomodoro_long_break_min,
      cyclesBeforeLongBreak: r.pomodoro_cycles_before_long_break,
    },
    focusMode: {
      ambientSound: r.focus_ambient_sound,
      muteNotifications: r.focus_mute_notifications,
    },
    timelineHourHeight: r.timeline_hour_height,
    weekStartsOn: r.week_starts_on,
    userName: r.user_name ?? undefined,
    onboarded: r.onboarded,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

// ───── Dispatch helpers for the engine ─────
export type EntityRowMap = {
  task: DBTask;
  note: DBNote;
  event: DBEvent;
  session: DBSession;
  category: DBCategory;
  settings: DBSettings;
};

type LocalFor<E extends SyncEntity> = E extends "task"
  ? Task
  : E extends "note"
    ? Note
    : E extends "event"
      ? CalendarEvent
      : E extends "session"
        ? PomodoroSession
        : E extends "category"
          ? TaskCategory
          : E extends "settings"
            ? StoredSettings
            : never;

export function toSupabase<E extends SyncEntity>(
  entity: E,
  record: LocalFor<E>,
  userId: string
): EntityRowMap[E] {
  switch (entity) {
    case "task":
      return taskToSupabase(record as Task, userId) as EntityRowMap[E];
    case "note":
      return noteToSupabase(record as Note, userId) as EntityRowMap[E];
    case "event":
      return eventToSupabase(record as CalendarEvent, userId) as EntityRowMap[E];
    case "session":
      return sessionToSupabase(record as PomodoroSession, userId) as EntityRowMap[E];
    case "category":
      return categoryToSupabase(record as TaskCategory, userId) as EntityRowMap[E];
    case "settings":
      return settingsToSupabase(record as StoredSettings, userId) as EntityRowMap[E];
  }
  throw new Error(`Unknown entity ${entity}`);
}

export function fromSupabase<E extends SyncEntity>(
  entity: E,
  row: EntityRowMap[E]
): LocalFor<E> {
  switch (entity) {
    case "task":
      return taskFromSupabase(row as DBTask) as LocalFor<E>;
    case "note":
      return noteFromSupabase(row as DBNote) as LocalFor<E>;
    case "event":
      return eventFromSupabase(row as DBEvent) as LocalFor<E>;
    case "session":
      return sessionFromSupabase(row as DBSession) as LocalFor<E>;
    case "category":
      return categoryFromSupabase(row as DBCategory) as LocalFor<E>;
    case "settings":
      return settingsFromSupabase(row as DBSettings) as LocalFor<E>;
  }
  throw new Error(`Unknown entity ${entity}`);
}
