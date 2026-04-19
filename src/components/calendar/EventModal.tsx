"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { format, parse } from "date-fns";
import { Calendar as CalIcon, Clock, MapPin } from "lucide-react";
import { useTasks } from "@/stores/tasks";
import { useUI } from "@/stores/ui";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { pastelVar } from "@/lib/calendar/pastel";
import { cn } from "@/lib/cn";
import { spring, tap } from "@/lib/motion";
import type { Task } from "@/types/models";

type Mode = "create" | "edit";

type Props = {
  open: boolean;
  mode: Mode;
  initial?: Partial<Task> & { startAt: string; durationMin: number };
  onClose: () => void;
};

function toDateInputValue(iso: string) {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
function toTimeInputValue(iso: string) {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}`;
}
function composeIso(dateStr: string, timeStr: string) {
  const d = parse(`${dateStr} ${timeStr}`, "yyyy-MM-dd HH:mm", new Date());
  return d.toISOString();
}
function addMinutesIso(iso: string, minutes: number) {
  return new Date(new Date(iso).getTime() + minutes * 60_000).toISOString();
}
function diffMinutes(a: string, b: string) {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 60_000);
}

// Force the native time/date picker to open on click. Browsers render
// the inputs natively but only open the picker when the tiny icon is
// clicked — showPicker() gives us the same result from anywhere on the
// pill.
function openPicker(el: HTMLInputElement | null) {
  if (!el) return;
  try {
    el.showPicker?.();
  } catch {
    el.focus();
  }
}

export function EventModal({ open, mode, initial, onClose }: Props) {
  const categories = useUI((s) => s.categories);
  const add = useTasks((s) => s.add);
  const update = useTasks((s) => s.update);

  const [title, setTitle] = useState("");
  const [dateStr, setDateStr] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const trapRef = useFocusTrap<HTMLDivElement>(open);
  const titleRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);

  // Reset form state whenever the modal opens.
  useEffect(() => {
    if (!open || !initial) return;
    setTitle(initial.title ?? "");
    setDateStr(toDateInputValue(initial.startAt));
    setStartTime(toTimeInputValue(initial.startAt));
    const endIso = addMinutesIso(initial.startAt, initial.durationMin ?? 60);
    setEndTime(toTimeInputValue(endIso));
    setLocation((initial as { location?: string }).location ?? "");
    setCategoryId(initial.categoryId ?? categories[0]?.id);
    setTimeout(() => titleRef.current?.focus(), 30);
  }, [open, initial, categories]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  // Validation — end must be strictly after start (same day assumed).
  const timeValid = useMemo(() => {
    if (!startTime || !endTime || !dateStr) return false;
    const s = composeIso(dateStr, startTime);
    const e = composeIso(dateStr, endTime);
    return new Date(e).getTime() > new Date(s).getTime();
  }, [startTime, endTime, dateStr]);

  const canSubmit =
    title.trim().length > 0 && !!categoryId && timeValid && !!dateStr;

  const submit = async () => {
    if (!canSubmit) return;
    const startIso = composeIso(dateStr, startTime);
    const endIso = composeIso(dateStr, endTime);
    const durationMin = Math.max(15, diffMinutes(startIso, endIso));

    if (mode === "create") {
      await add({
        title: title.trim(),
        startAt: startIso,
        durationMin,
        categoryId,
        notes: location ? `@ ${location}` : undefined,
      });
    } else if (initial?.id) {
      await update(initial.id, {
        title: title.trim(),
        startAt: startIso,
        durationMin,
        categoryId,
        notes: location ? `@ ${location}` : initial.notes,
      });
    }
    onClose();
  };

  const prettyDate = useMemo(() => {
    if (!dateStr) return "Pick a date";
    try {
      return format(parse(dateStr, "yyyy-MM-dd", new Date()), "EEEE, d MMMM");
    } catch {
      return dateStr;
    }
  }, [dateStr]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[70] flex items-center justify-center px-4 pt-safe pb-safe"
        >
          <div
            className="absolute inset-0 bg-black/10 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            ref={trapRef}
            role="dialog"
            aria-modal="true"
            aria-label={mode === "create" ? "New event" : "Edit event"}
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ ...spring.gentle, duration: 0.25 }}
            className="relative w-full max-w-[400px] rounded-3xl p-7 border border-separator backdrop-blur-2xl backdrop-saturate-150 shadow-2xl"
            style={{ background: "var(--glass-bg)" }}
          >
            <div className="mb-5 flex items-center gap-1">
              <input
                ref={titleRef}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void submit();
                  }
                }}
                placeholder={mode === "create" ? "New event" : "Untitled"}
                className="flex-1 bg-transparent text-2xl font-bold tracking-tight focus:outline-none placeholder:text-text-tertiary"
                style={{ letterSpacing: "-0.02em" }}
                aria-label="Event title"
              />
              {!reducedMotion && (
                <motion.span
                  aria-hidden
                  className="block w-[2px] h-6 rounded-full"
                  style={{ background: "var(--accent)" }}
                  animate={{ opacity: [1, 0.15, 1] }}
                  transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
                />
              )}
            </div>

            <div className="space-y-5">
              {/* Date row — custom pill triggers the native date picker */}
              <Row icon={<CalIcon className="w-4 h-4" />}>
                <button
                  type="button"
                  onClick={() => openPicker(dateRef.current)}
                  className="text-sm font-semibold text-left hover:text-accent transition-colors focus-ring rounded-md -mx-1 px-1"
                >
                  {prettyDate}
                </button>
                <input
                  ref={dateRef}
                  type="date"
                  value={dateStr}
                  onChange={(e) => setDateStr(e.target.value)}
                  aria-label="Date"
                  className="sr-only"
                />
              </Row>

              <Row icon={<Clock className="w-4 h-4" />}>
                <TimePill value={startTime} onChange={setStartTime} aria="Start time" />
                <span className="text-text-tertiary text-xs select-none">→</span>
                <TimePill
                  value={endTime}
                  onChange={setEndTime}
                  aria="End time"
                  invalid={startTime.length > 0 && endTime.length > 0 && !timeValid}
                />
              </Row>

              <Row icon={<MapPin className="w-4 h-4" />}>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Location (optional)"
                  className="flex-1 text-sm font-medium bg-transparent focus:outline-none placeholder:text-text-tertiary"
                  aria-label="Location"
                />
              </Row>

              {categories.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {categories.map((c) => {
                    const selected = c.id === categoryId;
                    return (
                      <motion.button
                        key={c.id}
                        type="button"
                        whileTap={tap}
                        transition={spring.snappy}
                        onClick={() => setCategoryId(c.id)}
                        aria-pressed={selected}
                        className={cn(
                          "px-3 py-1 rounded-full text-[11px] font-bold transition-all focus-ring",
                          selected ? "opacity-100" : "opacity-55 hover:opacity-85"
                        )}
                        style={{
                          background: pastelVar({ color: c.color, id: c.id }),
                          color: "var(--event-ink)",
                          boxShadow: selected ? `inset 0 0 0 2px ${c.color}` : undefined,
                        }}
                      >
                        {c.name}
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-8">
              <motion.button
                whileTap={canSubmit ? tap : undefined}
                transition={spring.snappy}
                onClick={submit}
                disabled={!canSubmit}
                className={cn(
                  "w-full py-4 text-sm font-bold rounded-2xl transition-opacity focus-ring",
                  canSubmit
                    ? "bg-[color:var(--today-pill-bg)] text-[color:var(--today-pill-ink)] shadow-card cursor-pointer"
                    : "bg-[color:var(--today-pill-bg)] text-[color:var(--today-pill-ink)] opacity-35 cursor-not-allowed"
                )}
              >
                {mode === "create" ? "Add Event" : "Save Changes"}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Row({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4">
      <span className="text-text-tertiary shrink-0">{icon}</span>
      <div className="flex-1 flex items-center gap-2 min-w-0">{children}</div>
    </div>
  );
}

function TimePill({
  value,
  onChange,
  aria,
  invalid,
}: {
  value: string;
  onChange: (v: string) => void;
  aria: string;
  invalid?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => openPicker(ref.current)}
        aria-label={aria}
        aria-invalid={invalid || undefined}
        className={cn(
          "inline-flex items-center px-3 py-1.5 rounded-xl text-[11px] font-bold tabular-nums focus-ring transition-colors",
          invalid
            ? "bg-danger/15 text-danger ring-1 ring-danger/40"
            : "bg-bg-secondary text-text-primary hover:bg-bg-elevated"
        )}
      >
        {value || "--:--"}
      </button>
      <input
        ref={ref}
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-hidden
        tabIndex={-1}
        className="sr-only"
      />
    </>
  );
}
