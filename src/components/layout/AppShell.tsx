"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Sidebar } from "./Sidebar";
import { MobileTabBar } from "./MobileTabBar";
import { useUI, applyTheme } from "@/stores/ui";
import { useTasks } from "@/stores/tasks";
import { useNotes } from "@/stores/notes";
import { useEvents } from "@/stores/events";
import { usePomodoro } from "@/stores/pomodoro";
import { db, DEFAULT_CATEGORIES, DEFAULT_SETTINGS, uid } from "@/lib/db";
import { CommandPalette } from "@/components/shared/CommandPalette";
import { GlobalSearch } from "@/components/shared/GlobalSearch";
import { SettingsModal } from "@/components/shared/SettingsModal";
import { TaskEditor } from "@/components/shared/TaskEditor";
import { TaskDetailSheet } from "@/components/timeline/TaskDetailSheet";
import { Onboarding } from "@/components/shared/Onboarding";
import { FocusModeOverlay } from "@/components/focus/FocusModeOverlay";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { spring } from "@/lib/motion";

function useBootstrap() {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!db) return;

      const settings = await db.settings.get("singleton");
      if (!settings) {
        await db.settings.put({ ...DEFAULT_SETTINGS, id: "singleton" });
      }

      const catCount = await db.categories.count();
      if (catCount === 0) {
        await db.categories.bulkPut(DEFAULT_CATEGORIES);
      }

      await Promise.all([
        useUI.getState().load(),
        useTasks.getState().load(),
        useNotes.getState().load(),
        useEvents.getState().load(),
        usePomodoro.getState().loadSessions(),
      ]);

      const ui = useUI.getState();
      applyTheme(ui.settings.theme);

      if (!ui.settings.onboarded && (await db.tasks.count()) === 0) {
        const today = new Date();
        today.setMinutes(0, 0, 0);
        const mkTime = (h: number, m = 0) => {
          const d = new Date(today);
          d.setHours(h, m, 0, 0);
          return d.toISOString();
        };
        const seed = [
          {
            id: uid(),
            title: "Morning planning",
            categoryId: "cat-work",
            startAt: mkTime(9, 0),
            durationMin: 30,
            completed: false,
            subtasks: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: uid(),
            title: "Deep work: product spec",
            categoryId: "cat-work",
            startAt: mkTime(10, 0),
            durationMin: 90,
            completed: false,
            subtasks: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: uid(),
            title: "Lunch & walk",
            categoryId: "cat-health",
            startAt: mkTime(13, 0),
            durationMin: 45,
            completed: false,
            subtasks: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ];
        await db.tasks.bulkPut(seed as any);
        if (!cancelled) await useTasks.getState().load();
      }
    })();

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onSys = () => {
      if (useUI.getState().settings.theme === "system") applyTheme("system");
    };
    mq.addEventListener("change", onSys);
    return () => {
      cancelled = true;
      mq.removeEventListener("change", onSys);
    };
  }, []);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  useBootstrap();
  useKeyboardShortcuts();
  const pathname = usePathname();
  const isMobile = useMediaQuery("(max-width: 767px)");
  const settings = useUI((s) => s.settings);
  const sidebarCollapsed = useUI((s) => s.sidebarCollapsed);
  const onboarded = settings.onboarded;
  const isWidget = pathname?.startsWith("/widget");

  useEffect(() => {
    try {
      localStorage.setItem("flow-theme", settings.theme);
    } catch {}
  }, [settings.theme]);

  if (isWidget) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      {!isMobile && <Sidebar />}
      <main
        className={
          "min-h-screen transition-[padding] duration-300 " +
          (isMobile ? "pb-[88px]" : "")
        }
        style={{
          paddingLeft: isMobile ? 0 : sidebarCollapsed ? 64 : 220,
        }}
      >
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring.gentle}
          className="min-h-screen"
        >
          {children}
        </motion.div>
      </main>
      {isMobile && <MobileTabBar />}
      <CommandPalette />
      <GlobalSearch />
      <SettingsModal />
      <TaskEditor />
      <TaskDetailSheet />
      <FocusModeOverlay />
      {!onboarded && <Onboarding />}
    </div>
  );
}
