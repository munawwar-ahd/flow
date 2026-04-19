"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, LogOut } from "lucide-react";
import { useAuthStore } from "@/stores/auth";
import { cn } from "@/lib/cn";
import { spring, tap } from "@/lib/motion";

type Props = {
  variant: "sidebar" | "compact";
  collapsed?: boolean;
  className?: string;
};

function firstName(full: string | null): string {
  if (!full) return "Account";
  return full.trim().split(/\s+/)[0] ?? "Account";
}

function Avatar({ url, name, size = 32 }: { url: string | null; name: string | null; size?: number }) {
  const [errored, setErrored] = useState(false);
  const initials = (name ?? "U")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");
  const common = "rounded-full bg-accent-soft text-accent flex items-center justify-center font-medium shrink-0 overflow-hidden";
  if (url && !errored) {
    return (
      <img
        src={url}
        alt=""
        width={size}
        height={size}
        referrerPolicy="no-referrer"
        onError={() => setErrored(true)}
        className={cn(common, "object-cover")}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div className={common} style={{ width: size, height: size, fontSize: size * 0.4 }}>
      {initials || "U"}
    </div>
  );
}

export function UserMenu({ variant, collapsed, className }: Props) {
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
    router.push("/login");
  };

  if (!user) return null;

  const name = firstName(user.fullName);

  return (
    <div ref={ref} className={cn("relative", className)}>
      {variant === "sidebar" ? (
        <motion.button
          onClick={() => setOpen((v) => !v)}
          whileTap={tap}
          transition={spring.snappy}
          aria-label="Open account menu"
          aria-expanded={open}
          className={cn(
            "w-full flex items-center gap-2.5 rounded-btn text-left transition-colors focus-ring",
            collapsed ? "justify-center px-0 py-1.5" : "px-2 py-1.5 hover:bg-bg-elevated"
          )}
        >
          <Avatar url={user.avatarUrl} name={user.fullName} size={32} />
          {!collapsed && (
            <>
              <span className="flex-1 text-body truncate">{name}</span>
              <ChevronRight
                className={cn(
                  "w-4 h-4 text-text-tertiary transition-transform",
                  open && "rotate-90"
                )}
              />
            </>
          )}
        </motion.button>
      ) : (
        <motion.button
          onClick={() => setOpen((v) => !v)}
          whileTap={tap}
          transition={spring.snappy}
          aria-label="Open account menu"
          aria-expanded={open}
          className="w-9 h-9 rounded-full focus-ring flex items-center justify-center"
        >
          <Avatar url={user.avatarUrl} name={user.fullName} size={32} />
        </motion.button>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: variant === "sidebar" ? 4 : 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: variant === "sidebar" ? 4 : 6, scale: 0.98 }}
            transition={spring.gentle}
            className={cn(
              "absolute z-50 glass rounded-card shadow-card border border-separator overflow-hidden",
              variant === "sidebar"
                ? "left-0 right-0 bottom-full mb-2 min-w-[200px]"
                : "right-0 top-full mt-2 w-64"
            )}
          >
            <div className="px-3 pt-3 pb-2 border-b border-separator">
              <div className="text-body truncate">{user.fullName ?? name}</div>
              {user.email && (
                <div className="text-caption text-text-tertiary truncate mt-0.5">
                  {user.email}
                </div>
              )}
            </div>
            <button
              role="menuitem"
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-body hover:bg-bg-secondary transition-colors text-left"
            >
              <LogOut className="w-4 h-4 text-text-secondary" />
              <span>Sign out</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
