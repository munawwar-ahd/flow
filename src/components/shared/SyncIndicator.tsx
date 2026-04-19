"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { RefreshCw } from "lucide-react";
import { useSync } from "@/stores/sync";
import { cn } from "@/lib/cn";
import { spring, tap } from "@/lib/motion";

type Props = {
  variant: "sidebar" | "compact";
  collapsed?: boolean;
  className?: string;
};

function label(status: "idle" | "syncing" | "offline" | "error") {
  switch (status) {
    case "idle":
      return "Synced";
    case "syncing":
      return "Syncing…";
    case "offline":
      return "Offline";
    case "error":
      return "Sync error";
  }
}

function dotColor(status: "idle" | "syncing" | "offline" | "error") {
  switch (status) {
    case "idle":
      return "var(--success)";
    case "syncing":
      return "var(--accent)";
    case "offline":
      return "var(--text-tertiary)";
    case "error":
      return "var(--danger)";
  }
}

function Dot({ status, pulse }: { status: "idle" | "syncing" | "offline" | "error"; pulse?: boolean }) {
  return (
    <span className="relative inline-flex w-2 h-2 shrink-0">
      <span
        className="absolute inset-0 rounded-full"
        style={{ background: dotColor(status) }}
      />
      {pulse && status === "syncing" && (
        <motion.span
          className="absolute inset-0 rounded-full"
          style={{ background: dotColor(status) }}
          animate={{ scale: [1, 2.2], opacity: [0.5, 0] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
        />
      )}
    </span>
  );
}

export function SyncIndicator({ variant, collapsed, className }: Props) {
  const status = useSync((s) => s.status);
  const lastSyncedAt = useSync((s) => s.lastSyncedAt);
  const pending = useSync((s) => s.pendingCount);
  const retry = useSync((s) => s.retry);
  const [open, setOpen] = useState(false);
  const [tick, setTick] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  void tick;
  const rel = lastSyncedAt
    ? formatDistanceToNow(new Date(lastSyncedAt), { addSuffix: true })
    : "never";

  return (
    <div ref={ref} className={cn("relative", className)}>
      {variant === "sidebar" ? (
        <motion.button
          onClick={() => setOpen((v) => !v)}
          whileTap={tap}
          transition={spring.snappy}
          aria-label={`Sync status: ${label(status)}`}
          className={cn(
            "w-full flex items-center gap-2 rounded-btn text-left focus-ring transition-colors",
            collapsed ? "justify-center px-0 py-1.5" : "px-3 py-1.5 hover:bg-bg-elevated"
          )}
        >
          <Dot status={status} pulse={!reducedMotion} />
          {!collapsed && (
            <span className="text-micro uppercase tracking-wide text-text-tertiary">
              {label(status)}
            </span>
          )}
        </motion.button>
      ) : (
        <motion.button
          onClick={() => setOpen((v) => !v)}
          whileTap={tap}
          transition={spring.snappy}
          aria-label={`Sync status: ${label(status)}`}
          className="w-9 h-9 rounded-full flex items-center justify-center focus-ring"
        >
          <Dot status={status} pulse={!reducedMotion} />
        </motion.button>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: variant === "sidebar" ? 4 : 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: variant === "sidebar" ? 4 : 6, scale: 0.98 }}
            transition={spring.gentle}
            className={cn(
              "absolute z-50 glass rounded-card shadow-card border border-separator overflow-hidden",
              variant === "sidebar"
                ? "left-0 right-0 bottom-full mb-2 min-w-[220px]"
                : "right-0 top-full mt-2 w-64"
            )}
          >
            <div className="px-3 pt-3 pb-2 border-b border-separator">
              <div className="flex items-center gap-2">
                <Dot status={status} pulse={!reducedMotion} />
                <span className="text-body">{label(status)}</span>
              </div>
              <div className="text-caption text-text-tertiary mt-1">
                Last synced: {rel}
              </div>
              {pending > 0 && (
                <div className="text-caption text-text-secondary mt-0.5">
                  Pending: {pending}
                </div>
              )}
            </div>
            <button
              onClick={() => {
                retry();
                setOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-body hover:bg-bg-secondary transition-colors text-left"
            >
              <RefreshCw className="w-4 h-4 text-text-secondary" />
              <span>Retry now</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
