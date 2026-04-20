"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useAuthStore } from "@/stores/auth";
import { spring, tap } from "@/lib/motion";
import { cn } from "@/lib/cn";
import { ScrollIndicator } from "./ScrollIndicator";

const FRAME_COUNT = 30;
const FRAME_EXT = "jpg";
const FRAME_BASE = "/frames";

function framePath(i: number) {
  return `${FRAME_BASE}/frame_${String(i + 1).padStart(2, "0")}.${FRAME_EXT}`;
}

type Stage = {
  from: number;
  to: number;
  headline: string;
  sub?: string;
  cta?: boolean;
};

const STAGES: Stage[] = [
  { from: 0, to: 0.33, headline: "Your time, beautifully organized." },
  { from: 0.33, to: 0.66, headline: "Flow with your day." },
  {
    from: 0.66,
    to: 1,
    headline: "Simplicity, synced everywhere.",
    sub: "Free forever.",
    cta: true,
  },
];

export function Hero() {
  const reduced = useReducedMotion();
  const heroRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const framesRef = useRef<HTMLImageElement[]>([]);
  const currentFrameRef = useRef<number>(-1);
  const pendingFrameRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);

  const [loaded, setLoaded] = useState(0);
  const allLoaded = loaded >= FRAME_COUNT;

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end end"],
  });

  // Preload all frames once on mount.
  useEffect(() => {
    let cancelled = false;
    const imgs: HTMLImageElement[] = [];
    let done = 0;
    for (let i = 0; i < FRAME_COUNT; i++) {
      const img = new Image();
      img.decoding = "async";
      img.src = framePath(i);
      img.onload = img.onerror = () => {
        if (cancelled) return;
        done += 1;
        setLoaded(done);
      };
      imgs.push(img);
    }
    framesRef.current = imgs;
    return () => {
      cancelled = true;
    };
  }, []);

  // Size the canvas (with DPR) + redraw current frame on resize.
  const sizeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Redraw whatever frame is current.
    drawFrame(currentFrameRef.current === -1 ? 0 : currentFrameRef.current, true);
  };

  const drawFrame = (idx: number, force = false) => {
    if (!force && idx === currentFrameRef.current) return;
    const canvas = canvasRef.current;
    const img = framesRef.current[idx];
    if (!canvas || !img || !img.complete || img.naturalWidth === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    // object-fit: cover math
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    const scale = Math.max(w / iw, h / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    const dx = (w - dw) / 2;
    const dy = (h - dh) / 2;
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(img, dx, dy, dw, dh);
    currentFrameRef.current = idx;
  };

  // rAF loop — only paints when pending frame index differs from current.
  useEffect(() => {
    sizeCanvas();
    const onResize = () => {
      // immediate redraw, no debounce for a single redraw call
      sizeCanvas();
    };
    window.addEventListener("resize", onResize);

    const tick = () => {
      drawFrame(pendingFrameRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("resize", onResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Subscribe to scroll progress → pending frame index.
  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (p) => {
      if (reduced) {
        pendingFrameRef.current = Math.floor(FRAME_COUNT / 2);
        return;
      }
      const clamped = Math.max(0, Math.min(1, p));
      pendingFrameRef.current = Math.min(
        FRAME_COUNT - 1,
        Math.round(clamped * (FRAME_COUNT - 1))
      );
    });
    return () => unsubscribe();
  }, [scrollYProgress, reduced]);

  // When a newly-loaded frame matches the pending index, draw it immediately
  // (handles the case where the user starts scrolling before all frames are in).
  useEffect(() => {
    drawFrame(pendingFrameRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  return (
    <div ref={heroRef} className="relative w-full" style={{ height: "200vh" }}>
      <div className="sticky top-0 left-0 right-0 h-screen w-full overflow-hidden bg-bg-primary">
        <canvas
          ref={canvasRef}
          role="img"
          aria-label="Animated illustration of Flow"
          className="absolute inset-0 w-full h-full block"
        />

        {/* Loading progress bar */}
        {!allLoaded && (
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-separator/30 z-10">
            <motion.div
              className="h-full"
              style={{ background: "var(--accent)" }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.round((loaded / FRAME_COUNT) * 100)}%` }}
              transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
            />
          </div>
        )}

        <TextLayer scrollYProgress={scrollYProgress} reduced={!!reduced} />
        <ScrollIndicator />
      </div>
    </div>
  );
}

function TextLayer({
  scrollYProgress,
  reduced,
}: {
  scrollYProgress: ReturnType<typeof useScroll>["scrollYProgress"];
  reduced: boolean;
}) {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none px-6 pt-[72px]">
      <div className="max-w-4xl w-full text-center">
        {STAGES.map((stage, i) => (
          <StageText key={i} stage={stage} scrollYProgress={scrollYProgress} reduced={reduced} />
        ))}
      </div>
    </div>
  );
}

function StageText({
  stage,
  scrollYProgress,
  reduced,
}: {
  stage: Stage;
  scrollYProgress: ReturnType<typeof useScroll>["scrollYProgress"];
  reduced: boolean;
}) {
  const user = useAuthStore((s) => s.user);
  const ctaHref = user ? "/calendar" : "/login";

  const { from, to } = stage;
  const mid = (from + to) / 2;
  const fadeIn = from + (mid - from) * 0.6;
  const fadeOut = to - (to - mid) * 0.6;

  const opacity = useTransform(
    scrollYProgress,
    [from - 0.02, fadeIn, fadeOut, to + 0.02],
    [0, 1, 1, 0]
  );
  const y = useTransform(
    scrollYProgress,
    [from, fadeIn, fadeOut, to],
    reduced ? [0, 0, 0, 0] : [24, 0, 0, -24]
  );

  return (
    <motion.div
      style={{ opacity, y }}
      className="absolute inset-0 flex flex-col items-center justify-center"
    >
      <h1
        className={cn(
          "font-bold text-text-primary text-[32px] md:text-[40px] lg:text-[56px]",
          "leading-[1.05]"
        )}
        style={{
          letterSpacing: "-1.5px",
          textShadow: "0 1px 20px rgba(0,0,0,0.05)",
          fontWeight: 700,
        }}
      >
        {stage.headline}
      </h1>
      {stage.sub && (
        <p
          className="mt-4 text-[20px] font-normal text-text-secondary"
          style={{ textShadow: "0 1px 20px rgba(0,0,0,0.05)" }}
        >
          {stage.sub}
        </p>
      )}
      {stage.cta && (
        <div className="mt-8 pointer-events-auto">
          <Link href={ctaHref}>
            <motion.span
              whileTap={tap}
              transition={spring.snappy}
              className="inline-flex items-center h-14 px-8 rounded-full text-[17px] font-semibold cursor-pointer focus-ring shadow-lg hover:brightness-110 transition-[filter]"
              style={{
                background: "var(--today-pill-bg)",
                color: "var(--today-pill-ink)",
              }}
            >
              Get Started
            </motion.span>
          </Link>
        </div>
      )}
    </motion.div>
  );
}
