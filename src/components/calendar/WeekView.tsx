"use client";
import { useEffect, useMemo, useState } from "react";
import { addDays, format, isToday, startOfWeek } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import type { Task, TaskCategory, CalendarEvent } from "@/types/models";
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
  onDayClick?: (d: Date) => void;
};

const HOUR_ROW_PX = 80;
const GUTTER_PX = 72;
const OVERLAP_GAP_PX = 2;

/** Normalize an item to a timeline block descriptor. */
type Block = {
  id: string;
  title: string;
  startAt: string;
  durationMin: number;
  pastel: string;
  completed?: boolean;
  onClick?: () => void;
  // Filled in by the overlap packer:
  col: number;
  cols: number;
};

function minutesSinceStart(date: Date, startHour: number): number {
  return (date.getHours() - startHour) * 60 + date.getMinutes();
}

/** Assign {col, cols} to each block so overlapping items split the column. */
function packOverlaps(blocks: Block[]): Block[] {
  if (blocks.length === 0) return blocks;
  const sorted = [...blocks].sort((a, b) => a.startAt.localeCompare(b.startAt));
  const endOf = (b: Block) => new Date(b.startAt).getTime() + b.durationMin * 60_000;

  // Partition into overlap clusters.
  const clusters: Block[][] = [];
  for (const b of sorted) {
    const last = clusters[clusters.length - 1];
    const clusterMaxEnd = last
      ? last.reduce((m, x) => Math.max(m, endOf(x)), 0)
      : 0;
    if (!last || new Date(b.startAt).getTime() >= clusterMaxEnd) {
      clusters.push([b]);
    } else {
      last.push(b);
    }
  }

  for (const g of clusters) {
    const cols: Block[][] = [];
    for (const b of g) {
      let placed = false;
      for (let c = 0; c < cols.length; c++) {
        const prev = cols[c][cols[c].length - 1];
        if (new Date(b.startAt).getTime() >= endOf(prev)) {
          cols[c].push(b);
          b.col = c;
          placed = true;
          break;
        }
      }
      if (!placed) {
        cols.push([b]);
        b.col = cols.length - 1;
      }
    }
    const cnt = cols.length;
    for (const b of g) b.cols = cnt;
  }
  return sorted;
}

