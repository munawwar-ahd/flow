"use client";
import { useEffect, useMemo, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { HourGutter } from "./HourGutter";
import { NowIndicator } from "./NowIndicator";
import { TaskBlock } from "./TaskBlock";
import { useTasks } from "@/stores/tasks";
import { useUI } from "@/stores/ui";
import { useEvents } from "@/stores/events";
import { usePomodoro } from "@/stores/pomodoro";
import type { Task } from "@/types/models";

type Props = {
  day: Date;
  startHour?: number;
  endHour?: number;
  onEmptyTimeClick?: (iso: string) => void;
  compact?: boolean;
};

type PositionedTask = {
  task: Task;
  col: number;
  cols: number;
};

function layoutTasks(tasks: Task[]): PositionedTask[] {
  const sorted = [...tasks].sort((a, b) => a.startAt.localeCompare(b.startAt));
  const groups: Task[][] = [];
  for (const t of sorted) {
    const tStart = new Date(t.startAt).getTime();
    const tEnd = tStart + t.durationMin * 60_000;
    let placed = false;
    for (const g of groups) {
      const last = g[g.length - 1];
      const lastEnd = new Date(last.startAt).getTime() + last.durationMin * 60_000;
      if (tStart < lastEnd) {
        g.push(t);
        placed = true;
        break;
      }
    }
    if (!placed) groups.push([t]);
  }

  const result: PositionedTask[] = [];
  for (const g of groups) {
    const cols: Task[][] = [];
    for (const t of g) {
      const tStart = new Date(t.startAt).getTime();
      let placedCol = -1;
      for (let c = 0; c < cols.length; c++) {
        const last = cols[c][cols[c].length - 1];
        const lastEnd = new Date(last.startAt).getTime() + last.durationMin * 60_000;
        if (tStart >= lastEnd) {
          cols[c].push(t);
          placedCol = c;
          break;
        }
      }
      if (placedCol === -1) {
        cols.push([t]);
        placedCol = cols.length - 1;
      }
      result.push({ task: t, col: placedCol, cols: 0 });
    }
    const colsTotal = cols.length;
    for (const pt of result) {
      if (g.includes(pt.task)) pt.cols = colsTotal;
    }
  }
  return result;
}

export function Timeline({
  day,
  startHour = 6,
  endHour = 23,
  onEmptyTimeClick,
  compact = false,
}: Props) {
  const tasks = useTasks((s) => s.tasks);
  const update = useTasks((s) => s.update);
  const toggle = useTasks((s) => s.toggle);
  const remove = useTasks((s) => s.remove);
  const events = useEvents((s) => s.events);
  const categories = useUI((s) => s.categories);
  const hourHeight = useUI((s) => s.settings.timelineHourHeight) || 60;
  const setActive = useUI((s) => s.setActiveTaskId);
  const sessions = usePomodoro((s) => s.sessions);

  const scrollRef = useRef<HTMLDivElement>(null);

  const dayStart = useMemo(() => {
    const d = new Date(day);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [day]);

  const dayEnd = useMemo(() => {
    const d = new Date(dayStart);
    d.setDate(d.getDate() + 1);
    return d;
  }, [dayStart]);

  const dayTasks = useMemo(
    () =>
      tasks.filter((t) => {
        const s = new Date(t.startAt);
        return s >= dayStart && s < dayEnd;
      }),
    [tasks, dayStart, dayEnd]
  );

  const dayEvents = useMemo(
    () =>
      events.filter((e) => {
        const s = new Date(e.startAt);
        return s >= dayStart && s < dayEnd && !e.allDay;
      }),
    [events, dayStart, dayEnd]
  );

  const positioned = useMemo(() => layoutTasks(dayTasks), [dayTasks]);

  const totalHeight = (endHour - startHour + 1) * hourHeight;

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const now = new Date();
    if (
      now.getFullYear() === dayStart.getFullYear() &&
      now.getMonth() === dayStart.getMonth() &&
      now.getDate() === dayStart.getDate()
    ) {
      const h = now.getHours() + now.getMinutes() / 60;
      const top = Math.max(0, (h - startHour - 1) * hourHeight);
      el.scrollTo({ top, behavior: "auto" });
    } else {
      const top = (8 - startHour) * hourHeight;
      el.scrollTo({ top: Math.max(0, top), behavior: "auto" });
    }
  }, [dayStart, startHour, hourHeight]);

  const sessionCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of sessions) {
      if (!s.taskId || s.kind !== "work") continue;
      map.set(s.taskId, (map.get(s.taskId) ?? 0) + 1);
    }
    return map;
  }, [sessions]);

  const handleEmptyClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onEmptyTimeClick) return;
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const y = e.clientY - rect.top;
    const hoursFromStart = y / hourHeight;
    const totalMin = Math.round(hoursFromStart * 60 / 5) * 5;
    const d = new Date(dayStart);
    d.setHours(startHour, 0, 0, 0);
    d.setMinutes(d.getMinutes() + totalMin);
    onEmptyTimeClick(d.toISOString());
  };

  return (
    <div
      ref={scrollRef}
      className="relative flex-1 overflow-y-auto flow-scroll"
      style={{ scrollPaddingTop: 20 }}
    >
      <div className="relative flex pt-4 pb-24" style={{ minHeight: totalHeight + 80 }}>
        <HourGutter startHour={startHour} endHour={endHour} hourHeight={hourHeight} />

        <div
          className="relative flex-1"
          style={{ height: totalHeight }}
          onDoubleClick={handleEmptyClick}
        >
          {Array.from({ length: endHour - startHour + 1 }, (_, i) => (
            <div
              key={i}
              className="hour-line absolute left-0 right-0"
              style={{ top: i * hourHeight }}
            />
          ))}
          {Array.from({ length: endHour - startHour }, (_, i) => (
            <div
              key={"half-" + i}
              className="hour-line-subtle absolute left-0 right-0 opacity-50"
              style={{ top: i * hourHeight + hourHeight / 2 }}
            />
          ))}

          <NowIndicator
            dayStart={dayStart}
            hourHeight={hourHeight}
            startHour={startHour}
            endHour={endHour}
          />

          {dayEvents.map((e) => {
            const s = new Date(e.startAt);
            const end = new Date(e.endAt);
            const startH = s.getHours() + s.getMinutes() / 60;
            const endH = end.getHours() + end.getMinutes() / 60;
            const top = (startH - startHour) * hourHeight;
            const height = Math.max(24, (endH - startH) * hourHeight);
            return (
              <div
                key={e.id}
                className="absolute rounded-chip border border-accent/30 bg-accent-soft text-accent px-2 py-1 text-caption overflow-hidden"
                style={{
                  top,
                  height,
                  right: 8,
                  width: "28%",
                  backdropFilter: "blur(8px)",
                }}
                title={e.title}
              >
                <div className="font-medium truncate">{e.title}</div>
              </div>
            );
          })}

          <AnimatePresence initial={false}>
            {positioned.map(({ task, col, cols }) => {
              const s = new Date(task.startAt);
              const startH = s.getHours() + s.getMinutes() / 60;
              const top = (startH - startHour) * hourHeight;
              const height = (task.durationMin / 60) * hourHeight;
              const width = 100 / Math.max(1, cols);
              const left = col * width;
              const cat = categories.find((c) => c.id === task.categoryId);
              return (
                <TaskBlock
                  key={task.id}
                  task={task}
                  category={cat}
                  top={top}
                  height={height}
                  left={left}
                  width={width}
                  hourHeight={hourHeight}
                  hasSessions={sessionCounts.get(task.id)}
                  onTap={() => setActive(task.id)}
                  onDragRelease={(newStart) => update(task.id, { startAt: newStart })}
                  onResizeRelease={(dur) => update(task.id, { durationMin: dur })}
                  onSwipeComplete={() => toggle(task.id)}
                  onSwipeDelete={() => remove(task.id)}
                />
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
