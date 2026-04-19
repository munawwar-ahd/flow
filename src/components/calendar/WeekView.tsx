"use client";
import { useMemo } from "react";
import { addDays, format, isSameDay, isToday, startOfWeek } from "date-fns";
import { HourGutter } from "@/components/timeline/HourGutter";
import { NowIndicator } from "@/components/timeline/NowIndicator";
import { useTasks } from "@/stores/tasks";
import { useEvents } from "@/stores/events";
import { useUI } from "@/stores/ui";
import { cn } from "@/lib/cn";

export function WeekView({ anchor }: { anchor: Date }) {
  const tasks = useTasks((s) => s.tasks);
  const events = useEvents((s) => s.events);
  const categories = useUI((s) => s.categories);
  const hourHeight = useUI((s) => s.settings.timelineHourHeight) || 60;
  const weekStart = useUI((s) => s.settings.weekStartsOn);
  const setActive = useUI((s) => s.setActiveTaskId);

  const startHour = 6;
  const endHour = 23;
  const totalHeight = (endHour - startHour + 1) * hourHeight;

  const days = useMemo(() => {
    const start = startOfWeek(anchor, { weekStartsOn: weekStart });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [anchor, weekStart]);

  return (
    <div className="flex-1 overflow-auto flow-scroll">
      <div className="sticky top-0 z-10 bg-bg-primary/90 backdrop-blur border-b border-separator">
        <div className="flex">
          <div className="w-14 md:w-16 shrink-0" />
          {days.map((d) => (
            <div
              key={d.toISOString()}
              className="flex-1 py-2 text-center border-l border-separator first:border-l-0"
            >
              <div className="text-micro uppercase tracking-wide text-text-tertiary">
                {format(d, "EEE")}
              </div>
              <div
                className={cn(
                  "inline-flex items-center justify-center w-7 h-7 rounded-full text-caption font-medium mt-1 tabular-nums",
                  isToday(d) ? "bg-accent text-white" : "text-text-primary"
                )}
              >
                {format(d, "d")}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="relative flex pt-4" style={{ minHeight: totalHeight + 40 }}>
        <HourGutter startHour={startHour} endHour={endHour} hourHeight={hourHeight} />
        <div className="relative flex-1 flex" style={{ height: totalHeight }}>
          {Array.from({ length: endHour - startHour + 1 }, (_, i) => (
            <div
              key={i}
              className="hour-line absolute left-0 right-0"
              style={{ top: i * hourHeight }}
            />
          ))}
          {days.map((d, di) => {
            const dayStart = new Date(d);
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
            return (
              <div
                key={d.toISOString()}
                className="relative flex-1 border-l border-separator first:border-l-0"
              >
                {di === new Date().getDay() && isSameDay(d, new Date()) && (
                  <NowIndicator
                    dayStart={dayStart}
                    hourHeight={hourHeight}
                    startHour={startHour}
                    endHour={endHour}
                  />
                )}
                {dayTasks.map((t) => {
                  const s = new Date(t.startAt);
                  const startH = s.getHours() + s.getMinutes() / 60;
                  const top = (startH - startHour) * hourHeight;
                  const height = Math.max(22, (t.durationMin / 60) * hourHeight);
                  const cat = categories.find((c) => c.id === t.categoryId);
                  return (
                    <button
                      key={t.id}
                      onClick={() => setActive(t.id)}
                      className="absolute left-1 right-1 rounded-chip bg-bg-elevated border border-separator shadow-sm text-left px-1.5 py-1 overflow-hidden hover:scale-[1.01] transition-transform"
                      style={{ top, height }}
                    >
                      <div className="flex items-start gap-1">
                        <span
                          className="w-0.5 self-stretch rounded-full shrink-0"
                          style={{ background: cat?.color ?? "var(--accent)" }}
                        />
                        <div className="min-w-0">
                          <div className="text-[11px] font-medium truncate">{t.title}</div>
                          {height > 30 && (
                            <div className="text-[10px] text-text-tertiary">
                              {format(s, "h:mm a")}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
                {dayEvents.map((e) => {
                  const s = new Date(e.startAt);
                  const end = new Date(e.endAt);
                  const startH = s.getHours() + s.getMinutes() / 60;
                  const endH = end.getHours() + end.getMinutes() / 60;
                  const top = (startH - startHour) * hourHeight;
                  const height = Math.max(22, (endH - startH) * hourHeight);
                  return (
                    <div
                      key={e.id}
                      className="absolute left-1 right-1 rounded-chip border border-accent/30 bg-accent-soft text-accent px-1.5 py-1 overflow-hidden"
                      style={{ top, height }}
                      title={e.title}
                    >
                      <div className="text-[11px] font-medium truncate">{e.title}</div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
