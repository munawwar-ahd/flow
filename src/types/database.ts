export type Timestamps = {
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type DBTask = Timestamps & {
  id: string;
  user_id: string;
  title: string;
  notes: string | null;
  linked_note_id: string | null;
  category_id: string | null;
  start_at: string;
  duration_min: number;
  completed: boolean;
  completed_at: string | null;
  subtasks: { id: string; title: string; done: boolean }[];
  reminder_min: number | null;
  recurrence:
    | {
        freq: "daily" | "weekly" | "monthly";
        until?: string | null;
        days_of_week?: number[] | null;
      }
    | null;
};

export type DBNote = Timestamps & {
  id: string;
  user_id: string;
  title: string;
  content: string;
  linked_task_ids: string[];
};

export type DBEvent = Timestamps & {
  id: string;
  user_id: string;
  source: "local" | "ics" | "google";
  title: string;
  location: string | null;
  start_at: string;
  end_at: string;
  all_day: boolean;
  description: string | null;
};

export type DBSession = Timestamps & {
  id: string;
  user_id: string;
  task_id: string | null;
  started_at: string;
  duration_min: number;
  completed: boolean;
  kind: "work" | "short-break" | "long-break";
};

export type DBCategory = Timestamps & {
  id: string;
  user_id: string;
  name: string;
  color: string;
};

export type DBSettings = Timestamps & {
  id: string;
  user_id: string;
  theme: "system" | "light" | "dark";
  pomodoro_work_min: number;
  pomodoro_short_break_min: number;
  pomodoro_long_break_min: number;
  pomodoro_cycles_before_long_break: number;
  focus_ambient_sound: "none" | "brown-noise" | "rain" | "cafe";
  focus_mute_notifications: boolean;
  timeline_hour_height: number;
  week_starts_on: 0 | 1;
  user_name: string | null;
  onboarded: boolean;
};

export type Database = {
  public: {
    Tables: {
      tasks: { Row: DBTask; Insert: DBTask; Update: Partial<DBTask> };
      notes: { Row: DBNote; Insert: DBNote; Update: Partial<DBNote> };
      events: { Row: DBEvent; Insert: DBEvent; Update: Partial<DBEvent> };
      pomodoro_sessions: { Row: DBSession; Insert: DBSession; Update: Partial<DBSession> };
      categories: { Row: DBCategory; Insert: DBCategory; Update: Partial<DBCategory> };
      settings: { Row: DBSettings; Insert: DBSettings; Update: Partial<DBSettings> };
    };
  };
};

export const SUPABASE_TABLE: Record<string, keyof Database["public"]["Tables"]> = {
  task: "tasks",
  note: "notes",
  event: "events",
  session: "pomodoro_sessions",
  category: "categories",
  settings: "settings",
};
