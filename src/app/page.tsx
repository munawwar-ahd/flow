"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { spring } from "@/lib/motion";

export default function LandingPage() {
  const stagger = (i: number) => ({
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { ...spring.gentle, delay: 0.05 * i },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary px-6 pt-safe pb-safe">
      <div className="w-full max-w-md text-center">
        <motion.h1
          {...stagger(1)}
          className="text-display text-text-primary"
          style={{ letterSpacing: "-0.5px" }}
        >
          Flow
        </motion.h1>
        <motion.p
          {...stagger(2)}
          className="text-body text-text-secondary mt-2"
        >
          Landing coming soon.
        </motion.p>
        <motion.div {...stagger(3)} className="mt-8">
          <Link
            href="/calendar"
            className="inline-flex items-center gap-1.5 text-caption font-semibold text-accent hover:brightness-110 focus-ring rounded-md px-2 py-1"
          >
            Go to your calendar
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
