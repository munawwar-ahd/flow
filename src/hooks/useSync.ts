"use client";
import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth";
import { startSync, stopSync } from "@/lib/sync/engine";

export function useSyncLifecycle(): void {
  const userId = useAuthStore((s) => s.user?.id ?? null);

  useEffect(() => {
    if (!userId) {
      void stopSync();
      return;
    }
    void startSync(userId);
    return () => {
      void stopSync();
    };
  }, [userId]);
}
