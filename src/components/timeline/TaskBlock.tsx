"use client";
import { motion, type PanInfo } from "framer-motion";
import { format } from "date-fns";
import { Check, FileText, Repeat, Bell } from "lucide-react";
import type { Task, TaskCategory } from "@/types/models";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/cn";

type Props = {
  task: Task;
  category?: TaskCategory;
  top: number;
  height: number;
  left: number;
  width: number;
  hourHeight: number;
  hasSessions?: number;
  onTap: () => void;
  onDragRelease: (newStartAt: string) => void;
  onResizeRelease: (newDurationMin: number) => void;
  onSwipeComplete?: () => void;
  onSwipeDelete?: () => void;
};

const MIN_DUR = 15;
const SNAP_MIN = 5;

export function TaskBlock({
  task,
  category,
  top,
  height,
  left,
  width,
  hourHeight,
  hasSessions,
  onTap,
  onDragRelease,
  onResizeRelease,
  onSwipeComplete,
  onSwipeDelete,
}: Props) {
  const pxPerMin = hourHeight / 60;
  const color = category?.color ?? "var(--accent)";

  const endDate = new Date(new Date(task.startAt).getTime() + task.durationMin * 60_000);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const dy = info.offset.y;
    const dx = info.offset.x;
    if (Math.abs(dx) > 80 && Math.abs(dx) > Math.abs(dy) * 2) {
      if (dx > 0) onSwipeComplete?.();
      else onSwipeDelete?.();
      return;
    }
    if (Math.abs(dy) < 3) return;
    const deltaMin = Math.round(dy / pxPerMin / SNAP_MIN) * SNAP_MIN;
    if (deltaMin === 0) return;
    const newStart = new Date(new Date(task.startAt).getTime() + deltaMin * 60_000).toISOString();
    onDragRelease(newStart);
  };

  const onResizeEnd = (_: unknown, info: PanInfo) => {
    const dy = info.offset.y;
    const deltaMin = Math.round(dy / pxPerMin / SNAP_MIN) * SNAP_MIN;
    if (deltaMin === 0) return;
    const next = Math.max(MIN_DUR, task.durationMin + deltaMin);
    onResizeRelease(next);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: task.completed ? 0.4 : 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={spring.gentle}
      style={{
        position: "absolute",
        top,
        height: Math.max(28, height),
        left: `calc(${left}% + 6px)`,
        width: `calc(${width}% - 12px)`,
      }}
      className="group"
    >
      <motion.div
        drag
        dragSnapToOrigin
        dragMomentum={false}
        whileTap={{ scale: 0.99 }}
        whileHover={{ scale: 1.005 }}
        onDragEnd={onDragEnd}
        onClick={(e) => {
          if ((e as any).defaultPrevented) return;
          onTap();
        }}
        transition={spring.snappy}
        className={cn(
          "relative h-full w-full rounded-card bg-bg-elevated border border-separator shadow-sm overflow-hidden cursor-pointer",
          "active:cursor-grabbing"
        )}
      >
        <div
          aria-hidden
          className="absolute left-0 top-0 bottom-0 w-1"
          style={{ background: color }}
        />
        <div className="relative h-full pl-3 pr-3.5 py-2.5 flex flex-col gap-1 min-h-0">
          <div className="flex items-start gap-2 min-w-0">
            {task.completed && (
              <Check className="w-3.5 h-3.5 text-success shrink-0 mt-[2px]" strokeWidth={3} />
            )}
            <span
              className={cn(
                "text-headline truncate",
                task.completed && "line-through text-text-secondary"
              )}
            >
              {task.title}
            </span>
          </div>
          {height > 40 && (
            <div className="flex items-center gap-2 text-caption text-text-secondary">
              <span className="tabular-nums">
                {format(new Date(task.startAt), "h:mm")}–{format(endDate, "h:mm a")}
              </span>
              {task.linkedNoteId && <FileText className="w-3 h-3" />}
              {task.recurrence && <Repeat className="w-3 h-3" />}
              {task.reminderMin != null && <Bell className="w-3 h-3" />}
              {hasSessions ? <span>🍅 {hasSessions}</span> : null}
            </div>
          )}
        </div>

        <motion.div
          drag="y"
          dragMomentum={false}
          onDragEnd={onResizeEnd}
          onClick={(e) => e.stopPropagation()}
          whileHover={{ opacity: 1 }}
          className="absolute left-0 right-0 bottom-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 flex items-center justify-center"
        >
          <div className="w-8 h-0.5 rounded-full bg-text-tertiary/60" />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
