"use client";
import { useMemo } from "react";
import {
  addDays,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { motion } from "framer-motion";
import { useTasks } from "@/stores/tasks";
import { useEvents } from "@/stores/events";
import { useUI } from "@/stores/ui";
import { pastelVar } from "@/lib/calendar/pastel";
import { cn } from "@/lib/cn";
import { spring } from "@/lib/motion";

export function MonthView({
  month,
  onDayClick,
}: {
  month: Date;
  onDayClick: (d: Date) => void;
}) {
  const tasks = useTasks((s) => s.tasks);
  const events = useEvents((s) => s.events);
  const categories = useUI((s) => s.categories);
  const weekStart = useUI((s) => s.settings.weekStartsOn);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: weekStart });
    return Array.from({ length: 42 }, (_, i) => addDays(start, i));
  }, [month, weekStart]);

  const weekdayLabels = useMemo(() => {
    const base = startOfWeek(new Date(), { weekStartsOn: weekStart });
    return Array.from({ length: 7 }, (_, i) => format(addDays(base, i), "EEEEE"));
  }, [weekStart]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-7 border-b border-separator">
        {weekdayLabels.map((l, i) => (
          <div
            key={l + i}
            className="text-[10px] font-bold uppercase tracking-[0.1em] text-text-tertiary text-center py-3"
          >
            {l}
          </div>
        ))}
      </div>
      <div className="flex-1 grid grid-cols-7 grid-rows-6 min-h-0">
        {days.map((d, i) => {
          const inMonth = isSameMonth(d, month);
          const isTodayCell = isSameDay(d, today);
          const dayTasks = tasks.filter((t) => isSameDay(new Date(t.startAt), d));
          const dayEvents = events.filter((e) => isSameDay(new Date(e.startAt), d));
          const items = [
            ...dayTasks.map((t) => ({
              key: t.id,
              title: t.title,
              bg: pastelVar(categories.find((c) => c.id === t.categoryId) ?? null),
            })),
            ...dayEvents.map((e) => ({ key: e.id, title: e.title, bg: "var(--event-1)" })),
          ];
          return (
            <motion.button
              key={d.toISOString()}
              onClick={() => onDayClick(d)}
              className={cn(
                "relative text-left p-2 border-r border-b border-separator/70 hover:bg-bg-secondary/40 transition-colors min-h-0 flex flex-col",
                (i + 1) % 7 === 0 && "border-r-0",
                i >= 35 && "border-b-0",
                !inMonth && "opacity-40"
              )}
              whileTap={{ scale: 0.99 }}
              transition={spring.snappy}
            >
              <div className="flex items-center justify-center h-8">
                <div
                  className={cn(
                    "inline-flex items-center justify-center rounded-full tabular-nums transition-colors",
                    isTodayCell
                      ? "w-8 h-8 text-[13px] font-bold"
                      : "w-7 h-7 text-[12px] font-semibold text-text-primary"
                  )}
                  style={
                    isTodayCell
                      ? {
                          background: "var(--today-pill-bg)",
                          color: "var(--today-pill-ink)",
                          boxShadow: "var(--today-pill-shadow)",
                        }
                      : undefined
                  }
                >
                  {format(d, "d")}
                </div>
              </div>
              <div className="mt-1 space-y-1 overflow-hidden">
                {items.slice(0, 3).map((it) => (
                  <div
                    key={it.key}
                    className="rounded-md px-1.5 py-0.5 text-[10px] truncate"
                    style={{ background: it.bg, color: "var(--event-ink)" }}
                  >
                    {it.title}
                  </div>
                ))}
                {items.length > 3 && (
                  <div className="text-[10px] text-text-tertiary pl-1">
                    +{items.length - 3} more
                  </div>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
