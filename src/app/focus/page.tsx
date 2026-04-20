"use client";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Pause, Play, RotateCcw, Maximize2 } from "lucide-react";
import { motion } from "framer-motion";
import { PomodoroRing } from "@/components/focus/PomodoroRing";
import { SegmentedControl } from "@/components/shared/SegmentedControl";
import { UserMenu } from "@/components/shared/UserMenu";
import { SyncIndicator } from "@/components/shared/SyncIndicator";
import { usePomodoro } from "@/stores/pomodoro";
import { useTasks } from "@/stores/tasks";
import { useUI } from "@/stores/ui";
import { useInterval } from "@/hooks/useInterval";
import { ambientPlayer } from "@/lib/audio";
import { cn } from "@/lib/cn";
import { spring, tap } from "@/lib/motion";

function fmt(ms: number) {
  const s = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${m.toString().padStart(2, "0")}:${ss.toString().padStart(2, "0")}`;
}

export default function FocusPage() {
  const settings = useUI((s) => s.settings);
  const updateSettings = useUI((s) => s.updateSettings);
  const tasks = useTasks((s) => s.tasks);
  const pom = usePomodoro((s) => s);

  const [, setTick] = useState(0);
  const [showTaskPicker, setShowTaskPicker] = useState(false);

  useInterval(() => setTick((t) => t + 1), pom.running ? 200 : null);

  const live =
    pom.running && pom.startedAt
      ? Math.max(0, pom.remainingMs - (Date.now() - pom.startedAt))
      : pom.remainingMs;
  const progress = pom.totalMs > 0 ? 1 - live / pom.totalMs : 0;

  useEffect(() => {
    if (pom.running && live <= 0) {
      pom.completeSession().then(() => {
        try {
          ambientPlayer.chime();
        } catch {}
        const cycles = pom.cyclesCompleted + (pom.kind === "work" ? 1 : 0);
        if (pom.kind === "work") {
          if (cycles % settings.pomodoro.cyclesBeforeLongBreak === 0) {
            pom.setKind("long-break", settings.pomodoro.longBreakMin);
          } else {
            pom.setKind("short-break", settings.pomodoro.shortBreakMin);
          }
        } else {
          pom.setKind("work", settings.pomodoro.workMin);
        }
      });
    }
  }, [live, pom, settings]);

  useEffect(() => {
    if (pom.kind === "work" && !pom.running) {
      pom.configure(
        settings.pomodoro.workMin,
        settings.pomodoro.shortBreakMin,
        settings.pomodoro.longBreakMin
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.pomodoro.workMin]);

  const linkedTask = useMemo(
    () => tasks.find((t) => t.id === pom.linkedTaskId),
    [tasks, pom.linkedTaskId]
  );

  const ringColor =
    pom.kind === "work"
      ? "var(--accent)"
      : pom.kind === "short-break"
        ? "var(--success)"
        : "var(--warning)";

  const sessionsToday = pom.cyclesCompleted;

  return (
    <div className="flex flex-col h-screen bg-bg-primary">
      <header className="sticky top-0 z-30 glass border-b border-separator/70 px-5 md:px-8 pt-safe">
        <div className="flex items-center justify-between h-[72px] gap-3">
          <h1
            className="text-[1.75rem] md:text-[2rem] font-bold tracking-tight text-text-primary"
            style={{ letterSpacing: "-0.3px" }}
          >
            Focus
          </h1>
          <div className="flex items-center gap-3">
            <SegmentedControl
              value={pom.kind}
              onChange={(v) => {
                const mins =
                  v === "work"
                    ? settings.pomodoro.workMin
                    : v === "short-break"
                      ? settings.pomodoro.shortBreakMin
                      : settings.pomodoro.longBreakMin;
                pom.setKind(v, mins);
              }}
              options={[
                { value: "work", label: "Work" },
                { value: "short-break", label: "Short" },
                { value: "long-break", label: "Long" },
              ]}
              size="sm"
            />
            <SyncIndicator variant="compact" className="md:hidden" />
            <UserMenu variant="compact" className="md:hidden" />
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-8 pb-10">
        <PomodoroRing
          progress={progress}
          label={fmt(live)}
          sublabel={
            pom.kind === "work"
              ? "Focus time"
              : pom.kind === "short-break"
                ? "Short break"
                : "Long break"
          }
          size={280}
          stroke={6}
          color={ringColor}
        />

        <div className="relative">
          <motion.button
            whileTap={tap}
            transition={spring.snappy}
            onClick={() => setShowTaskPicker((v) => !v)}
            className="flex items-center gap-1.5 text-body text-text-secondary hover:text-text-primary transition-colors focus-ring rounded-md px-2 py-1 cursor-pointer"
            aria-expanded={showTaskPicker}
            aria-label="Pick task to focus on"
          >
            <span>Focusing on:</span>
            <span className="text-text-primary max-w-[260px] truncate font-medium">
              {linkedTask?.title ?? "None"}
            </span>
            <ChevronDown
              className={cn(
                "w-4 h-4 transition-transform",
                showTaskPicker && "rotate-180"
              )}
            />
          </motion.button>
          {showTaskPicker && (
            <motion.div
              initial={{ opacity: 0, y: 4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={spring.gentle}
              className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-72 glass rounded-2xl shadow-card border border-separator z-10 overflow-hidden"
            >
              <button
                onClick={() => {
                  pom.setLinkedTask(null);
                  setShowTaskPicker(false);
                }}
                className="w-full text-left px-4 py-2.5 text-body hover:bg-bg-secondary transition-colors"
              >
                None
              </button>
              {tasks
                .filter((t) => !t.completed)
                .slice(0, 10)
                .map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      pom.setLinkedTask(t.id);
                      setShowTaskPicker(false);
                    }}
                    className={cn(
                      "w-full text-left px-4 py-2.5 text-body hover:bg-bg-secondary transition-colors truncate",
                      pom.linkedTaskId === t.id && "bg-accent-soft text-accent"
                    )}
                  >
                    {t.title}
                  </button>
                ))}
            </motion.div>
          )}
        </div>

        <div className="flex items-center gap-3 w-full max-w-md">
          <motion.button
            whileTap={tap}
            transition={spring.snappy}
            onClick={() => (pom.running ? pom.pause() : pom.start())}
            className={cn(
              "flex-1 h-12 rounded-full text-sm font-bold flex items-center justify-center gap-2 shadow-lg focus-ring cursor-pointer hover:brightness-110 transition-[filter]",
              "bg-[color:var(--today-pill-bg)] text-[color:var(--today-pill-ink)]"
            )}
          >
            {pom.running ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            {pom.running ? "Pause" : "Start"}
          </motion.button>
          <motion.button
            whileTap={tap}
            transition={spring.snappy}
            onClick={() => pom.reset()}
            aria-label="Reset"
            className="w-12 h-12 rounded-full bg-bg-secondary hover:bg-bg-elevated text-text-primary flex items-center justify-center focus-ring cursor-pointer transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </motion.button>
          <motion.button
            whileTap={tap}
            transition={spring.snappy}
            onClick={() => pom.setFocusMode(!pom.focusMode)}
            aria-label="Focus mode"
            className="w-12 h-12 rounded-full bg-bg-secondary hover:bg-bg-elevated text-text-primary flex items-center justify-center focus-ring cursor-pointer transition-colors"
          >
            <Maximize2 className="w-4 h-4" />
          </motion.button>
        </div>

        <SegmentedControl
          value={settings.focusMode.ambientSound}
          onChange={(v) => {
            updateSettings({ focusMode: { ...settings.focusMode, ambientSound: v } });
            ambientPlayer.play(v);
          }}
          options={[
            { value: "none", label: "Silent" },
            { value: "brown-noise", label: "Brown" },
            { value: "rain", label: "Rain" },
            { value: "cafe", label: "Cafe" },
          ]}
          size="sm"
        />

        <div className="flex items-center gap-2">
          {sessionsToday > 0 && (
            <span
              className="text-[11px] font-bold px-3 py-1 rounded-full"
              style={{ background: "var(--event-2)", color: "var(--event-ink)" }}
            >
              {sessionsToday} session{sessionsToday === 1 ? "" : "s"} today
            </span>
          )}
          <span className="text-caption text-text-tertiary">
            <kbd className="px-1.5 py-0.5 rounded bg-bg-secondary border border-separator/70 text-micro">
              Space
            </kbd>{" "}
            to start / pause
          </span>
        </div>
      </div>
    </div>
  );
}
