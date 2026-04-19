"use client";
import { useMemo } from "react";
import { addDays, format, isSameDay, isToday, startOfWeek } from "date-fns";
import { motion } from "framer-motion";
import type { Task, TaskCategory } from "@/types/models";
import { useTasks } from "@/stores/tasks";
import { useEvents } from "@/stores/events";
import { useUI } from "@/stores/ui";
import { pastelVar } from "@/lib/calendar/pastel";
import { cn } from "@/lib/cn";
import { spring } from "@/lib/motion";

type Props = {
  anchor: Date;
  days?: number; // 1, 3, or 7
  startHour?: number;
  endHour?: number;
  onEmptySlotClick?: (iso: string) => void;
};

const HOUR_ROW_PX = 80; // matches reference dashed-grid
const GUTTER_PX = 72;

function minutesSinceStart(date: Date, startHour: number): number {
  return (date.getHours() - startHour) * 60 + date.getMinutes();
}

export function WeekView({
  anchor,
  days = 7,
  startHour = 6,
  endHour = 23,
  onEmptySlotClick,
}: Props) {
  const tasks = useTasks((s) => s.tasks);
  const events = useEvents((s) => s.events);
  const categories = useUI((s) => s.categories);
  const weekStartsOn = useUI((s) => s.settings.weekStartsOn);
  const setActive = useUI((s) => s.setActiveTaskId);

  const hours = useMemo(() => {
    const out: number[] = [];
    for (let h = startHour; h <= endHour; h++) out.push(h);
    return out;
  }, [startHour, endHour]);

  const daysList = useMemo(() => {
    if (days === 1) return [new Date(anchor)];
    const start =
      days === 7
        ? startOfWeek(anchor, { weekStartsOn })
        : addDays(anchor, -Math.floor((days - 1) / 2));
    return Array.from({ length: days }, (_, i) => addDays(start, i));
  }, [anchor, days, weekStartsOn]);

  const totalHeight = hours.length * HOUR_ROW_PX;

  return (
    <div
      className="relative"
      style={{
        display: "grid",
        gridTemplateColumns: `${GUTTER_PX}px repeat(${days}, minmax(0, 1fr))`,
      }}
    >
      {/* Weekday header */}
      <div />
      {daysList.map((d) => {
        const today = isToday(d);
        return (
          <div key={d.toISOString()} className="px-1 pb-4 flex flex-col items-center">
            <motion.div
              initial={false}
              animate={{ scale: today ? 1.03 : 1 }}
              transition={spring.gentle}
              className={cn(
                "w-full text-center py-2.5 rounded-2xl",
                today
                  ? "text-[color:var(--today-pill-ink)]"
                  : "text-text-primary"
              )}
              style={
                today
                  ? {
                      background: "var(--today-pill-bg)",
                      boxShadow: "var(--today-pill-shadow)",
                    }
                  : undefined
              }
            >
              <div
                className={cn(
                  "text-[10px] font-bold tracking-[0.1em] mb-1",
                  today ? "opacity-70" : "text-text-tertiary"
                )}
              >
                {format(d, "EEE").toUpperCase()}
              </div>
              <div className="text-xl font-bold tabular-nums leading-none">
                {format(d, "d")}
              </div>
            </motion.div>
          </div>
        );
      })}

      {/* Time gutter */}
      <div className="relative" style={{ height: totalHeight }}>
        {hours.map((h, i) => (
          <div
            key={h}
            className="absolute left-0 right-0 pr-3 text-right text-[11px] font-semibold tracking-wide text-text-tertiary"
            style={{ top: i * HOUR_ROW_PX - 6 }}
          >
            {String(h).padStart(2, "0")}:00
          </div>
        ))}
      </div>

      {/* Day columns */}
      {daysList.map((d) => (
        <DayColumn
          key={d.toISOString()}
          day={d}
          hours={hours}
          startHour={startHour}
          totalHeight={totalHeight}
          tasks={tasks}
          events={events}
          categories={categories}
          onSelectTask={(id) => setActive(id)}
          onEmptySlotClick={onEmptySlotClick}
        />
      ))}
    </div>
  );
}

