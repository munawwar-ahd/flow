"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUI, applyTheme } from "@/stores/ui";
import { useTasks } from "@/stores/tasks";
import { usePomodoro } from "@/stores/pomodoro";

export function useKeyboardShortcuts() {
  const router = useRouter();
  const gChord = useRef<number>(0);

  useEffect(() => {
    const handler = async (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          (target as HTMLElement).isContentEditable);
      const mod = e.metaKey || e.ctrlKey;

      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        useUI.getState().setCommandPaletteOpen(true);
        return;
      }

      if (mod && e.shiftKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        const { add } = useTasks.getState();
        // handled via palette; fallback: create note
        const mod2 = await import("@/stores/notes");
        const n = await mod2.useNotes.getState().add();
        router.push("/notes?id=" + n.id);
        return;
      }

      if (mod && e.key.toLowerCase() === "n") {
        e.preventDefault();
        const now = new Date();
        now.setMinutes(Math.round(now.getMinutes() / 5) * 5, 0, 0);
        useUI.getState().setTaskEditor({
          mode: "create",
          initial: { startAt: now.toISOString(), durationMin: 30 },
        });
        return;
      }

      if (mod && e.key.toLowerCase() === "f") {
        e.preventDefault();
        useUI.getState().setSearchOpen(true);
        return;
      }

      if (mod && e.key === ",") {
        e.preventDefault();
        useUI.getState().setSettingsOpen(true);
        return;
      }

      if (e.key === "Escape") {
        const ui = useUI.getState();
        if (ui.commandPaletteOpen) ui.setCommandPaletteOpen(false);
        else if (ui.searchOpen) ui.setSearchOpen(false);
        else if (ui.settingsOpen) ui.setSettingsOpen(false);
        else if (ui.taskEditorTask) ui.setTaskEditor(null);
        else if (ui.activeTaskId) ui.setActiveTaskId(null);
        else if (usePomodoro.getState().focusMode) usePomodoro.getState().setFocusMode(false);
        return;
      }

      if (isInput) return;

      if (e.key === "/") {
        e.preventDefault();
        useUI.getState().setSearchOpen(true);
        return;
      }

      if (e.key.toLowerCase() === "d" && !mod) {
        const ui = useUI.getState();
        const cur = ui.settings.theme;
        const next = cur === "dark" ? "light" : "dark";
        ui.setTheme(next);
        return;
      }

      if (e.key === " " && window.location.pathname === "/focus") {
        e.preventDefault();
        const p = usePomodoro.getState();
        if (p.running) p.pause();
        else p.start();
        return;
      }

      if (e.key.toLowerCase() === "g") {
        gChord.current = Date.now();
        return;
      }
      if (Date.now() - gChord.current < 1200) {
        const k = e.key.toLowerCase();
        if (k === "t") router.push("/");
        else if (k === "c") router.push("/calendar");
        else if (k === "n") router.push("/notes");
        else if (k === "f") router.push("/focus");
        gChord.current = 0;
        return;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [router]);
}
