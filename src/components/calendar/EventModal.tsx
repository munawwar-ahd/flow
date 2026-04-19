"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { format, parse } from "date-fns";
import { Calendar as CalIcon, Clock, Copy, MapPin, MoreHorizontal, Trash2 } from "lucide-react";
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

export function EventModal({ open, mode, initial, onClose }: Props) {
  const categories = useUI((s) => s.categories);
  const add = useTasks((s) => s.add);
  const update = useTasks((s) => s.update);
  const remove = useTasks((s) => s.remove);

  const [title, setTitle] = useState("");
  const [dateStr, setDateStr] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [moreOpen, setMoreOpen] = useState(false);
  const trapRef = useFocusTrap<HTMLDivElement>(open);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open || !initial) return;
    setTitle(initial.title ?? "");
    setDateStr(toDateInputValue(initial.startAt));
    setStartTime(toTimeInputValue(initial.startAt));
    const endIso = addMinutesIso(initial.startAt, initial.durationMin ?? 60);
    setEndTime(toTimeInputValue(endIso));
    setLocation((initial as { location?: string }).location ?? "");
    setCategoryId(initial.categoryId ?? categories[0]?.id);
    setMoreOpen(false);
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

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === categoryId) ?? null,
    [categories, categoryId]
  );

  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const submit = async () => {
    if (!title.trim() || !dateStr || !startTime) return;
    const startIso = composeIso(dateStr, startTime);
    const endIso = endTime ? composeIso(dateStr, endTime) : addMinutesIso(startIso, 60);
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

  const handleDelete = async () => {
    if (mode === "edit" && initial?.id) {
      await remove(initial.id);
    }
    setMoreOpen(false);
    onClose();
  };

  const handleDuplicate = async () => {
    if (!initial) return;
    const startIso = dateStr && startTime ? composeIso(dateStr, startTime) : initial.startAt;
    const endIso = endTime ? composeIso(dateStr, endTime) : addMinutesIso(startIso, initial.durationMin ?? 60);
    await add({
      title: (title || initial.title || "Untitled").trim(),
      startAt: startIso,
      durationMin: Math.max(15, diffMinutes(startIso, endIso)),
      categoryId,
    });
    setMoreOpen(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[70] flex items-center justify-center px-4 pt-safe pb-safe"
        >
          <div className="absolute inset-0 bg-black/10 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            ref={trapRef}
            role="dialog"
            aria-modal="true"
            aria-label={mode === "create" ? "New event" : "Edit event"}
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={spring.gentle}
            className="relative w-full max-w-[400px] rounded-3xl p-7 border border-separator backdrop-blur-2xl backdrop-saturate-150 shadow-[0_20px_60px_rgba(0,0,0,0.18)]"
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
              <Row icon={<CalIcon className="w-4 h-4" />}>
                <input
                  type="date"
                  value={dateStr}
                  onChange={(e) => setDateStr(e.target.value)}
                  className="text-sm font-semibold bg-transparent focus-ring rounded-md px-1"
                  aria-label="Date"
                />
              </Row>

              <Row icon={<Clock className="w-4 h-4" />}>
                <TimePill value={startTime} onChange={setStartTime} aria="Start time" />
                <span className="text-text-tertiary text-xs">→</span>
                <TimePill value={endTime} onChange={setEndTime} aria="End time" />
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
                        whileTap={tap}
                        transition={spring.snappy}
                        onClick={() => setCategoryId(c.id)}
                        aria-pressed={selected}
                        className={cn(
                          "px-3 py-1 rounded-full text-[11px] font-bold transition-all",
                          selected && "ring-2 ring-offset-0"
                        )}
                        style={{
                          background: pastelVar({ color: c.color, id: c.id }),
                          color: "var(--event-ink)",
                        }}
                      >
                        {c.name}
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-8 flex gap-3 relative">
              <motion.button
                whileTap={tap}
                transition={spring.snappy}
                onClick={submit}
                disabled={!title.trim()}
                className={cn(
                  "flex-1 py-4 text-sm font-bold rounded-2xl shadow-lg disabled:opacity-40",
                  "bg-[color:var(--today-pill-bg)] text-[color:var(--today-pill-ink)] focus-ring"
                )}
              >
                {mode === "create" ? "Add Event" : "Save Changes"}
              </motion.button>
              <motion.button
                whileTap={tap}
                transition={spring.snappy}
                onClick={() => setMoreOpen((v) => !v)}
                aria-label="More options"
                aria-expanded={moreOpen}
                className="w-14 py-4 rounded-2xl bg-bg-secondary hover:bg-bg-elevated text-text-primary flex items-center justify-center focus-ring"
              >
                <MoreHorizontal className="w-5 h-5" />
              </motion.button>

              <AnimatePresence>
                {moreOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.98 }}
                    transition={spring.gentle}
                    className="absolute right-0 bottom-full mb-2 w-48 glass rounded-card shadow-card border border-separator overflow-hidden"
                  >
                    <button
                      onClick={handleDuplicate}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-body hover:bg-bg-secondary transition-colors text-left"
                    >
                      <Copy className="w-4 h-4 text-text-secondary" />
                      Duplicate
                    </button>
                    {mode === "edit" && (
                      <button
                        onClick={handleDelete}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-body hover:bg-danger/10 transition-colors text-left text-danger"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
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
}: {
  value: string;
  onChange: (v: string) => void;
  aria: string;
}) {
  return (
    <label className="relative inline-flex">
      <span
        className="inline-flex items-center px-3 py-1.5 bg-bg-secondary rounded-xl text-[11px] font-bold tabular-nums text-text-primary focus-within:ring-2 focus-within:ring-accent"
      >
        {value || "--:--"}
      </span>
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={aria}
        className="absolute inset-0 opacity-0 cursor-pointer"
      />
    </label>
  );
}
