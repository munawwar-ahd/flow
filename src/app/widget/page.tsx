"use client";
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { useTasks } from "@/stores/tasks";
import { usePomodoro } from "@/stores/pomodoro";
import { useUI } from "@/stores/ui";
import { db } from "@/lib/db";

function fmt(ms: number) {
  const s = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${m.toString().padStart(2, "0")}:${ss.toString().padStart(2, "0")}`;
}

export default function WidgetPage() {
  const [tick, setTick] = useState(0);
  const tasks = useTasks((s) => s.tasks);
  const load = useTasks((s) => s.load);
  const uiLoad = useUI((s) => s.load);
  const pom = usePomodoro((s) => s);

  useEffect(() => {
    if (db) {
      load();
      uiLoad();
      pom.loadSessions();
    }
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const upcoming = useMemo(() => {
    const now = Date.now();
    return tasks
      .filter((t) => !t.completed && new Date(t.startAt).getTime() + t.durationMin * 60_000 >= now)
      .sort((a, b) => a.startAt.localeCompare(b.startAt))
      .slice(0, 3);
  }, [tasks, tick]);

  const live = pom.running && pom.startedAt ? Math.max(0, pom.remainingMs - (Date.now() - pom.startedAt)) : pom.remainingMs;

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary p-4 font-sans">
      <div className="max-w-md mx-auto space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-micro uppercase tracking-wide text-text-tertiary">Today</div>
            <div className="text-headline">{format(new Date(), "EEE, d MMM")}</div>
          </div>
          <div className="rounded-card bg-bg-secondary border border-separator px-3 py-1.5 text-caption tabular-nums">
            {pom.running ? "🟢" : "⏸"} {fmt(live)}
          </div>
        </div>
        <div className="space-y-2">
          {upcoming.length === 0 && (
            <div className="rounded-card border border-separator bg-bg-secondary/60 p-3 text-caption text-text-tertiary text-center">
              No upcoming tasks.
            </div>
          )}
          {upcoming.map((t) => (
            <div
              key={t.id}
              className="rounded-card border border-separator bg-bg-elevated shadow-sm px-3 py-2.5"
            >
              <div className="text-headline truncate">{t.title}</div>
              <div className="text-caption text-text-secondary">
                {format(new Date(t.startAt), "h:mm a")} · {t.durationMin}m
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
