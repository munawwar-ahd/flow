"use client";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Fraunces } from "next/font/google";

const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["italic", "normal"],
  weight: ["400"],
  display: "swap",
});

// 12 repetitions + translateX(-8.333%) = shift by exactly 1 phrase width.
// More copies than the spec's 6 so the viewport stays filled to both edges
// on wide desktops before the loop jumps back.
const REPS = 12;

function Phrase({ index }: { index: number }) {
  return (
    <span className="inline-flex items-center" aria-hidden={index > 0}>
      <span className="italic">Scroll to begin</span>
      <span
        className="not-italic mx-6"
        style={{ color: "var(--accent)", fontSize: "0.7em" }}
      >
        ◆
      </span>
    </span>
  );
}

export function ScrollIndicator() {
  const reduced = useReducedMotion();
  // Fade out over the first ~30 % of the viewport of scroll, which
  // corresponds to 0 → 0.15 of the hero's 200vh scroll range.
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);
  const pointerEvents = useTransform(opacity, (v) =>
    v < 0.05 ? "none" : "auto"
  );

  return (
    <motion.div
      style={{ opacity, pointerEvents }}
      aria-hidden
      className="absolute left-0 right-0 bottom-12 z-20 flex flex-col items-center pointer-events-none"
    >
      {/* Hairline separator above */}
      <div
        className="h-px w-80 mb-3"
        style={{ background: "var(--separator)", opacity: 0.7 }}
      />

      {/* Marquee band — full viewport width, no horizontal padding */}
      <div className="relative w-screen marquee-mask">
        <div
          className={
            fraunces.className +
            " marquee-track text-text-secondary/85 text-[18px] md:text-[22px] lg:text-[28px]"
          }
          style={{ letterSpacing: "0.02em" }}
        >
          {reduced ? (
            // Static single phrase, centered via wrapper's width
            <div className="w-screen flex items-center justify-center">
              <Phrase index={0} />
            </div>
          ) : (
            Array.from({ length: REPS }).map((_, i) => (
              <Phrase key={i} index={i} />
            ))
          )}
        </div>
      </div>

      {/* Bouncing chevron */}
      <div className="mt-4 flex justify-center">
        <ChevronDown
          className="chevron-bob w-4 h-4 text-text-tertiary"
          strokeWidth={2}
        />
      </div>
    </motion.div>
  );
}
