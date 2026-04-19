"use client";
import { useMemo } from "react";
import { addDays, startOfWeek } from "date-fns";
import { motion } from "framer-motion";
import { useTasks } from "@/stores/tasks";
import { useUI } from "@/stores/ui";
import { spring } from "@/lib/motion";

export function CategoryProgress({ anchor }: { anchor: Date }) {
  const tasks = useTasks((s) => s.tasks);
  const categories = useUI((s) => s.categories);
  const weekStart = useUI((s) => s.settings.weekStartsOn);

  const rows = useMemo(() => {
    const start = startOfWeek(anchor, { weekStartsOn: weekStart });
    const end = addDays(start, 7);
    const inWeek = tasks.filter((t) => {
      const s = new Date(t.startAt);
      return s >= start && s < end;
    });
    const total = inWeek.reduce((a, t) => a + t.durationMin, 0);
    return categories.map((c) => {
      const mins = inWeek
        .filter((t) => t.categoryId === c.id)
        .reduce((a, t) => a + t.durationMin, 0);
      const pct = total > 0 ? Math.round((mins / total) * 100) : 0;
      return { id: c.id, name: c.name, color: c.color, pct };
    });
  }, [tasks, categories, anchor, weekStart]);

  if (rows.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="text-[11px] font-bold tracking-wide uppercase text-text-tertiary">
        This week
      </div>
      {rows.map((r) => (
        <div key={r.id} className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[11px] font-medium">
            <span className="flex items-center gap-2 text-text-primary">
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: r.color }}
              />
              {r.name}
            </span>
            <span className="text-text-tertiary tabular-nums">{r.pct}%</span>
          </div>
          <div className="w-full bg-bg-secondary h-1 rounded-full overflow-hidden">
            <motion.div
              initial={false}
              animate={{ width: `${r.pct}%` }}
              transition={spring.gentle}
              className="h-full rounded-full"
              style={{ background: r.color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
