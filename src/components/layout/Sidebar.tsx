"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Calendar, FileText, Home, Timer, Settings as Cog, ChevronsLeft, ChevronsRight, Command } from "lucide-react";
import { useUI } from "@/stores/ui";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/cn";
import { UserMenu } from "@/components/shared/UserMenu";

const items = [
  { href: "/", label: "Today", icon: Home },
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
      animate={{ width: collapsed ? 64 : 220 }}
      transition={spring.gentle}
      className="fixed left-0 top-0 h-screen bg-bg-secondary border-r border-separator z-30 flex flex-col"
    >
      <div className={cn("flex items-center h-16 px-4", collapsed && "justify-center px-0")}>
        <Link href="/" className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg,#0A84FF 0%,#BF5AF2 100%)",
            }}
          >
            <span className="text-white font-bold text-[15px] leading-none">F</span>
          </div>
          {!collapsed && <span className="text-headline tracking-tight">Flow</span>}
        </Link>
      </div>

      <nav className="flex-1 px-2 space-y-0.5">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex items-center gap-3 px-3 py-2 rounded-btn text-body transition-colors",
                active ? "text-text-primary" : "text-text-secondary hover:text-text-primary",
                collapsed && "justify-center px-0"
              )}
            >
              {active && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-btn bg-bg-elevated shadow-sm"
                  transition={spring.gentle}
                />
              )}
              <Icon className="relative w-[18px] h-[18px] shrink-0" strokeWidth={2} />
              {!collapsed && <span className="relative">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-2 space-y-0.5">
        <div className={cn("mb-1", collapsed ? "px-0" : "px-0")}>
          <UserMenu variant="sidebar" collapsed={collapsed} />
        </div>
        <div className="h-px bg-separator mx-2 mb-1" />
        <button
          onClick={() => setCommand(true)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-btn text-body text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors",
            collapsed && "justify-center px-0"
          )}
        >
          <Command className="w-[18px] h-[18px] shrink-0" />
          {!collapsed && (
            <span className="flex-1 text-left flex items-center justify-between">
              Search
              <kbd className="text-micro text-text-tertiary">⌘K</kbd>
            </span>
          )}
        </button>
        <button
          onClick={() => setSettingsOpen(true)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-btn text-body text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors",
            collapsed && "justify-center px-0"
          )}
        >
          <Cog className="w-[18px] h-[18px] shrink-0" />
          {!collapsed && <span>Settings</span>}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-btn text-text-tertiary hover:text-text-primary transition-colors",
            collapsed && "justify-center px-0"
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
        </button>
      </div>
    </motion.aside>
  );
}
