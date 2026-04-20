"use client";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect } from "react";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { modalVariants, sheetVariants, spring } from "@/lib/motion";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/cn";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  widthClass?: string;
  asSheetOnMobile?: boolean;
  hideHeader?: boolean;
};

export function Modal({ open, onClose, title, children, widthClass, asSheetOnMobile = true, hideHeader }: Props) {
  const isMobile = useMediaQuery("(max-width: 767px)");
  const ref = useFocusTrap<HTMLDivElement>(open);
  const asSheet = asSheetOnMobile && isMobile;

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            variants={asSheet ? sheetVariants : modalVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={spring.gentle}
            drag={asSheet ? "y" : false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120) onClose();
            }}
            className={cn(
              "relative bg-bg-elevated text-text-primary shadow-2xl border border-separator/60",
              asSheet
                ? "w-full rounded-t-3xl max-h-[90vh] overflow-hidden pb-safe"
                : cn("rounded-3xl max-h-[85vh] overflow-hidden", widthClass ?? "w-[min(92vw,540px)]")
            )}
          >
            {asSheet && (
              <div className="flex justify-center pt-2 pb-1">
                <div className="w-10 h-1 rounded-full bg-separator" />
              </div>
            )}
            {!hideHeader && (title || !asSheet) && (
              <div className="flex items-center justify-between px-6 pt-5 pb-2">
                <h2 className="text-title" style={{ letterSpacing: "-0.3px" }}>{title}</h2>
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="w-9 h-9 rounded-full bg-bg-secondary hover:bg-bg-primary flex items-center justify-center focus-ring cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4 text-text-secondary" />
                </button>
              </div>
            )}
            <div className="px-6 pb-6 overflow-y-auto flow-scroll max-h-[calc(85vh-72px)]">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
