"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { usePomodoro } from "@/stores/pomodoro";
import { useTasks } from "@/stores/tasks";
import { PomodoroRing } from "./PomodoroRing";
import { useInterval } from "@/hooks/useInterval";

function fmt(ms: number) {
  const s = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${m.toString().padStart(2, "0")}:${ss.toString().padStart(2, "0")}`;
}

export function FocusModeOverlay() {
  const focusMode = usePomodoro((s) => s.focusMode);
  const setFocusMode = usePomodoro((s) => s.setFocusMode);
  const running = usePomodoro((s) => s.running);
  const startedAt = usePomodoro((s) => s.startedAt);
  const remainingMs = usePomodoro((s) => s.remainingMs);
  const totalMs = usePomodoro((s) => s.totalMs);
  const linkedTaskId = usePomodoro((s) => s.linkedTaskId);
  const task = useTasks((s) => s.tasks.find((t) => t.id === linkedTaskId));

  const [tick, setTick] = useState(0);
  useInterval(() => setTick((t) => t + 1), focusMode ? 250 : null);

  const live = running && startedAt ? Math.max(0, remainingMs - (Date.now() - startedAt)) : remainingMs;
  const progress = totalMs > 0 ? 1 - live / totalMs : 0;

  const holdStart = useRef<number | null>(null);
  const [holdProg, setHoldProg] = useState(0);

  useEffect(() => {
    let id: number | null = null;
    if (holdStart.current != null) {
      id = window.setInterval(() => {
        const p = Math.min(1, (Date.now() - (holdStart.current ?? 0)) / 2000);
        setHoldProg(p);
        if (p >= 1) {
          setFocusMode(false);
          holdStart.current = null;
          setHoldProg(0);
        }
      }, 30);
    }
    return () => {
      if (id) clearInterval(id);
    };
  }, [holdProg > 0]);

  return (
    <AnimatePresence>
      {focusMode && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
          style={{ background: "rgba(0,0,0,0.94)" }}
        >
          <button
            onMouseDown={() => {
              holdStart.current = Date.now();
              setHoldProg(0.001);
            }}
            onTouchStart={() => {
              holdStart.current = Date.now();
              setHoldProg(0.001);
            }}
            onMouseUp={() => {
              holdStart.current = null;
              setHoldProg(0);
            }}
            onMouseLeave={() => {
              holdStart.current = null;
              setHoldProg(0);
            }}
            onTouchEnd={() => {
              holdStart.current = null;
              setHoldProg(0);
            }}
            aria-label="Hold to exit focus"
            className="absolute top-6 right-6 w-12 h-12 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-colors relative"
          >
            <svg viewBox="0 0 40 40" className="absolute inset-0 -rotate-90">
              <circle cx="20" cy="20" r="18" stroke="rgba(255,255,255,0.1)" strokeWidth="2" fill="none" />
              <circle
                cx="20"
                cy="20"
                r="18"
                stroke="white"
                strokeWidth="2"
                fill="none"
                strokeDasharray={2 * Math.PI * 18}
                strokeDashoffset={2 * Math.PI * 18 * (1 - holdProg)}
                strokeLinecap="round"
              />
            </svg>
            <X className="w-5 h-5 relative" />
          </button>

          <div className="text-white/50 text-micro uppercase tracking-widest mb-6">
            {running ? "Focusing" : "Paused"}
          </div>
          <PomodoroRing
            progress={progress}
            label={fmt(live)}
            size={420}
            stroke={10}
            color="#FFFFFF"
            breathing
          />
          {task && (
            <div className="mt-8 text-white/80 text-body truncate max-w-md text-center px-4">
              {task.title}
            </div>
          )}
          <div className="mt-12 text-white/30 text-caption select-none">
            Hold × in top-right to exit · Esc
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
