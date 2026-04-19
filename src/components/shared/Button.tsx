"use client";
import { motion } from "framer-motion";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { spring, tap } from "@/lib/motion";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onAnimationStart" | "onDragStart" | "onDragEnd" | "onDrag"> & {
  variant?: Variant;
  size?: Size;
  iconOnly?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "secondary", size = "md", iconOnly, className, children, ...rest },
  ref
) {
  const variantClass =
    variant === "primary"
      ? "bg-accent text-white hover:brightness-110"
      : variant === "danger"
        ? "bg-danger text-white hover:brightness-110"
        : variant === "ghost"
          ? "bg-transparent text-text-primary hover:bg-bg-secondary"
          : "bg-bg-secondary text-text-primary hover:bg-bg-elevated border border-separator";

  const sizeClass =
    size === "sm"
      ? iconOnly
        ? "w-8 h-8"
        : "h-8 px-3 text-caption"
      : size === "lg"
        ? iconOnly
          ? "w-14 h-14"
          : "h-14 px-6 text-headline"
        : iconOnly
          ? "w-10 h-10"
          : "h-10 px-4 text-body";

  return (
    <motion.button
      ref={ref}
      whileTap={tap}
      transition={spring.snappy}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-btn font-medium select-none focus-ring transition-colors disabled:opacity-40",
        variantClass,
        sizeClass,
        className
      )}
      {...(rest as any)}
    >
      {children}
    </motion.button>
  );
});
