"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  FileText,
  Home,
  Moon,
  Plus,
  Search,
  Settings as Cog,
  Sun,
  Timer,
  Download,
  PlayCircle,
} from "lucide-react";
import { useUI } from "@/stores/ui";
import { useTasks } from "@/stores/tasks";
import { useNotes } from "@/stores/notes";
import { usePomodoro } from "@/stores/pomodoro";
import { spring } from "@/lib/motion";

type Item = {
  id: string;
  label: string;
  hint?: string;
  icon: React.ReactNode;
  run: () => void;
  group: string;
  keywords?: string;
};

export function CommandPalette() {
  const open = useUI((s) => s.commandPaletteOpen);
  const setOpen = useUI((s) => s.setCommandPaletteOpen);
  const setEditor = useUI((s) => s.setTaskEditor);
  const setSearchOpen = useUI((s) => s.setSearchOpen);
  const setSettingsOpen = useUI((s) => s.setSettingsOpen);
  const setTheme = useUI((s) => s.setTheme);
  const settings = useUI((s) => s.settings);
  const router = useRouter();
  const tasks = useTasks((s) => s.tasks);
  const notes = useNotes((s) => s.notes);
  const addNote = useNotes((s) => s.add);
  const sessions = usePomodoro((s) => s.sessions);
  const [query, setQuery] = useState("");
  const [idx, setIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setIdx(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  const items: Item[] = useMemo(() => {
    const now = new Date();
    now.setMinutes(Math.round(now.getMinutes() / 5) * 5, 0, 0);
    const base: Item[] = [
      {
        id: "new-task",
        label: "New task",
        hint: "⌘N",
        icon: <Plus className="w-4 h-4" />,
        run: () =>
          setEditor({
            mode: "create",
            initial: { startAt: now.toISOString(), durationMin: 30 },
          }),
        group: "Create",
      },
      {
        id: "new-note",
        label: "New note",
        hint: "⌘⇧N",
        icon: <FileText className="w-4 h-4" />,
        run: async () => {
          const n = await addNote();
          router.push("/notes?id=" + n.id);
        },
        group: "Create",
      },
      {
        id: "nav-today",
        label: "Go to Today",
        hint: "G T",
        icon: <Home className="w-4 h-4" />,
        run: () => router.push("/"),
        group: "Navigate",
      },
      {
        id: "nav-cal",
        label: "Go to Calendar",
        hint: "G C",
        icon: <Calendar className="w-4 h-4" />,
        run: () => router.push("/calendar"),
        group: "Navigate",
      },
      {
        id: "nav-notes",
        label: "Go to Notes",
        hint: "G N",
        icon: <FileText className="w-4 h-4" />,
        run: () => router.push("/notes"),
        group: "Navigate",
      },
      {
        id: "nav-focus",
        label: "Go to Focus",
        hint: "G F",
        icon: <Timer className="w-4 h-4" />,
        run: () => router.push("/focus"),
        group: "Navigate",
      },
      {
        id: "start-pom",
        label: "Start pomodoro",
        icon: <PlayCircle className="w-4 h-4" />,
        run: () => {
          usePomodoro.getState().start();
          router.push("/focus");
        },
        group: "Actions",
      },
      {
        id: "toggle-theme",
        label: settings.theme === "dark" ? "Switch to light mode" : "Switch to dark mode",
        hint: "D",
        icon: settings.theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />,
        run: () => setTheme(settings.theme === "dark" ? "light" : "dark"),
        group: "Actions",
      },
      {
        id: "search",
        label: "Search tasks and notes",
        hint: "⌘F",
        icon: <Search className="w-4 h-4" />,
        run: () => setSearchOpen(true),
        group: "Actions",
      },
      {
        id: "settings",
        label: "Open settings",
        hint: "⌘,",
        icon: <Cog className="w-4 h-4" />,
        run: () => setSettingsOpen(true),
        group: "Actions",
      },
      {
        id: "export-pdf",
        label: "Export week as PDF",
        icon: <Download className="w-4 h-4" />,
        run: async () => {
          const { exportPDF } = await import("@/lib/export");
          const weekStart = new Date();
          weekStart.setDate(weekStart.getDate() - 7);
          const sel = tasks.filter((t) => new Date(t.startAt) >= weekStart);
          exportPDF({ tasks: sel, sessions, scope: "week" });
        },
        group: "Actions",
        keywords: "pdf report",
      },
    ];
    const taskItems: Item[] = tasks.slice(0, 40).map((t) => ({
      id: "task-" + t.id,
      label: t.title,
      icon: <span className="w-4 h-4 rounded-full bg-accent" />,
      run: () => useUI.getState().setActiveTaskId(t.id),
      group: "Tasks",
      keywords: t.notes,
    }));
    const noteItems: Item[] = notes.slice(0, 40).map((n) => ({
      id: "note-" + n.id,
      label: n.title || "Untitled",
      icon: <FileText className="w-4 h-4" />,
      run: () => router.push("/notes?id=" + n.id),
      group: "Notes",
      keywords: n.content,
    }));
    return [...base, ...taskItems, ...noteItems];
  }, [tasks, notes, settings.theme, router, setEditor, setSearchOpen, setSettingsOpen, setTheme, addNote, sessions]);

  const filtered = useMemo(() => {
    if (!query.trim()) return items.slice(0, 20);
    const q = query.toLowerCase();
    return items
      .map((it) => {
        const hay = (it.label + " " + (it.keywords ?? "") + " " + it.group).toLowerCase();
        let score = 0;
        if (hay.includes(q)) score += 100;
        let qi = 0;
        for (let i = 0; i < hay.length && qi < q.length; i++) {
          if (hay[i] === q[qi]) {
            score += 1;
            qi++;
          }
        }
        if (qi < q.length) return null;
        return { it, score };
      })
      .filter(Boolean)
      .sort((a, b) => b!.score - a!.score)
      .slice(0, 30)
      .map((x) => x!.it);
  }, [query, items]);

  useEffect(() => setIdx(0), [query]);

  const runItem = (it: Item) => {
    setOpen(false);
    setTimeout(() => it.run(), 30);
  };

  if (!open) return null;

  const grouped = filtered.reduce<Record<string, Item[]>>((acc, it) => {
    acc[it.group] ??= [];
    acc[it.group].push(it);
    return acc;
  }, {});

  let runningIdx = 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-start justify-center pt-[12vh] px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
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
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type a command or search…"
                className="flex-1 bg-transparent text-body focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setIdx((i) => Math.min(i + 1, filtered.length - 1));
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setIdx((i) => Math.max(i - 1, 0));
                  } else if (e.key === "Enter") {
                    e.preventDefault();
                    const sel = filtered[idx];
                    if (sel) runItem(sel);
                  }
                }}
              />
            </div>
            <div className="max-h-[60vh] overflow-y-auto flow-scroll py-1">
              {filtered.length === 0 && (
                <div className="px-4 py-6 text-center text-caption text-text-tertiary">
                  No results
                </div>
              )}
              {Object.entries(grouped).map(([group, list]) => (
                <div key={group} className="py-1">
                  <div className="px-4 text-micro uppercase tracking-wide text-text-tertiary pt-2 pb-1">
                    {group}
                  </div>
                  {list.map((it) => {
                    const current = runningIdx === idx;
                    const myIdx = runningIdx;
                    runningIdx++;
                    return (
                      <button
                        key={it.id}
                        onMouseEnter={() => setIdx(myIdx)}
                        onClick={() => runItem(it)}
                        className={
                          "w-full flex items-center gap-3 px-4 h-10 text-body text-left " +
                          (current ? "bg-accent text-white" : "hover:bg-bg-secondary")
                        }
                      >
                        <span className={current ? "text-white" : "text-text-secondary"}>{it.icon}</span>
                        <span className="flex-1 truncate">{it.label}</span>
                        {it.hint && (
                          <span className={"text-caption " + (current ? "text-white/80" : "text-text-tertiary")}>
                            {it.hint}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
            <div className="px-4 h-8 flex items-center justify-between text-micro text-text-tertiary border-t border-separator">
              <span>↑↓ navigate · ↵ select · esc close</span>
              <span>Flow</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
