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
import { useSync } from "@/stores/sync";
import { useAuthStore } from "@/stores/auth";
import { db, DEFAULT_CATEGORIES, DEFAULT_SETTINGS, syncedBulkPut, syncedPut, uid } from "@/lib/db";
import type { Task, TaskCategory } from "@/types/models";
import { CommandPalette } from "@/components/shared/CommandPalette";
import { GlobalSearch } from "@/components/shared/GlobalSearch";
import { SettingsModal } from "@/components/shared/SettingsModal";
import { TaskEditor } from "@/components/shared/TaskEditor";
import { TaskDetailSheet } from "@/components/timeline/TaskDetailSheet";
import { Onboarding } from "@/components/shared/Onboarding";
import { FocusModeOverlay } from "@/components/focus/FocusModeOverlay";
import { SyncOverlay } from "@/components/shared/SyncOverlay";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useAuth } from "@/hooks/useAuth";
import { useSyncLifecycle } from "@/hooks/useSync";
import { spring } from "@/lib/motion";

function useBootstrap() {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const authLoading = useAuthStore((s) => s.loading);
  const initialPullComplete = useSync((s) => s.initialPullComplete);

  useEffect(() => {
    let cancelled = false;
    if (!db) return;
    // Don't seed while auth is still resolving (avoids seeding as unauth,
    // then syncing as authed and duplicating). If authed, wait for the
    // initial pull so cloud data has priority over local defaults.
    if (authLoading) return;
    if (userId && !initialPullComplete) return;

    (async () => {
      const nowIso = () => new Date().toISOString();

      const settings = await db.settings.get("singleton");
      if (!settings) {
        await syncedPut("settings", {
          ...DEFAULT_SETTINGS,
          id: "singleton",
          createdAt: nowIso(),
          updatedAt: nowIso(),
        });
      }

      const catCount = await db.categories.count();
      if (catCount === 0) {
        const cats: TaskCategory[] = DEFAULT_CATEGORIES.map((c) => ({ ...c }));
        await syncedBulkPut("category", cats);
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
        const nowIsoSeed = nowIso();
        const seed: Task[] = [
          {
            id: uid(),
            title: "Morning planning",
            categoryId: "cat-work",
            startAt: mkTime(9, 0),
            durationMin: 30,
            completed: false,
            subtasks: [],
            createdAt: nowIsoSeed,
            updatedAt: nowIsoSeed,
            deletedAt: null,
          },
          {
            id: uid(),
            title: "Deep work: product spec",
            categoryId: "cat-work",
            startAt: mkTime(10, 0),
            durationMin: 90,
            completed: false,
            subtasks: [],
            createdAt: nowIsoSeed,
            updatedAt: nowIsoSeed,
            deletedAt: null,
          },
          {
            id: uid(),
            title: "Lunch & walk",
            categoryId: "cat-health",
            startAt: mkTime(13, 0),
            durationMin: 45,
            completed: false,
            subtasks: [],
            createdAt: nowIsoSeed,
            updatedAt: nowIsoSeed,
            deletedAt: null,
          },
        ];
        await syncedBulkPut("task", seed);
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
  }, [userId, authLoading, initialPullComplete]);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  useAuth();
  useSyncLifecycle();
  useBootstrap();
  useKeyboardShortcuts();
  const pathname = usePathname();
  const isMobile = useMediaQuery("(max-width: 767px)");
  const settings = useUI((s) => s.settings);
  const sidebarCollapsed = useUI((s) => s.sidebarCollapsed);
  const onboarded = settings.onboarded;
  const isWidget = pathname?.startsWith("/widget");
  const isAuthRoute = pathname === "/login" || pathname?.startsWith("/auth/");
  const isLanding = pathname === "/";

  useEffect(() => {
    try {
      localStorage.setItem("flow-theme", settings.theme);
    } catch {}
  }, [settings.theme]);

  if (isWidget || isAuthRoute || isLanding) {
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
          paddingLeft: isMobile ? 0 : sidebarCollapsed ? 72 : 240,
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
      <SyncOverlay />
      {!onboarded && <Onboarding />}
    </div>
  );
}
