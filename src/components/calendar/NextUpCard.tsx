"use client";
import { useEffect, useMemo, useState } from "react";
import { differenceInMinutes, format } from "date-fns";
import { motion } from "framer-motion";
import { useTasks } from "@/stores/tasks";
import { useUI } from "@/stores/ui";
import { pastelVar } from "@/lib/calendar/pastel";
import { cn } from "@/lib/cn";
import { spring, tap } from "@/lib/motion";

export function NextUpCard() {
  const tasks = useTasks((s) => s.tasks);
  const categories = useUI((s) => s.categories);
  const setActive = useUI((s) => s.setActiveTaskId);

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const next = useMemo(() => {
    const future = tasks
      .filter((t) => !t.completed && new Date(t.startAt) > now)
      .sort((a, b) => a.startAt.localeCompare(b.startAt));
    return future[0] ?? null;
  }, [tasks, now]);

  if (!next) {
    return (
      <div
        className="rounded-[1.75rem] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)] bg-bg-elevated"
      >
        <div className="text-[11px] font-bold tracking-wide uppercase text-text-tertiary">
          Next up
        </div>
        <div className="text-body text-text-secondary mt-2">
          Nothing upcoming.
        </div>
      </div>
    );
  }

  const cat = categories.find((c) => c.id === next.categoryId) ?? null;
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
      className="rounded-[1.75rem] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)] bg-bg-elevated"
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
          style={{ background: pastelVar(cat), color: "var(--event-ink)" }}
        >
          {away}
        </span>
      </div>
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
    </motion.div>
  );
}
