import type { Transition } from "framer-motion";

export const spring = {
  gentle: { type: "spring", stiffness: 300, damping: 30, mass: 0.8 } as Transition,
  snappy: { type: "spring", stiffness: 500, damping: 35, mass: 0.6 } as Transition,
  bouncy: { type: "spring", stiffness: 400, damping: 20, mass: 0.8 } as Transition,
  smooth: { type: "tween", duration: 0.25, ease: [0.32, 0.72, 0, 1] } as Transition,
};

export const tap = { scale: 0.97 };

export const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export const modalVariants = {
  initial: { opacity: 0, scale: 0.94 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.94 },
};

export const sheetVariants = {
  initial: { opacity: 0, y: "100%" },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: "100%" },
};
