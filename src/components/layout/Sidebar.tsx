"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Calendar,
  FileText,
  Timer,
  Settings as Cog,
  ChevronsLeft,
  ChevronsRight,
  Command,
} from "lucide-react";
import { useUI } from "@/stores/ui";
import { spring, tap } from "@/lib/motion";
import { cn } from "@/lib/cn";
import { UserMenu } from "@/components/shared/UserMenu";
import { SyncIndicator } from "@/components/shared/SyncIndicator";

const items = [
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/notes", label: "Notes", icon: FileText },
  { href: "/focus", label: "Focus", icon: Timer },
];

export function Sidebar() {
  const pathname = usePathname();
  const collapsed = useUI((s) => s.sidebarCollapsed);
  const setCollapsed = useUI((s) => s.setSidebarCollapsed);
  const setSettingsOpen = useUI((s) => s.setSettingsOpen);
  const setCommand = useUI((s) => s.setCommandPaletteOpen);

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      transition={spring.gentle}
      className={cn(
        "fixed left-0 top-0 h-screen border-r border-separator/70 z-30 flex flex-col",
        collapsed ? "px-3 py-6" : "px-5 py-6"
      )}
      style={{ background: "var(--bg-sidebar-soft)" }}
    >
      {/* Logo / wordmark */}
      <div className={cn("flex items-center mb-8", collapsed && "justify-center")}>
        <Link
          href="/calendar"
          className="flex items-center gap-2.5 focus-ring rounded-btn -mx-1 px-1"
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, var(--accent) 0%, #BF5AF2 100%)",
            }}
            aria-hidden
          >
            <span className="text-white font-bold text-[15px] leading-none">F</span>
          </div>
          {!collapsed && (
            <span className="text-title" style={{ letterSpacing: "-0.3px" }}>
              Flow
            </span>
          )}
        </Link>
      </div>

      {/* Nav */}
      <nav className={cn("flex-1", collapsed ? "space-y-1" : "space-y-0.5")}>
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex items-center gap-3 rounded-xl text-body font-medium transition-colors focus-ring",
                collapsed ? "justify-center py-2.5" : "px-3 py-2.5",
                active
                  ? "text-accent"
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated/60"
              )}
            >
              {active && (
                <motion.div
                  layoutId="sidebar-active-pill"
                  className="absolute inset-0 rounded-xl"
                  style={{ background: "var(--event-5)" }}
                  transition={spring.gentle}
                />
              )}
              <Icon
                className="relative w-[18px] h-[18px] shrink-0"
                strokeWidth={active ? 2.25 : 2}
              />
              {!collapsed && <span className="relative">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer controls */}
      <div className="mt-4 flex flex-col gap-2">
        <UserMenu variant="sidebar" collapsed={collapsed} />
        <SyncIndicator variant="sidebar" collapsed={collapsed} />

        <div className="h-px bg-separator/70 my-1" />

        <motion.button
          whileTap={tap}
          transition={spring.snappy}
          onClick={() => setCommand(true)}
          className={cn(
            "w-full flex items-center gap-3 rounded-xl text-body text-text-secondary hover:text-text-primary hover:bg-bg-elevated/70 transition-colors focus-ring cursor-pointer",
            collapsed ? "justify-center py-2" : "px-3 py-2"
          )}
        >
          <Command className="w-[18px] h-[18px] shrink-0" strokeWidth={2} />
          {!collapsed && (
            <span className="flex-1 text-left flex items-center justify-between">
              Search
              <kbd className="text-micro text-text-tertiary font-medium">⌘K</kbd>
            </span>
          )}
        </motion.button>

        <motion.button
          whileTap={tap}
          transition={spring.snappy}
          onClick={() => setSettingsOpen(true)}
          className={cn(
            "w-full flex items-center gap-3 rounded-xl text-body text-text-secondary hover:text-text-primary hover:bg-bg-elevated/70 transition-colors focus-ring cursor-pointer",
            collapsed ? "justify-center py-2" : "px-3 py-2"
          )}
        >
          <Cog className="w-[18px] h-[18px] shrink-0" strokeWidth={2} />
          {!collapsed && <span>Settings</span>}
        </motion.button>

        <motion.button
          whileTap={tap}
          transition={spring.snappy}
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "w-full flex items-center gap-3 rounded-xl text-text-tertiary hover:text-text-primary hover:bg-bg-elevated/50 transition-colors focus-ring cursor-pointer",
            collapsed ? "justify-center py-2" : "px-3 py-2"
          )}
        >
          {collapsed ? (
            <ChevronsRight className="w-[18px] h-[18px]" />
          ) : (
            <>
              <ChevronsLeft className="w-[18px] h-[18px]" />
              <span className="text-caption">Collapse</span>
            </>
          )}
        </motion.button>
      </div>
    </motion.aside>
  );
}
