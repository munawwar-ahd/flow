"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Calendar, FileText, Timer } from "lucide-react";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/cn";

const items = [
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/notes", label: "Notes", icon: FileText },
  { href: "/focus", label: "Focus", icon: Timer },
];

export function MobileTabBar() {
  const pathname = usePathname();
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 glass border-t border-separator z-40 pb-safe"
      style={{ paddingTop: 6 }}
    >
      <div className="flex items-center justify-around h-[60px]">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 flex flex-col items-center justify-center gap-1 relative"
              aria-label={item.label}
            >
              <motion.div
                animate={{ scale: active ? 1.02 : 1 }}
                transition={spring.snappy}
                className="flex flex-col items-center gap-0.5"
              >
                <Icon
                  className={cn("w-6 h-6", active ? "text-accent" : "text-text-tertiary")}
                  strokeWidth={active ? 2.25 : 2}
                />
                <span
                  className={cn(
                    "text-[10px] tracking-wide",
                    active ? "text-accent font-medium" : "text-text-tertiary"
                  )}
                >
                  {item.label}
                </span>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
