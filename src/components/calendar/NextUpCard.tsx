"use client";
import { useEffect, useMemo, useState } from "react";
import { differenceInMinutes, format } from "date-fns";
import { motion } from "framer-motion";
import { useTasks } from "@/stores/tasks";
import { useEvents } from "@/stores/events";
import { useUI } from "@/stores/ui";
import { pastelVar } from "@/lib/calendar/pastel";
import { cn } from "@/lib/cn";
import { spring, tap } from "@/lib/motion";

type Item = {
  id: string;
  title: string;
  startAt: string;
  color?: string;
  // "task" can be opened via TaskDetailSheet; "event" shows a read-only info.
  kind: "task" | "event";
};

export function NextUpCard() {
  const tasks = useTasks((s) => s.tasks);
  const events = useEvents((s) => s.events);
  const categories = useUI((s) => s.categories);
  const setActive = useUI((s) => s.setActiveTaskId);

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const next = useMemo<Item | null>(() => {
    const nowMs = now.getTime();
    const taskItems: Item[] = tasks
      .filter((t) => !t.completed && !t.deletedAt && new Date(t.startAt).getTime() > nowMs)
      .map((t) => ({
        id: t.id,
        title: t.title,
        startAt: t.startAt,
        color: categories.find((c) => c.id === t.categoryId)?.color,
        kind: "task" as const,
      }));
    const eventItems: Item[] = events
      .filter((e) => !e.deletedAt && new Date(e.startAt).getTime() > nowMs)
      .map((e) => ({
        id: e.id,
        title: e.title,
        startAt: e.startAt,
        kind: "event" as const,
      }));
    const all = [...taskItems, ...eventItems].sort((a, b) =>
      a.startAt.localeCompare(b.startAt)
    );
    return all[0] ?? null;
  }, [tasks, events, categories, now]);

  // Per spec: hide the card entirely when nothing upcoming.
  if (!next) return null;

  const start = new Date(next.startAt);
  const minsAway = Math.max(0, differenceInMinutes(start, now));
  const away =
    minsAway < 60
      ? `${minsAway} min`
      : minsAway < 60 * 24
        ? `${Math.round(minsAway / 60)} hr`
        : format(start, "EEE d");

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring.gentle}
      className="rounded-3xl p-5 shadow-card bg-bg-elevated"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="text-[11px] font-bold tracking-wide uppercase text-text-tertiary">
            Next up
          </div>
          <h3 className="text-headline truncate mt-1">{next.title}</h3>
          <div className="text-caption text-text-secondary mt-0.5">
            {format(start, "EEE · HH:mm")}
          </div>
        </div>
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{
            background: pastelVar({ color: next.color, id: next.id }),
            color: "var(--event-ink)",
          }}
        >
          {away}
        </span>
      </div>
      {next.kind === "task" ? (
        <motion.button
          whileTap={tap}
          transition={spring.snappy}
          onClick={() => setActive(next.id)}
          className={cn(
            "w-full py-2.5 rounded-xl text-[11px] font-bold",
            "bg-[color:var(--today-pill-bg)] text-[color:var(--today-pill-ink)]",
            "focus-ring"
          )}
        >
          Details
        </motion.button>
      ) : (
        <div className="text-caption text-text-tertiary">External event</div>
      )}
    </motion.div>
  );
}
