"use client";
import { useInView, motion } from "framer-motion";
import { useRef } from "react";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/cn";

type Props = {
  label: string;
  heading: string;
  body: string;
  visual: React.ReactNode;
  reverse?: boolean;
};

export function FeatureSection({ label, heading, body, visual, reverse }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.35, once: true });

  return (
    <section
      ref={ref}
      className={cn(
        "min-h-screen w-full flex items-center justify-center px-6 md:px-12 py-24",
        "bg-bg-primary"
      )}
    >
      <div
        className={cn(
          "w-full max-w-6xl flex flex-col gap-12 items-center",
          "md:grid md:gap-16 md:items-center",
          reverse ? "md:grid-cols-[60%_40%]" : "md:grid-cols-[40%_60%]"
        )}
      >
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...spring.gentle, delay: 0.05 }}
          className={cn("max-w-[520px]", reverse && "md:order-2")}
        >
          <div
            className="text-[11px] font-semibold uppercase mb-4"
            style={{ letterSpacing: "2px", color: "var(--accent)" }}
          >
            {label}
          </div>
          <h2
            className="text-text-primary text-[32px] md:text-[40px] lg:text-[44px] font-bold leading-[1.1]"
            style={{ letterSpacing: "-0.5px" }}
          >
            {heading}
          </h2>
          <p className="mt-6 text-[18px] leading-relaxed text-text-secondary max-w-[420px]">
            {body}
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ ...spring.gentle, delay: 0.2 }}
          className={cn("w-full", reverse && "md:order-1")}
        >
          {visual}
        </motion.div>
      </div>
    </section>
  );
}
