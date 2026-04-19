"use client";
import { useMemo, useState } from "react";
import { format, addDays, isToday } from "date-fns";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus, Minus, ZoomIn } from "lucide-react";
import { Timeline } from "@/components/timeline/Timeline";
import { Button } from "@/components/shared/Button";
import { UserMenu } from "@/components/shared/UserMenu";
import { useUI } from "@/stores/ui";
import { useTasks } from "@/stores/tasks";
import { spring } from "@/lib/motion";

export default function TodayPage() {
  const [day, setDay] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const setTaskEditor = useUI((s) => s.setTaskEditor);
  const hourHeight = useUI((s) => s.settings.timelineHourHeight);
  const updateSettings = useUI((s) => s.updateSettings);
  const tasks = useTasks((s) => s.tasks);

  const dayTasksCount = useMemo(() => {
    const start = new Date(day);
    const end = new Date(day);
    end.setDate(end.getDate() + 1);
    return tasks.filter((t) => {
      const s = new Date(t.startAt);
      return s >= start && s < end;
    }).length;
  }, [day, tasks]);

  return (
    <div className="flex flex-col h-screen">
      <header className="sticky top-0 z-30 glass border-b border-separator px-5 md:px-8 pt-safe">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3 min-w-0">
            <motion.h1
              key={day.toISOString()}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={spring.gentle}
              className="text-title truncate"
            >
              {format(day, "EEEE, d MMMM")}
            </motion.h1>
            {isToday(day) && (
              <span className="hidden md:inline-flex items-center rounded-full bg-accent-soft text-accent text-micro px-2 py-0.5 uppercase tracking-wide">
                Today
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-1">
              <button
                aria-label="Zoom out"
                onClick={() => updateSettings({ timelineHourHeight: Math.max(30, hourHeight - 15) })}
                className="w-8 h-8 rounded-full hover:bg-bg-secondary flex items-center justify-center text-text-secondary"
              >
                <Minus className="w-4 h-4" />
              </button>
              <ZoomIn className="w-4 h-4 text-text-tertiary" />
              <button
                aria-label="Zoom in"
                onClick={() => updateSettings({ timelineHourHeight: Math.min(120, hourHeight + 15) })}
                className="w-8 h-8 rounded-full hover:bg-bg-secondary flex items-center justify-center text-text-secondary"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-1 bg-bg-secondary rounded-btn p-0.5 border border-separator">
              <button
                aria-label="Previous day"
                onClick={() => setDay((d) => addDays(d, -1))}
                className="w-8 h-8 rounded-[10px] hover:bg-bg-elevated flex items-center justify-center"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {!isToday(day) && (
                <button
                  onClick={() => {
                    const d = new Date();
                    d.setHours(0, 0, 0, 0);
                    setDay(d);
                  }}
                  className="h-8 px-3 rounded-[10px] hover:bg-bg-elevated text-caption font-medium"
                >
                  Today
                </button>
              )}
              <button
                aria-label="Next day"
                onClick={() => setDay((d) => addDays(d, 1))}
                className="w-8 h-8 rounded-[10px] hover:bg-bg-elevated flex items-center justify-center"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                const d = new Date(day);
                const now = new Date();
                d.setHours(now.getHours(), Math.round(now.getMinutes() / 5) * 5, 0, 0);
                setTaskEditor({
                  mode: "create",
                  initial: { startAt: d.toISOString(), durationMin: 30 },
                });
              }}
              aria-label="New task"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New</span>
            </Button>
            <UserMenu variant="compact" className="md:hidden" />
          </div>
        </div>
      </header>

      {dayTasksCount === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={spring.gentle}
          >
            <div
              className="w-16 h-16 rounded-card mb-5 mx-auto flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, var(--accent) 0%, rgba(191,90,242,0.8) 100%)",
              }}
            >
              <Plus className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-title mb-2">Your day is wide open</h2>
            <p className="text-body text-text-secondary mb-6 max-w-sm">
              Press <kbd className="mx-1 px-1.5 py-0.5 rounded bg-bg-secondary border border-separator text-caption">⌘N</kbd>
              to add your first task, or double-click anywhere on the timeline.
            </p>
            <Button
              variant="primary"
              onClick={() => {
                const d = new Date(day);
                d.setHours(9, 0, 0, 0);
                setTaskEditor({ mode: "create", initial: { startAt: d.toISOString(), durationMin: 30 } });
              }}
            >
              <Plus className="w-4 h-4" />
              Add a task
            </Button>
          </motion.div>
        </div>
      ) : (
        <Timeline
          day={day}
          onEmptyTimeClick={(iso) =>
            setTaskEditor({ mode: "create", initial: { startAt: iso, durationMin: 30 } })
          }
        />
      )}
    </div>
  );
}
