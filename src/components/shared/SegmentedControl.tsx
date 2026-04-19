"use client";
import { motion } from "framer-motion";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/cn";

type Option<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  value: T;
  onChange: (v: T) => void;
  options: Option<T>[];
  size?: "sm" | "md";
  className?: string;
};

export function SegmentedControl<T extends string>({ value, onChange, options, size = "md", className }: Props<T>) {
  const id = "seg-" + options.map((o) => o.value).join("-");
  return (
    <div
      role="tablist"
      className={cn(
        "relative inline-flex bg-bg-secondary rounded-btn p-0.5 border border-separator",
        size === "sm" ? "text-caption" : "text-body",
        className
      )}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "relative px-3.5 rounded-[10px] transition-colors focus-ring",
              size === "sm" ? "h-7" : "h-8",
              active ? "text-text-primary" : "text-text-secondary hover:text-text-primary"
            )}
          >
            {active && (
              <motion.div
                layoutId={id}
                className="absolute inset-0 bg-bg-elevated rounded-[10px] shadow-sm"
                transition={spring.gentle}
              />
            )}
            <span className="relative font-medium">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