export function WeekView({
  anchor,
  days = 7,
  startHour = 6,
  endHour = 23,
  onEmptySlotClick,
  onDayClick,
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

  const weekHasAnything = useMemo(() => {
    const start = daysList[0];
    const end = addDays(daysList[daysList.length - 1], 1);
    const startMs = new Date(start).setHours(0, 0, 0, 0);
    const endMs = new Date(end).setHours(0, 0, 0, 0);
    const anyTask = tasks.some((t) => {
      const m = new Date(t.startAt).getTime();
      return m >= startMs && m < endMs;
    });
    if (anyTask) return true;
    return events.some((e) => {
      const m = new Date(e.startAt).getTime();
      return m >= startMs && m < endMs;
    });
  }, [tasks, events, daysList]);

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
        const isActive = +d === +anchor && days === 1;
        return (
          <motion.button
            key={d.toISOString()}
            type="button"
            onClick={() => onDayClick?.(d)}
            whileTap={{ scale: 0.98 }}
            transition={spring.snappy}
            aria-label={`${format(d, "EEEE")}, ${format(d, "d MMMM")} — open Day view`}
            className={cn(
              "group mx-1 mb-4 py-2.5 rounded-2xl text-center focus-ring transition-colors cursor-pointer",
              today
                ? "text-[color:var(--today-pill-ink)]"
                : isActive
                  ? "bg-bg-secondary text-text-primary"
                  : "text-text-primary hover:bg-bg-secondary/70"
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
          </motion.button>
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

      {!weekHasAnything && (
        <div
          className="pointer-events-none absolute inset-x-0 flex flex-col items-center justify-center text-center"
          style={{ top: 80, height: totalHeight }}
          aria-hidden
        >
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={spring.gentle}
          >
            <div className="text-body text-text-tertiary">
              {days === 1 ? "Nothing scheduled today" : "Nothing scheduled this week"}
            </div>
            <div className="text-caption text-text-tertiary/70 mt-1">
              Click any time to add an event
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

type DayColProps = {
  day: Date;
  hours: number[];
  startHour: number;
  totalHeight: number;
  tasks: Task[];
  events: CalendarEvent[];
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

  const blocks: Block[] = useMemo(() => {
    const out: Block[] = [];
    for (const t of tasks) {
      const s = new Date(t.startAt);
      if (s < dayStart || s >= dayEnd) continue;
      const cat = categories.find((c) => c.id === t.categoryId);
      out.push({
        id: `t:${t.id}`,
        title: t.title,
        startAt: t.startAt,
        durationMin: t.durationMin,
        pastel: pastelVar(cat ?? null),
        completed: t.completed,
        onClick: () => onSelectTask(t.id),
        col: 0,
        cols: 1,
      });
    }
    for (const e of events) {
      const s = new Date(e.startAt);
      if (s < dayStart || s >= dayEnd || e.allDay) continue;
      const durMin = Math.max(
        15,
        Math.round((new Date(e.endAt).getTime() - s.getTime()) / 60_000)
      );
      out.push({
        id: `e:${e.id}`,
        title: e.title,
        startAt: e.startAt,
        durationMin: durMin,
        pastel: "var(--event-1)",
        col: 0,
        cols: 1,
      });
    }
    return packOverlaps(out);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, events, categories, dayStart.getTime(), dayEnd.getTime()]);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onEmptySlotClick) return;
    if ((e.target as HTMLElement).closest("button")) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    // Round DOWN to the clicked hour per spec.
    const hoursFromStart = Math.max(0, Math.floor(y / HOUR_ROW_PX));
    const d = new Date(dayStart);
    d.setHours(startHour + hoursFromStart, 0, 0, 0);
    onEmptySlotClick(d.toISOString());
  };

  return (
    <div
      className="relative"
      style={{ height: totalHeight }}
      onClick={handleClick}
    >
      {/* Dashed hour lines */}
      {hours.map((_h, i) => (
        <div
          key={i}
          className="absolute left-0 right-0 border-t border-dashed border-separator/70"
          style={{ top: i * HOUR_ROW_PX }}
        />
      ))}

      {isToday(day) && (
        <NowIndicator startHour={startHour} endHour={hours[hours.length - 1]} />
      )}

      <AnimatePresence initial={false}>
        {blocks.map((b, i) => {
          const start = new Date(b.startAt);
          const mins = minutesSinceStart(start, startHour);
          const top = (mins / 60) * HOUR_ROW_PX;
          const height = Math.max(24, (b.durationMin / 60) * HOUR_ROW_PX);
          const widthPct = 100 / b.cols;
          const leftPct = b.col * widthPct;
          return (
            <EventBlock
              key={b.id}
              top={top}
              height={height}
              leftPct={leftPct}
              widthPct={widthPct}
              title={b.title}
              timeLabel={format(start, "HH:mm")}
              durationMin={b.durationMin}
              pastel={b.pastel}
              completed={b.completed}
              staggerIndex={i}
              onClick={b.onClick}
            />
          );
        })}
      </AnimatePresence>
    </div>
  );
}

function EventBlock({
  top,
  height,
  leftPct,
  widthPct,
  title,
  timeLabel,
  durationMin,
  pastel,
  completed,
  staggerIndex,
  onClick,
}: {
  top: number;
  height: number;
  leftPct: number;
  widthPct: number;
  title: string;
  timeLabel?: string;
  durationMin: number;
  pastel: string;
  completed?: boolean;
  staggerIndex: number;
  onClick?: () => void;
}) {
  // Tiered rendering by duration
  const tier = durationMin < 30 ? "xs" : durationMin < 60 ? "sm" : "md";

  const padding =
    tier === "xs" ? "px-2 py-1.5" : tier === "sm" ? "px-2.5 py-2" : "px-3 py-2.5";

  const titleClass =
    tier === "xs"
      ? "text-[11px] font-bold leading-tight"
      : tier === "sm"
        ? "text-[12px] font-bold leading-tight"
        : "text-[13px] font-bold leading-tight";

  const timeClass =
    tier === "sm"
      ? "text-[10px] font-semibold"
      : "text-[11px] font-semibold";

  return (
    <motion.button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: completed ? 0.55 : 1, y: 0 }}
      exit={{ opacity: 0, y: 4, scale: 0.94 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      transition={{ ...spring.gentle, delay: staggerIndex * 0.02 }}
      className={cn(
        "absolute rounded-xl overflow-hidden focus-ring text-left cursor-pointer",
        "shadow-sm hover:shadow-card transition-shadow",
        padding
      )}
      style={{
        top,
        height,
        left: `calc(${leftPct}% + ${leftPct > 0 ? OVERLAP_GAP_PX : 0}px)`,
        width: `calc(${widthPct}% - ${leftPct > 0 ? OVERLAP_GAP_PX * 2 : OVERLAP_GAP_PX}px)`,
        background: pastel,
      }}
    >
      {tier === "xs" ? (
        <div
          className={cn(titleClass, "truncate")}
          style={{ color: "var(--event-ink)" }}
        >
          {title}
        </div>
      ) : (
        <>
          {timeLabel && (
            <div
              className={cn(timeClass, "truncate")}
              style={{ color: "var(--event-ink-soft)" }}
            >
              {timeLabel}
            </div>
          )}
          <div
            className={cn(titleClass, "truncate")}
            style={{ color: "var(--event-ink)" }}
          >
            {title}
          </div>
        </>
      )}
    </motion.button>
  );
}

function NowIndicator({ startHour, endHour }: { startHour: number; endHour: number }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  const h = now.getHours() + now.getMinutes() / 60;
  if (h < startHour || h > endHour) return null;
  const top = (h - startHour) * HOUR_ROW_PX;
  return (
    <div
      className="pointer-events-none absolute left-0 right-0 z-20 flex items-center"
      style={{ top, transform: "translateY(-50%)" }}
      aria-hidden
    >
      <div className="w-2 h-2 -ml-1 rounded-full bg-danger shadow-[0_0_0_3px_rgba(255,59,48,0.15)]" />
      <div className="flex-1 h-[2px] bg-danger/85" />
    </div>
  );
}
