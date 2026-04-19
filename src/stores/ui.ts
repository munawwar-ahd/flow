import { create } from "zustand";
import { db, DEFAULT_SETTINGS } from "@/lib/db";
import type { Settings, TaskCategory } from "@/types/models";

type UIState = {
  settings: Settings;
  categories: TaskCategory[];
  loaded: boolean;
  sidebarCollapsed: boolean;
  commandPaletteOpen: boolean;
  searchOpen: boolean;
  settingsOpen: boolean;
  taskEditorTask: { mode: "create" | "edit"; initial?: any } | null;
  activeTaskId: string | null;
  load: () => Promise<void>;
  updateSettings: (patch: Partial<Settings>) => Promise<void>;
  addCategory: (c: TaskCategory) => Promise<void>;
  setTheme: (theme: Settings["theme"]) => Promise<void>;
  setSidebarCollapsed: (v: boolean) => void;
  setCommandPaletteOpen: (v: boolean) => void;
  setSearchOpen: (v: boolean) => void;
  setSettingsOpen: (v: boolean) => void;
  setTaskEditor: (v: UIState["taskEditorTask"]) => void;
  setActiveTaskId: (id: string | null) => void;
};

export const useUI = create<UIState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  categories: [],
  loaded: false,
  sidebarCollapsed: false,
  commandPaletteOpen: false,
  searchOpen: false,
  settingsOpen: false,
  taskEditorTask: null,
  activeTaskId: null,
  load: async () => {
    if (!db) return;
    const [s, cats] = await Promise.all([db.settings.get("singleton"), db.categories.toArray()]);
    set({
      settings: s ?? { ...DEFAULT_SETTINGS, id: "singleton" } as any,
      categories: cats,
      loaded: true,
    });
  },
  updateSettings: async (patch) => {
    const next = { ...get().settings, ...patch } as Settings;
    await db.settings.put({ ...next, id: "singleton" });
    set({ settings: next });
  },
  addCategory: async (c) => {
    await db.categories.put(c);
    set({ categories: [...get().categories, c] });
  },
  setTheme: async (theme) => {
    await get().updateSettings({ theme });
    applyTheme(theme);
  },
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
  setCommandPaletteOpen: (v) => set({ commandPaletteOpen: v }),
  setSearchOpen: (v) => set({ searchOpen: v }),
  setSettingsOpen: (v) => set({ settingsOpen: v }),
  setTaskEditor: (v) => set({ taskEditorTask: v }),
  setActiveTaskId: (id) => set({ activeTaskId: id }),
}));

export function applyTheme(theme: Settings["theme"]) {
  if (typeof window === "undefined") return;
  const root = document.documentElement;
  const resolved =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme;
  root.classList.toggle("dark", resolved === "dark");
}
