import { create } from "zustand";
import { db, uid } from "@/lib/db";
import type { PomodoroSession } from "@/types/models";

type PomKind = "work" | "short-break" | "long-break";

type PomState = {
  kind: PomKind;
  running: boolean;
  startedAt: number | null;
  remainingMs: number;
  totalMs: number;
  linkedTaskId: string | null;
  cyclesCompleted: number;
  focusMode: boolean;
  sessions: PomodoroSession[];
  loadSessions: () => Promise<void>;
  setLinkedTask: (id: string | null) => void;
  setFocusMode: (on: boolean) => void;
  configure: (workMin: number, shortBreakMin: number, longBreakMin: number) => void;
  start: () => void;
  pause: () => void;
  reset: () => void;
  tick: () => void;
  completeSession: () => Promise<void>;
  setKind: (k: PomKind, minutes: number) => void;
};

export const usePomodoro = create<PomState>((set, get) => ({
  kind: "work",
  running: false,
  startedAt: null,
  remainingMs: 25 * 60 * 1000,
  totalMs: 25 * 60 * 1000,
  linkedTaskId: null,
  cyclesCompleted: 0,
  focusMode: false,
  sessions: [],
  loadSessions: async () => {
    if (!db) return;
    const sessions = await db.sessions.toArray();
    set({ sessions });
  },
  setLinkedTask: (id) => set({ linkedTaskId: id }),
  setFocusMode: (on) => set({ focusMode: on }),
  configure: (workMin) => {
    const ms = workMin * 60 * 1000;
    if (!get().running && get().kind === "work") {
      set({ remainingMs: ms, totalMs: ms });
    }
  },
  setKind: (k, minutes) => {
    const ms = minutes * 60 * 1000;
    set({ kind: k, remainingMs: ms, totalMs: ms, running: false, startedAt: null });
  },
  start: () => {
    if (get().running) return;
    set({ running: true, startedAt: Date.now() });
  },
  pause: () => {
    if (!get().running) return;
    const { startedAt, remainingMs } = get();
    if (startedAt) {
      const elapsed = Date.now() - startedAt;
      set({ remainingMs: Math.max(0, remainingMs - elapsed), running: false, startedAt: null });
    } else {
      set({ running: false });
    }
  },
  reset: () => {
    const { totalMs } = get();
    set({ running: false, startedAt: null, remainingMs: totalMs });
  },
  tick: () => {
    const { running, startedAt, remainingMs } = get();
    if (!running || !startedAt) return;
    const elapsed = Date.now() - startedAt;
    const rem = remainingMs - elapsed;
    if (rem <= 0) {
      get().completeSession();
    }
  },
  completeSession: async () => {
    const { kind, totalMs, linkedTaskId, cyclesCompleted } = get();
    const session: PomodoroSession = {
      id: uid(),
      taskId: linkedTaskId ?? undefined,
      startedAt: new Date(Date.now() - totalMs).toISOString(),
      durationMin: Math.round(totalMs / 60000),
      completed: true,
      kind,
    };
    if (db) await db.sessions.put(session);
    set({ sessions: [...get().sessions, session] });

    if (kind === "work") {
      set({ cyclesCompleted: cyclesCompleted + 1 });
    }
    set({ running: false, startedAt: null, remainingMs: 0 });
  },
}));

export const pomSelectors = {
  liveRemainingMs: (s: PomState) => {
    if (!s.running || !s.startedAt) return s.remainingMs;
    return Math.max(0, s.remainingMs - (Date.now() - s.startedAt));
  },
};
