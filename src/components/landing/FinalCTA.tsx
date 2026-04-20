"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useAuthStore } from "@/stores/auth";
import { spring, tap } from "@/lib/motion";

export function FinalCTA() {
  const user = useAuthStore((s) => s.user);
  const href = user ? "/calendar" : "/login";

  return (
    <section className="w-full flex flex-col items-center justify-center text-center px-6 py-32 bg-bg-primary">
      <div className="h-px w-32 bg-separator/50 mb-16" aria-hidden />
      <motion.h2
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={spring.gentle}
        className="text-text-primary text-[40px] md:text-[56px] lg:text-[64px] font-bold"
        style={{ letterSpacing: "-1px", lineHeight: 1.05 }}
      >
        Start flowing today.
      </motion.h2>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ ...spring.gentle, delay: 0.1 }}
        className="mt-8"
      >
        <Link href={href}>
          <motion.span
            whileTap={tap}
            transition={spring.snappy}
            className="inline-flex items-center gap-2 h-14 px-8 rounded-full text-[17px] font-semibold cursor-pointer focus-ring shadow-lg hover:brightness-110 transition-[filter]"
            style={{
              background: "var(--today-pill-bg)",
              color: "var(--today-pill-ink)",
            }}
          >
            Get Started
            <ArrowRight className="w-4 h-4" />
          </motion.span>
        </Link>
      </motion.div>
      <div className="text-caption text-text-tertiary mt-4">
        Free forever. No credit card.
      </div>
    </section>
  );
}
