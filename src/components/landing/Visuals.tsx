"use client";
import { motion } from "framer-motion";
import { spring } from "@/lib/motion";

// All visuals are lightweight CSS/SVG compositions — placeholders for real
// screenshots later, stylized to match the Calendar page aesthetic.

export function TimelineVisual() {
  return (
    <div
      className="rounded-3xl p-6 shadow-card border border-separator/60"
      style={{ background: "var(--bg-sidebar-soft)" }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="text-[11px] font-bold uppercase tracking-wide text-text-tertiary">
          Tuesday · 21 Apr
        </div>
        <div className="flex gap-1.5">
          <span className="w-2 h-2 rounded-full bg-danger/60" />
          <span className="w-2 h-2 rounded-full bg-warning/60" />
          <span className="w-2 h-2 rounded-full bg-success/60" />
        </div>
      </div>
      <div className="relative" style={{ height: 320 }}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="absolute left-0 right-0 border-t border-dashed border-separator/60"
            style={{ top: i * 80 }}
          />
        ))}
        <span className="absolute left-0 -top-1 text-[10px] font-semibold text-text-tertiary">
          09:00
        </span>
        <span className="absolute left-0 top-[76px] text-[10px] font-semibold text-text-tertiary">
          10:00
        </span>
        <span className="absolute left-0 top-[156px] text-[10px] font-semibold text-text-tertiary">
          11:00
        </span>
        <span className="absolute left-0 top-[236px] text-[10px] font-semibold text-text-tertiary">
          12:00
        </span>

        <Block top={10} height={70} bg="var(--event-5)" title="Design sync" time="09:00" delay={0.1} />
        <Block top={100} height={110} bg="var(--event-1)" title="Deep work" time="10:15" delay={0.22} />
        <Block top={230} height={60} bg="var(--event-4)" title="Lunch walk" time="12:00" delay={0.32} />
      </div>
    </div>
  );
}

function Block({
  top,
  height,
  bg,
  title,
  time,
  delay,
}: {
  top: number;
  height: number;
  bg: string;
  title: string;
  time: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ ...spring.gentle, delay }}
      className="absolute left-14 right-2 rounded-xl shadow-sm px-3 py-2.5"
      style={{ top, height, background: bg }}
    >
      <div
        className="text-[10px] font-semibold"
        style={{ color: "var(--event-ink-soft)" }}
      >
        {time}
      </div>
      <div
        className="text-[12px] font-bold truncate"
        style={{ color: "var(--event-ink)" }}
      >
        {title}
      </div>
    </motion.div>
  );
}

export function FocusVisual() {
  const r = 90;
  const circ = 2 * Math.PI * r;
  return (
    <div
      className="rounded-3xl p-10 shadow-card border border-separator/60 flex items-center justify-center"
      style={{ background: "var(--event-7)" }}
    >
      <div className="relative" style={{ width: 220, height: 220 }}>
        <svg width={220} height={220} className="-rotate-90">
          <circle cx={110} cy={110} r={r} stroke="var(--separator)" strokeWidth="6" fill="none" />
          <motion.circle
            cx={110}
            cy={110}
            r={r}
            stroke="var(--accent)"
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            whileInView={{ strokeDashoffset: circ * 0.35 }}
            viewport={{ once: true }}
            transition={{ duration: 1.4, ease: [0.32, 0.72, 0, 1] }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="font-mono tabular-nums text-[40px] font-medium text-text-primary">
            16:22
          </div>
          <div className="text-caption text-text-tertiary mt-1">Focus time</div>
        </div>
      </div>
    </div>
  );
}

export function SyncVisual() {
  return (
    <div
      className="rounded-3xl p-10 shadow-card border border-separator/60 relative overflow-hidden"
      style={{ background: "var(--bg-sidebar-soft)" }}
    >
      <div className="flex items-center justify-center gap-10">
        {/* Laptop */}
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ ...spring.gentle, delay: 0.1 }}
          className="relative"
          style={{ width: 260, height: 170 }}
        >
          <div
            className="absolute inset-x-0 top-0 rounded-xl shadow-card border border-separator/60"
            style={{
              height: 155,
              background: "linear-gradient(135deg, var(--event-5), var(--event-1))",
            }}
          />
          <div
            className="absolute left-1/2 -translate-x-1/2 bottom-0 h-[15px] w-[100%] rounded-b-2xl"
            style={{ background: "var(--separator)" }}
          />
        </motion.div>

        {/* Sync line with dot */}
        <motion.div
          className="relative h-px flex-shrink-0"
          style={{ width: 60, background: "var(--accent)" }}
          initial={{ scaleX: 0, opacity: 0 }}
          whileInView={{ scaleX: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
            style={{ background: "var(--accent)" }}
            animate={{ x: [0, 50, 0] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>

        {/* Phone */}
        <motion.div
          initial={{ opacity: 0, x: 8 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ ...spring.gentle, delay: 0.2 }}
          className="rounded-2xl shadow-card border border-separator/60"
          style={{
            width: 90,
            height: 170,
            background: "linear-gradient(135deg, var(--event-2), var(--event-3))",
          }}
        />
      </div>
    </div>
  );
}
