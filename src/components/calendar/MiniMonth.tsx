"use client";
import { useMemo } from "react";
import {
  addDays,
  addMonths,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { spring, tap } from "@/lib/motion";
import { useUI } from "@/stores/ui";

type Props = {
  month: Date;
  onMonthChange: (d: Date) => void;
  selected: Date;
  onSelect: (d: Date) => void;
};

export function MiniMonth({ month, onMonthChange, selected, onSelect }: Props) {
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
    <div className="select-none">
      <div className="flex items-center justify-between px-1 mb-3">
        <div className="text-[13px] font-bold tracking-tight">
          {format(month, "MMMM yyyy")}
        </div>
        <div className="flex items-center gap-0.5">
          <motion.button
            whileTap={tap}
            transition={spring.snappy}
            onClick={() => onMonthChange(addMonths(month, -1))}
            aria-label="Previous month"
            className="w-6 h-6 rounded-full text-text-tertiary hover:text-text-primary hover:bg-bg-elevated flex items-center justify-center"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </motion.button>
          <motion.button
            whileTap={tap}
            transition={spring.snappy}
            onClick={() => onMonthChange(addMonths(month, 1))}
            aria-label="Next month"
            className="w-6 h-6 rounded-full text-text-tertiary hover:text-text-primary hover:bg-bg-elevated flex items-center justify-center"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </motion.button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-y-1 text-center">
        {weekdayLabels.map((l, i) => (
          <span
            key={l + i}
            className="text-[10px] font-bold tracking-wide text-text-tertiary"
          >
            {l}
          </span>
        ))}
        {days.map((d) => {
          const inMonth = isSameMonth(d, month);
          const isTodayCell = isSameDay(d, today);
          const isSelected = isSameDay(d, selected);
          return (
            <motion.button
              key={d.toISOString()}
              whileTap={tap}
              transition={spring.snappy}
              onClick={() => onSelect(d)}
              className={cn(
                "mx-auto w-7 h-7 rounded-full text-[11px] tabular-nums flex items-center justify-center transition-colors",
                !inMonth && "text-text-tertiary/50",
                inMonth && !isTodayCell && !isSelected && "text-text-primary hover:bg-bg-elevated",
                isSelected && !isTodayCell && "bg-accent-soft text-accent font-semibold"
              )}
              style={
                isTodayCell
                  ? {
                      background: "var(--accent)",
                      color: "#fff",
                      fontWeight: 700,
                    }
                  : undefined
              }
            >
              {format(d, "d")}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
