"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { FileText, Calendar as CalIcon, CheckSquare, Search } from "lucide-react";
import { useUI } from "@/stores/ui";
import { useTasks } from "@/stores/tasks";
import { useNotes } from "@/stores/notes";
import { useEvents } from "@/stores/events";
import { spring } from "@/lib/motion";

type Hit = {
  id: string;
  kind: "task" | "note" | "event";
  title: string;
  subtitle?: string;
  onSelect: () => void;
};

export function GlobalSearch() {
  const open = useUI((s) => s.searchOpen);
  const setOpen = useUI((s) => s.setSearchOpen);
  const setActive = useUI((s) => s.setActiveTaskId);
  const tasks = useTasks((s) => s.tasks);
  const notes = useNotes((s) => s.notes);
  const events = useEvents((s) => s.events);
  const router = useRouter();
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQ("");
      setIdx(0);
      setTimeout(() => ref.current?.focus(), 30);
    }
  }, [open]);

  const hits = useMemo<Hit[]>(() => {
    if (!q.trim()) return [];
    const needle = q.toLowerCase();
    const out: Hit[] = [];
    for (const t of tasks) {
      if ((t.title + " " + (t.notes ?? "")).toLowerCase().includes(needle)) {
        out.push({
          id: "t-" + t.id,
          kind: "task",
          title: t.title,
          subtitle: format(new Date(t.startAt), "PP p"),
          onSelect: () => {
            setOpen(false);
            setActive(t.id);
          },
        });
      }
    }
    for (const n of notes) {
      if ((n.title + " " + n.content).toLowerCase().includes(needle)) {
        out.push({
          id: "n-" + n.id,
          kind: "note",
          title: n.title || "Untitled",
          subtitle: n.content.slice(0, 80),
          onSelect: () => {
            setOpen(false);
            router.push("/notes?id=" + n.id);
          },
        });
      }
    }
    for (const e of events) {
      if ((e.title + " " + (e.description ?? "")).toLowerCase().includes(needle)) {
        out.push({
          id: "e-" + e.id,
          kind: "event",
          title: e.title,
          subtitle: format(new Date(e.startAt), "PP p"),
          onSelect: () => {
            setOpen(false);
            router.push("/calendar");
          },
        });
      }
    }
    return out.slice(0, 40);
  }, [q, tasks, notes, events, router, setActive, setOpen]);

  useEffect(() => setIdx(0), [q]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[60] flex items-start justify-center pt-[12vh] px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
      >
        <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -8 }}
          transition={spring.gentle}
          className="relative w-full max-w-xl glass rounded-modal shadow-card overflow-hidden border border-separator"
        >
          <div className="flex items-center gap-2 px-4 h-12 border-b border-separator">
            <Search className="w-4 h-4 text-text-tertiary" />
            <input
              ref={ref}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search everything…"
              className="flex-1 bg-transparent text-body focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setIdx((i) => Math.min(i + 1, hits.length - 1));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setIdx((i) => Math.max(i - 1, 0));
                } else if (e.key === "Enter") {
                  e.preventDefault();
                  hits[idx]?.onSelect();
                }
              }}
            />
          </div>
          <div className="max-h-[60vh] overflow-y-auto flow-scroll py-1">
            {q && hits.length === 0 && (
              <div className="px-4 py-6 text-center text-caption text-text-tertiary">
                No matches.
              </div>
            )}
            {hits.map((h, i) => {
              const Icon = h.kind === "task" ? CheckSquare : h.kind === "note" ? FileText : CalIcon;
              const active = i === idx;
              return (
                <button
                  key={h.id}
                  onMouseEnter={() => setIdx(i)}
                  onClick={h.onSelect}
                  className={
                    "w-full flex items-start gap-3 px-4 py-2.5 text-left " +
                    (active ? "bg-accent text-white" : "hover:bg-bg-secondary")
                  }
                >
                  <Icon className={"w-4 h-4 mt-0.5 " + (active ? "text-white" : "text-text-secondary")} />
                  <div className="flex-1 min-w-0">
                    <div className="text-body truncate">{h.title}</div>
                    {h.subtitle && (
                      <div className={"text-caption truncate " + (active ? "text-white/80" : "text-text-tertiary")}>
                        {h.subtitle}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
