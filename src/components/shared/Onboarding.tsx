"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Moon, Sun, SunMoon } from "lucide-react";
import { useUI } from "@/stores/ui";
import { Button } from "./Button";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/cn";

const slides = [
  {
    title: "Your day, at a glance.",
    desc: "Flow's timeline makes today feel like one clean page — tasks, events, and breaks in their place.",
    visual: <TimelineVisual />,
  },
  {
    title: "Focus without friction.",
    desc: "A pomodoro that gets out of the way. Tap Focus Mode and everything fades to black.",
    visual: <PomodoroVisual />,
  },
  {
    title: "Everything connected.",
    desc: "Tasks link to notes. Notes link back. Sessions log against tasks. One app, one graph.",
    visual: <ConnectedVisual />,
  },
];

export function Onboarding() {
  const [i, setI] = useState(0);
  const [name, setName] = useState("");
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const update = useUI((s) => s.updateSettings);
  const setTheme2 = useUI((s) => s.setTheme);

  const finish = async () => {
    await update({ userName: name || undefined, onboarded: true });
    await setTheme2(theme);
  };

  const isFinal = i === slides.length;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80] bg-bg-primary/95 backdrop-blur-xl flex items-center justify-center px-6"
      >
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            {!isFinal ? (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={spring.gentle}
                className="text-center"
              >
                <div className="h-48 mb-8 flex items-center justify-center">
                  {slides[i].visual}
                </div>
                <h2 className="text-display mb-3">{slides[i].title}</h2>
                <p className="text-body text-text-secondary mb-10 max-w-sm mx-auto">{slides[i].desc}</p>
                <div className="flex items-center justify-center gap-2 mb-6">
                  {slides.map((_, x) => (
                    <span
                      key={x}
                      className={cn(
                        "w-1.5 h-1.5 rounded-full transition-colors",
                        x === i ? "bg-accent w-6" : "bg-text-tertiary/40"
                      )}
                    />
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => update({ onboarded: true })}
                    className="text-body text-text-tertiary hover:text-text-secondary"
                  >
                    Skip
                  </button>
                  <Button variant="primary" onClick={() => setI(i + 1)}>
                    Next <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="final"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={spring.gentle}
                className="text-center"
              >
                <h2 className="text-display mb-3">Welcome to Flow</h2>
                <p className="text-body text-text-secondary mb-8">
                  A couple of quick things.
                </p>
                <div className="space-y-5 text-left mb-8">
                  <div>
                    <label className="text-micro uppercase tracking-wide text-text-tertiary mb-1.5 block">
                      Your name (optional)
                    </label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Alex"
                      className="w-full bg-bg-secondary border border-separator rounded-btn px-3 h-10 text-body focus-ring"
                    />
                  </div>
                  <div>
                    <label className="text-micro uppercase tracking-wide text-text-tertiary mb-2 block">
                      Appearance
                    </label>
                    <div className="flex gap-2">
                      {(["light", "system", "dark"] as const).map((v) => (
                        <button
                          key={v}
                          onClick={() => setTheme(v)}
                          className={cn(
                            "flex-1 h-12 rounded-btn border flex items-center justify-center gap-2 text-body",
                            theme === v
                              ? "bg-accent-soft border-accent text-accent"
                              : "bg-bg-secondary border-separator text-text-secondary"
                          )}
                        >
                          {v === "light" ? <Sun className="w-4 h-4" /> : v === "dark" ? <Moon className="w-4 h-4" /> : <SunMoon className="w-4 h-4" />}
                          {v[0].toUpperCase() + v.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <Button variant="primary" size="lg" className="w-full" onClick={finish}>
                  Start using Flow
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function TimelineVisual() {
  return (
    <svg viewBox="0 0 200 140" className="w-48 h-40">
      {[0, 30, 60, 90, 120].map((y) => (
        <line key={y} x1="30" x2="190" y1={y + 10} y2={y + 10} stroke="var(--separator)" />
      ))}
      <motion.rect
        x="40"
        width="140"
        rx="8"
        initial={{ y: 12, height: 20, opacity: 0 }}
        animate={{ y: 12, height: 20, opacity: 1 }}
        transition={{ delay: 0.2, ...spring.gentle }}
        fill="var(--accent-soft)"
        stroke="var(--accent)"
      />
      <motion.rect
        x="40"
        width="140"
        rx="8"
        initial={{ y: 52, height: 34, opacity: 0 }}
        animate={{ y: 52, height: 34, opacity: 1 }}
        transition={{ delay: 0.4, ...spring.gentle }}
        fill="rgba(191,90,242,0.15)"
        stroke="#BF5AF2"
      />
      <motion.rect
        x="40"
        width="140"
        rx="8"
        initial={{ y: 100, height: 18, opacity: 0 }}
        animate={{ y: 100, height: 18, opacity: 1 }}
        transition={{ delay: 0.6, ...spring.gentle }}
        fill="rgba(48,209,88,0.15)"
        stroke="var(--success)"
      />
    </svg>
  );
}

function PomodoroVisual() {
  const r = 50;
  const circ = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 140 140" className="w-40 h-40 -rotate-90">
      <circle cx="70" cy="70" r={r} stroke="var(--separator)" strokeWidth="6" fill="none" />
      <motion.circle
        cx="70"
        cy="70"
        r={r}
        stroke="var(--accent)"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ * 0.35 }}
        transition={{ duration: 1.2, ease: [0.32, 0.72, 0, 1] }}
      />
    </svg>
  );
}

function ConnectedVisual() {
  return (
    <svg viewBox="0 0 220 140" className="w-52 h-40">
      <motion.line
        x1="40"
        y1="70"
        x2="110"
        y2="40"
        stroke="var(--accent)"
        strokeDasharray="4 4"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      />
      <motion.line
        x1="110"
        y1="40"
        x2="180"
        y2="90"
        stroke="var(--accent)"
        strokeDasharray="4 4"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      />
      <motion.circle cx="40" cy="70" r="18" fill="var(--accent-soft)" stroke="var(--accent)" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ ...spring.bouncy, delay: 0.1 }} />
      <motion.circle cx="110" cy="40" r="18" fill="rgba(191,90,242,0.18)" stroke="#BF5AF2" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ ...spring.bouncy, delay: 0.3 }} />
      <motion.circle cx="180" cy="90" r="18" fill="rgba(48,209,88,0.18)" stroke="var(--success)" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ ...spring.bouncy, delay: 0.55 }} />
    </svg>
  );
}
