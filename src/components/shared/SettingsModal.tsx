"use client";
import { Download, FileText, Moon, Sun, SunMoon } from "lucide-react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { SegmentedControl } from "./SegmentedControl";
import { useUI } from "@/stores/ui";
import { useTasks } from "@/stores/tasks";
import { useNotes } from "@/stores/notes";
import { usePomodoro } from "@/stores/pomodoro";
import { cn } from "@/lib/cn";

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

  return (
    <Modal open={open} onClose={() => setOpen(false)} title="Settings" widthClass="w-[min(92vw,600px)]">
      <div className="space-y-6">
        <Section label="Appearance">
          <div className="flex items-center gap-2">
            {(["light", "system", "dark"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setTheme(v)}
                className={cn(
                  "flex-1 h-12 rounded-btn border flex items-center justify-center gap-2 text-body transition-colors",
                  settings.theme === v
                    ? "bg-accent-soft border-accent text-accent"
                    : "bg-bg-secondary border-separator text-text-secondary hover:text-text-primary"
                )}
              >
                {v === "light" ? <Sun className="w-4 h-4" /> : v === "dark" ? <Moon className="w-4 h-4" /> : <SunMoon className="w-4 h-4" />}
                {v[0].toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </Section>

        <Section label="Timeline hour height">
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={30}
              max={120}
              step={5}
              value={settings.timelineHourHeight}
              onChange={(e) => update({ timelineHourHeight: Number(e.target.value) })}
              className="flex-1 accent-accent"
            />
            <span className="text-caption text-text-secondary tabular-nums w-14 text-right">
              {settings.timelineHourHeight}px
            </span>
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
              <div className="flex gap-1.5 flex-wrap">
                {workMins.map((m) => (
                  <button
                    key={m}
                    onClick={() => update({ pomodoro: { ...settings.pomodoro, workMin: m } })}
                    className={cn(
                      "h-8 px-3 rounded-chip text-caption border",
                      settings.pomodoro.workMin === m
                        ? "bg-accent text-white border-accent"
                        : "bg-bg-secondary border-separator text-text-secondary"
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </Row>
            <Row label="Short break (min)">
              <NumberStepper
                value={settings.pomodoro.shortBreakMin}
                onChange={(v) => update({ pomodoro: { ...settings.pomodoro, shortBreakMin: v } })}
                min={1}
                max={30}
              />
            </Row>
            <Row label="Long break (min)">
              <NumberStepper
                value={settings.pomodoro.longBreakMin}
                onChange={(v) => update({ pomodoro: { ...settings.pomodoro, longBreakMin: v } })}
                min={5}
                max={60}
              />
            </Row>
            <Row label="Cycles before long break">
              <NumberStepper
                value={settings.pomodoro.cyclesBeforeLongBreak}
                onChange={(v) => update({ pomodoro: { ...settings.pomodoro, cyclesBeforeLongBreak: v } })}
                min={2}
                max={8}
              />
            </Row>
          </div>
        </Section>

        <Section label="Export">
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => doExportPDF("today")}>
              <Download className="w-4 h-4" /> Today PDF
            </Button>
            <Button onClick={() => doExportPDF("week")}>
              <Download className="w-4 h-4" /> Week PDF
            </Button>
            <Button onClick={() => doExportPDF("all")}>
              <Download className="w-4 h-4" /> All PDF
            </Button>
            <Button onClick={doExportCSV}>
              <FileText className="w-4 h-4" /> CSVs
            </Button>
          </div>
        </Section>

        <Section label="Focus stats">
          <div className="grid grid-cols-3 gap-2">
            <Stat
              label="Sessions"
              value={sessions.filter((s) => s.kind === "work").length.toString()}
            />
            <Stat
              label="Minutes"
              value={sessions
                .filter((s) => s.kind === "work")
                .reduce((a, s) => a + s.durationMin, 0)
                .toString()}
            />
            <Stat
              label="Completed tasks"
              value={tasks.filter((t) => t.completed).length.toString()}
            />
          </div>
        </Section>
      </div>
    </Modal>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-micro uppercase tracking-wide text-text-tertiary mb-2">{label}</div>
      {children}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
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
    <div className="flex items-center gap-1 bg-bg-secondary rounded-btn border border-separator p-0.5">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-8 h-8 rounded-[10px] hover:bg-bg-elevated"
      >
        –
      </button>
      <span className="w-8 text-center text-body tabular-nums">{value}</span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-8 h-8 rounded-[10px] hover:bg-bg-elevated"
      >
        +
      </button>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-card bg-bg-secondary border border-separator p-3">
      <div className="text-title">{value}</div>
      <div className="text-caption text-text-secondary">{label}</div>
    </div>
  );
}
