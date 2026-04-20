"use client";
import { motion } from "framer-motion";
import { Download, FileText, Moon, Sun, SunMoon } from "lucide-react";
import { Modal } from "./Modal";
import { SegmentedControl } from "./SegmentedControl";
import { useUI } from "@/stores/ui";
import { useTasks } from "@/stores/tasks";
import { useNotes } from "@/stores/notes";
import { usePomodoro } from "@/stores/pomodoro";
import { cn } from "@/lib/cn";
import { spring, tap } from "@/lib/motion";

export function SettingsModal() {
  const open = useUI((s) => s.settingsOpen);
  const setOpen = useUI((s) => s.setSettingsOpen);
  const settings = useUI((s) => s.settings);
  const setTheme = useUI((s) => s.setTheme);
  const update = useUI((s) => s.updateSettings);
  const tasks = useTasks((s) => s.tasks);
  const notes = useNotes((s) => s.notes);
  const sessions = usePomodoro((s) => s.sessions);

  const doExportPDF = async (scope: "today" | "week" | "all") => {
    const { exportPDF } = await import("@/lib/export");
    let sel = tasks;
    const now = new Date();
    if (scope === "today") {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      sel = tasks.filter((t) => {
        const s = new Date(t.startAt);
        return s >= start && s < end;
      });
    } else if (scope === "week") {
      const start = new Date(now);
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      sel = tasks.filter((t) => new Date(t.startAt) >= start);
    }
    await exportPDF({ tasks: sel, sessions, scope });
  };

  const doExportCSV = async () => {
    const { exportCSV } = await import("@/lib/export");
    await exportCSV("tasks", tasks);
    await exportCSV("notes", notes);
    await exportCSV("sessions", sessions);
  };

  const workMins = [15, 20, 25, 30, 45, 50];

  const workSessions = sessions.filter((s) => s.kind === "work");
  const focusMinutes = workSessions.reduce((a, s) => a + s.durationMin, 0);
  const completedTasks = tasks.filter((t) => t.completed).length;

  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      title="Settings"
      widthClass="w-[min(92vw,560px)]"
    >
      <div className="space-y-6">
        <Section label="Appearance">
          <div className="flex items-center gap-2">
            {(["light", "system", "dark"] as const).map((v) => (
              <motion.button
                key={v}
                whileTap={tap}
                transition={spring.snappy}
                onClick={() => setTheme(v)}
                className={cn(
                  "flex-1 h-12 rounded-xl border flex items-center justify-center gap-2 text-body transition-colors focus-ring cursor-pointer",
                  settings.theme === v
                    ? "bg-accent-soft border-accent text-accent font-medium"
                    : "bg-bg-secondary border-separator/70 text-text-secondary hover:text-text-primary"
                )}
              >
                {v === "light" ? (
                  <Sun className="w-4 h-4" />
                ) : v === "dark" ? (
                  <Moon className="w-4 h-4" />
                ) : (
                  <SunMoon className="w-4 h-4" />
                )}
                {v[0].toUpperCase() + v.slice(1)}
              </motion.button>
            ))}
          </div>
        </Section>

        <Section label="Week starts on">
          <SegmentedControl
            value={String(settings.weekStartsOn) as "0" | "1"}
            onChange={(v) => update({ weekStartsOn: Number(v) as 0 | 1 })}
            options={[
              { value: "0", label: "Sunday" },
              { value: "1", label: "Monday" },
            ]}
            size="sm"
          />
        </Section>

        <Section label="Pomodoro">
          <div className="space-y-3">
            <Row label="Work (min)">
              <div className="flex gap-1.5 flex-wrap justify-end">
                {workMins.map((m) => (
                  <motion.button
                    key={m}
                    whileTap={tap}
                    transition={spring.snappy}
                    onClick={() =>
                      update({ pomodoro: { ...settings.pomodoro, workMin: m } })
                    }
                    className={cn(
                      "h-8 px-3 rounded-full text-caption font-medium border transition-colors focus-ring cursor-pointer",
                      settings.pomodoro.workMin === m
                        ? "bg-accent text-white border-accent"
                        : "bg-bg-secondary border-separator/70 text-text-secondary hover:text-text-primary"
                    )}
                  >
                    {m}
                  </motion.button>
                ))}
              </div>
            </Row>
            <Row label="Short break (min)">
              <NumberStepper
                value={settings.pomodoro.shortBreakMin}
                onChange={(v) =>
                  update({ pomodoro: { ...settings.pomodoro, shortBreakMin: v } })
                }
                min={1}
                max={30}
              />
            </Row>
            <Row label="Long break (min)">
              <NumberStepper
                value={settings.pomodoro.longBreakMin}
                onChange={(v) =>
                  update({ pomodoro: { ...settings.pomodoro, longBreakMin: v } })
                }
                min={5}
                max={60}
              />
            </Row>
            <Row label="Cycles before long break">
              <NumberStepper
                value={settings.pomodoro.cyclesBeforeLongBreak}
                onChange={(v) =>
                  update({
                    pomodoro: { ...settings.pomodoro, cyclesBeforeLongBreak: v },
                  })
                }
                min={2}
                max={8}
              />
            </Row>
          </div>
        </Section>

        <Section label="Focus stats">
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Sessions" value={workSessions.length.toString()} pastel="var(--event-1)" />
            <Stat label="Minutes" value={focusMinutes.toString()} pastel="var(--event-2)" />
            <Stat label="Done" value={completedTasks.toString()} pastel="var(--event-5)" />
          </div>
        </Section>

        <Section label="Data">
          <div className="flex flex-wrap gap-2">
            <ExportButton onClick={() => doExportPDF("today")}>
              <Download className="w-4 h-4" /> Today PDF
            </ExportButton>
            <ExportButton onClick={() => doExportPDF("week")}>
              <Download className="w-4 h-4" /> Week PDF
            </ExportButton>
            <ExportButton onClick={() => doExportPDF("all")}>
              <Download className="w-4 h-4" /> All PDF
            </ExportButton>
            <ExportButton onClick={doExportCSV}>
              <FileText className="w-4 h-4" /> CSVs
            </ExportButton>
          </div>
        </Section>
      </div>
    </Modal>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-micro uppercase tracking-wide text-text-tertiary mb-2 px-1">
        {label}
      </div>
      <div className="rounded-2xl bg-bg-elevated border border-separator/60 p-5 shadow-card">
        {children}
      </div>
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-body text-text-secondary">{label}</span>
      {children}
    </div>
  );
}

