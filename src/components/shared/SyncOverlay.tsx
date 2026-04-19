"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useSync } from "@/stores/sync";
import { spring } from "@/lib/motion";

export function SyncOverlay() {
  const show = useSync((s) => s.showOverlay);

  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[90] bg-bg-primary/80 backdrop-blur-2xl flex items-center justify-center px-4 pt-safe pb-safe"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={spring.gentle}
            className="w-full max-w-[380px] rounded-3xl p-10 border border-separator shadow-card text-center backdrop-blur-3xl backdrop-saturate-150"
            style={{ background: "var(--glass-bg)" }}
          >
            <div className="flex items-center justify-center mb-5">
              <svg width="44" height="44" viewBox="0 0 44 44" className="-rotate-90">
                <circle cx="22" cy="22" r="18" stroke="var(--separator)" strokeWidth="3" fill="none" />
                {reduced ? (
                  <circle
                    cx="22"
                    cy="22"
                    r="18"
                    stroke="var(--accent)"
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 18 * 0.3} ${2 * Math.PI * 18}`}
                  />
                ) : (
                  <motion.circle
                    cx="22"
                    cy="22"
                    r="18"
                    stroke="var(--accent)"
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 18 * 0.3} ${2 * Math.PI * 18}`}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
                    style={{ transformOrigin: "22px 22px" }}
                  />
                )}
              </svg>
            </div>
            <div className="text-headline">Syncing your data…</div>
            <div className="text-caption text-text-tertiary mt-1.5">
              Pulling tasks, notes, and sessions from the cloud.
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
