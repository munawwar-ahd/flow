import { create } from "zustand";

type Status = "idle" | "syncing" | "offline" | "error";

type SyncState = {
  status: Status;
  lastSyncedAt: string | null;
  pendingCount: number;
  initialPullComplete: boolean;
  showOverlay: boolean;
  setStatus: (s: Status) => void;
  setLastSyncedAt: (iso: string | null) => void;
  setPendingCount: (n: number) => void;
  setInitialPullComplete: (v: boolean) => void;
  setShowOverlay: (v: boolean) => void;
  retry: () => void;
};

const LS_KEY = "flow-sync-last-synced-at";

function readInitialLastSynced(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(LS_KEY);
  } catch {
    return null;
  }
}

export const useSync = create<SyncState>((set) => ({
  status: "idle",
  lastSyncedAt: readInitialLastSynced(),
  pendingCount: 0,
  initialPullComplete: false,
  showOverlay: false,
  setStatus: (status) => set({ status }),
  setLastSyncedAt: (iso) => {
    if (typeof window !== "undefined") {
      try {
        if (iso) localStorage.setItem(LS_KEY, iso);
        else localStorage.removeItem(LS_KEY);
      } catch {}
    }
    set({ lastSyncedAt: iso });
  },
  setPendingCount: (pendingCount) => set({ pendingCount }),
  setInitialPullComplete: (initialPullComplete) => set({ initialPullComplete }),
  setShowOverlay: (showOverlay) => set({ showOverlay }),
  retry: () => {
    if (typeof window === "undefined") return;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const eng = require("@/lib/sync/engine") as typeof import("@/lib/sync/engine");
    void eng.flushNow();
  },
}));
