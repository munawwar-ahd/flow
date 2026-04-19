"use client";
import { motion } from "framer-motion";
import { spring } from "@/lib/motion";

export function PomodoroRing({
  progress,
  size = 280,
  stroke = 8,
  label,
  sublabel,
  color = "var(--accent)",
  breathing = false,
}: {
  progress: number;
  size?: number;
  stroke?: number;
  label: string;
  sublabel?: string;
  color?: string;
  breathing?: boolean;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;

  return (
    <motion.div
      className="relative"
      style={{ width: size, height: size }}
      animate={breathing ? { scale: [1, 1.02, 1] } : { scale: 1 }}
      transition={breathing ? { duration: 4, repeat: Infinity, ease: "easeInOut" } : spring.gentle}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="var(--separator)"
          strokeWidth={stroke}
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circ}
          animate={{ strokeDashoffset: circ * (1 - Math.max(0, Math.min(1, progress))) }}
          transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div
          className="font-mono tabular-nums"
          style={{ fontSize: size * 0.17, fontWeight: 500, letterSpacing: "-0.02em" }}
        >
          {label}
        </div>
        {sublabel && (
          <div className="text-caption text-text-tertiary mt-1">{sublabel}</div>
        )}
      </div>
    </motion.div>
  );
}
