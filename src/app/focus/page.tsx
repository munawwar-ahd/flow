"use client";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Pause, Play, RotateCcw, Maximize2, Volume2, VolumeX } from "lucide-react";
import { PomodoroRing } from "@/components/focus/PomodoroRing";
import { Button } from "@/components/shared/Button";
import { SegmentedControl } from "@/components/shared/SegmentedControl";
import { UserMenu } from "@/components/shared/UserMenu";
import { usePomodoro } from "@/stores/pomodoro";
import { useTasks } from "@/stores/tasks";
import { useUI } from "@/stores/ui";
import { useInterval } from "@/hooks/useInterval";
import { ambientPlayer } from "@/lib/audio";
import { cn } from "@/lib/cn";

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

  const [tick, setTick] = useState(0);
  const [showTaskPicker, setShowTaskPicker] = useState(false);

  useInterval(() => setTick((t) => t + 1), pom.running ? 200 : null);

  const live = pom.running && pom.startedAt ? Math.max(0, pom.remainingMs - (Date.now() - pom.startedAt)) : pom.remainingMs;
  const progress = pom.totalMs > 0 ? 1 - live / pom.totalMs : 0;

  useEffect(() => {
    if (pom.running && live <= 0) {
      pom.completeSession().then(() => {
        try { ambientPlayer.chime(); } catch {}
        // auto-switch to break
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
      pom.configure(settings.pomodoro.workMin, settings.pomodoro.shortBreakMin, settings.pomodoro.longBreakMin);
    }
  }, [settings.pomodoro.workMin]);

  const linkedTask = useMemo(
    () => tasks.find((t) => t.id === pom.linkedTaskId),
    [tasks, pom.linkedTaskId]
  );

  const ringColor =
    pom.kind === "work" ? "var(--accent)" : pom.kind === "short-break" ? "var(--success)" : "var(--warning)";

  const toggleFocus = () => {
    pom.setFocusMode(!pom.focusMode);
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="sticky top-0 z-30 glass border-b border-separator px-5 md:px-8 pt-safe">
        <div className="flex items-center justify-between h-16">
          <h1 className="text-title">Focus</h1>
          <div className="flex items-center gap-2">
            <SegmentedControl
              value={pom.kind}
              onChange={(v) => {
                const mins =
                  v === "work"
                    ? settings.pomodoro.workMin
                    : v === "short-break"
                      ? settings.pomodoro.shortBreakMin
                      : settings.pomodoro.longBreakMin;
                pom.setKind(v as any, mins);
              }}
              options={[
                { value: "work", label: "Work" },
                { value: "short-break", label: "Short" },
                { value: "long-break", label: "Long" },
              ]}
              size="sm"
            />
            <UserMenu variant="compact" className="md:hidden" />
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-8">
        <PomodoroRing
          progress={progress}
          label={fmt(live)}
          sublabel={pom.kind === "work" ? "Focus time" : pom.kind === "short-break" ? "Short break" : "Long break"}
          color={ringColor}
        />

        <div className="relative">
          <button
            onClick={() => setShowTaskPicker((v) => !v)}
            className="flex items-center gap-1.5 text-body text-text-secondary hover:text-text-primary transition-colors"
          >
            <span>Focusing on: </span>
            <span className="text-text-primary max-w-[260px] truncate">
              {linkedTask?.title ?? "None"}
            </span>
            <ChevronDown className="w-4 h-4" />
          </button>
          {showTaskPicker && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-72 glass rounded-card shadow-card border border-separator z-10 overflow-hidden">
              <button
                onClick={() => {
                  pom.setLinkedTask(null);
                  setShowTaskPicker(false);
                }}
                className="w-full text-left px-4 py-2 text-body hover:bg-bg-secondary"
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
                      "w-full text-left px-4 py-2 text-body hover:bg-bg-secondary truncate",
                      pom.linkedTaskId === t.id && "bg-accent-soft text-accent"
                    )}
                  >
                    {t.title}
                  </button>
                ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 w-full max-w-md">
          <Button
            variant="primary"
            size="lg"
            className="flex-1 rounded-full"
            onClick={() => (pom.running ? pom.pause() : pom.start())}
          >
            {pom.running ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            {pom.running ? "Pause" : "Start"}
          </Button>
          <Button size="lg" iconOnly aria-label="Reset" onClick={() => pom.reset()}>
            <RotateCcw className="w-5 h-5" />
          </Button>
          <Button size="lg" iconOnly aria-label="Focus mode" onClick={toggleFocus}>
            <Maximize2 className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <SegmentedControl
            value={settings.focusMode.ambientSound}
            onChange={(v) => {
              updateSettings({ focusMode: { ...settings.focusMode, ambientSound: v } });
              ambientPlayer.play(v as any);
            }}
            options={[
              { value: "none", label: "Silent" },
              { value: "brown-noise", label: "Brown" },
              { value: "rain", label: "Rain" },
              { value: "cafe", label: "Cafe" },
            ]}
            size="sm"
          />
        </div>

        <div className="text-caption text-text-tertiary">
          {pom.cyclesCompleted > 0 && (
            <>Completed today: {pom.cyclesCompleted} • </>
          )}
          <kbd className="px-1.5 py-0.5 rounded bg-bg-secondary border border-separator">Space</kbd> to start/pause
        </div>
      </div>
    </div>
  );
}