type DayColProps = {
  day: Date;
  hours: number[];
  startHour: number;
  totalHeight: number;
  tasks: Task[];
  events: ReturnType<typeof useEvents.getState>["events"];
  categories: TaskCategory[];
  onSelectTask: (id: string) => void;
  onEmptySlotClick?: (iso: string) => void;
};

function DayColumn({
  day,
  hours,
  startHour,
  totalHeight,
  tasks,
  events,
  categories,
  onSelectTask,
  onEmptySlotClick,
}: DayColProps) {
  const dayStart = new Date(day);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const dayTasks = tasks.filter((t) => {
    const s = new Date(t.startAt);
    return s >= dayStart && s < dayEnd;
  });
  const dayEvents = events.filter((e) => {
    const s = new Date(e.startAt);
    return s >= dayStart && s < dayEnd && !e.allDay;
  });

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onEmptySlotClick) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const totalMin = Math.round(((y / HOUR_ROW_PX) * 60) / 15) * 15;
    const d = new Date(dayStart);
    d.setHours(startHour, 0, 0, 0);
    d.setMinutes(d.getMinutes() + totalMin);
    onEmptySlotClick(d.toISOString());
  };

  return (
    <div
      className="relative"
      style={{ height: totalHeight }}
      onDoubleClick={handleClick}
    >
      {/* Dashed hour lines */}
      {hours.map((_h, i) => (
        <div
          key={i}
          className="absolute left-0 right-0 border-t border-dashed border-separator/70"
          style={{ top: i * HOUR_ROW_PX }}
        />
      ))}

      {/* Task blocks */}
      {dayTasks.map((t) => {
        const start = new Date(t.startAt);
        const mins = minutesSinceStart(start, startHour);
        const top = (mins / 60) * HOUR_ROW_PX;
        const height = Math.max(36, (t.durationMin / 60) * HOUR_ROW_PX);
        const cat = categories.find((c) => c.id === t.categoryId);
        return (
          <EventBlock
            key={t.id}
            top={top}
            height={height}
            title={t.title}
            timeLabel={format(start, "HH:mm")}
            pastel={pastelVar(cat ?? null)}
            completed={t.completed}
            onClick={() => onSelectTask(t.id)}
          />
        );
      })}

      {/* External events */}
      {dayEvents.map((e) => {
        const start = new Date(e.startAt);
        const end = new Date(e.endAt);
        const mins = minutesSinceStart(start, startHour);
        const top = (mins / 60) * HOUR_ROW_PX;
        const durMin = Math.max(15, (end.getTime() - start.getTime()) / 60000);
        const height = Math.max(36, (durMin / 60) * HOUR_ROW_PX);
        return (
          <EventBlock
            key={e.id}
            top={top}
            height={height}
            title={e.title}
            timeLabel={format(start, "HH:mm")}
            pastel="var(--event-1)"
          />
        );
      })}
    </div>
  );
}

function EventBlock({
  top,
  height,
  title,
  timeLabel,
  pastel,
  completed,
  onClick,
}: {
  top: number;
  height: number;
  title: string;
  timeLabel?: string;
  pastel: string;
  completed?: boolean;
  onClick?: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      initial={false}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.99 }}
      transition={spring.gentle}
      className={cn(
        "absolute left-1 right-1 rounded-xl p-3 text-left overflow-hidden focus-ring",
        "shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.05)]",
        completed && "opacity-60"
      )}
      style={{ top, height, background: pastel }}
    >
      {timeLabel && (
        <div
          className="text-[10px] font-semibold"
          style={{ color: "var(--event-ink-soft)" }}
        >
          {timeLabel}
        </div>
      )}
      <div
        className={cn(
          "text-[12px] font-bold leading-tight truncate",
          completed && "line-through"
        )}
        style={{ color: "var(--event-ink)" }}
      >
        {title}
      </div>
    </motion.button>
  );
}
