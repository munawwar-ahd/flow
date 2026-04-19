"use client";
import { useMemo } from "react";
import {
  addDays,
  addMonths,
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
    const out: Date[] = [];
    for (let i = 0; i < 42; i++) out.push(addDays(start, i));
    return out;
  }, [month, weekStart]);

  const weekdayLabels = useMemo(() => {
    const base = startOfWeek(new Date(), { weekStartsOn: weekStart });
    return Array.from({ length: 7 }, (_, i) => format(addDays(base, i), "EEEEEE"));
  }, [weekStart]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="grid grid-cols-7 border-b border-separator">
        {weekdayLabels.map((l) => (
          <div
            key={l}
            className="text-micro uppercase tracking-wide text-text-tertiary text-center py-2.5"
          >
            {l}
          </div>
        ))}
      </div>
      <div className="flex-1 grid grid-cols-7 grid-rows-6 min-h-0">
        {days.map((d, i) => {
          const inMonth = isSameMonth(d, month);
          const isToday = isSameDay(d, today);
          const dayTasks = tasks.filter((t) => isSameDay(new Date(t.startAt), d));
          const dayEvents = events.filter((e) => isSameDay(new Date(e.startAt), d));
          const items = [
            ...dayTasks.map((t) => ({
              key: t.id,
              title: t.title,
              color: categories.find((c) => c.id === t.categoryId)?.color ?? "var(--accent)",
            })),
            ...dayEvents.map((e) => ({ key: e.id, title: e.title, color: "var(--accent)" })),
          ];
          return (
            <motion.button
              key={d.toISOString()}
              onClick={() => onDayClick(d)}
              className={cn(
                "relative border-r border-b border-separator text-left p-1.5 hover:bg-bg-secondary/50 transition-colors min-h-0 flex flex-col",
                (i + 1) % 7 === 0 && "border-r-0",
                i >= 35 && "border-b-0",
                !inMonth && "opacity-40"
              )}
              whileTap={{ scale: 0.98 }}
              transition={spring.snappy}
            >
              <div className="flex items-center justify-center h-6">
                <span
                  className={cn(
                    "flex items-center justify-center w-6 h-6 rounded-full text-caption font-medium tabular-nums",
                    isToday ? "bg-accent text-white" : "text-text-primary"
                  )}
                >
                  {format(d, "d")}
                </span>
              </div>
              <div className="mt-1 space-y-0.5 overflow-hidden">
                {items.slice(0, 3).map((it) => (
                  <div
                    key={it.key}
                    className="flex items-center gap-1 text-[10px] truncate"
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: it.color }}
                    />
                    <span className="truncate text-text-secondary">{it.title}</span>
                  </div>
                ))}
                {items.length > 3 && (
                  <div className="text-[10px] text-text-tertiary">+{items.length - 3} more</div>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