function NumberStepper({
  value,
  onChange,
  min,
  max,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
}) {
  return (
    <div className="flex items-center gap-1 bg-bg-secondary rounded-full border border-separator/70 p-0.5">
      <motion.button
        whileTap={tap}
        transition={spring.snappy}
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-8 h-8 rounded-full hover:bg-bg-elevated focus-ring cursor-pointer transition-colors"
        aria-label="Decrement"
      >
        −
      </motion.button>
      <span className="w-8 text-center text-body tabular-nums font-medium">
        {value}
      </span>
      <motion.button
        whileTap={tap}
        transition={spring.snappy}
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-8 h-8 rounded-full hover:bg-bg-elevated focus-ring cursor-pointer transition-colors"
        aria-label="Increment"
      >
        +
      </motion.button>
    </div>
  );
}

function Stat({
  label,
  value,
  pastel,
}: {
  label: string;
  value: string;
  pastel: string;
}) {
  return (
    <div
      className="rounded-xl p-3 text-left"
      style={{ background: pastel }}
    >
      <div className="text-title" style={{ color: "var(--event-ink)" }}>
        {value}
      </div>
      <div
        className="text-caption mt-0.5"
        style={{ color: "var(--event-ink-soft)" }}
      >
        {label}
      </div>
    </div>
  );
}

function ExportButton({
  onClick,
  children,
}: {
  onClick: () => void | Promise<void>;
  children: React.ReactNode;
}) {
  return (
    <motion.button
      whileTap={tap}
      transition={spring.snappy}
      onClick={() => void onClick()}
      className="inline-flex items-center gap-2 h-9 px-3.5 rounded-full bg-bg-secondary hover:bg-bg-primary border border-separator/70 text-body text-text-primary focus-ring cursor-pointer transition-colors"
    >
      {children}
    </motion.button>
  );
}
