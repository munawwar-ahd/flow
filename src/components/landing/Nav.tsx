"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, LogOut, Settings as Cog } from "lucide-react";
import { useAuthStore } from "@/stores/auth";
import { spring, tap } from "@/lib/motion";
import { cn } from "@/lib/cn";

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const router = useRouter();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = () => setMenuOpen(false);
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, [menuOpen]);

  const scrollToFeatures = (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById("features")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const calendarHref = user ? "/calendar" : "/login";
  const ctaHref = user ? "/calendar" : "/login";

  return (
    <motion.nav
      animate={{
        backgroundColor: scrolled ? "var(--glass-bg)" : "rgba(255,255,255,0)",
        borderBottomColor: scrolled ? "var(--separator)" : "rgba(0,0,0,0)",
      }}
      transition={spring.smooth}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 h-[72px] px-5 md:px-8 flex items-center justify-between border-b",
        scrolled && "backdrop-blur-xl backdrop-saturate-150"
      )}
      style={{ borderBottomStyle: "solid" }}
    >
      <Link
        href="/"
        className="text-text-primary font-bold text-[20px] focus-ring rounded-md px-1"
        style={{ letterSpacing: "-0.5px", fontWeight: 700 }}
        aria-label="Flow home"
      >
        Flow
      </Link>

      <div className="flex items-center gap-3 md:gap-6">
        <a
          href="#features"
          onClick={scrollToFeatures}
          className="hidden md:inline-block text-[14px] font-medium text-text-secondary hover:text-text-primary transition-colors"
        >
          Features
        </a>
        <Link
          href={calendarHref}
          className="hidden md:inline-block text-[14px] font-medium text-text-secondary hover:text-text-primary transition-colors"
        >
          Calendar
        </Link>
        <span className="hidden md:inline-block h-4 w-px bg-separator" aria-hidden />

        {user ? (
          <div className="relative">
            <motion.button
              whileTap={tap}
              transition={spring.snappy}
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((v) => !v);
              }}
              aria-label="Account menu"
              aria-expanded={menuOpen}
              className="w-9 h-9 rounded-full overflow-hidden focus-ring cursor-pointer"
            >
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center font-medium"
                  style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
                >
                  {(user.fullName ?? "U").slice(0, 1)}
                </div>
              )}
            </motion.button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                  transition={spring.gentle}
                  className="absolute right-0 top-full mt-2 w-56 glass rounded-2xl shadow-card border border-separator/60 overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-3 pt-3 pb-2 border-b border-separator">
                    <div className="text-body truncate">{user.fullName ?? "Account"}</div>
                    {user.email && (
                      <div className="text-caption text-text-tertiary truncate mt-0.5">
                        {user.email}
                      </div>
                    )}
                  </div>
                  <Link
                    href="/calendar"
                    onClick={() => setMenuOpen(false)}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-body hover:bg-bg-secondary transition-colors"
                  >
                    <Calendar className="w-4 h-4 text-text-secondary" />
                    My Calendar
                  </Link>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      router.push("/calendar");
                      // open settings via query... we keep it simple: navigate
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-body hover:bg-bg-secondary transition-colors text-left"
                  >
                    <Cog className="w-4 h-4 text-text-secondary" />
                    Settings
                  </button>
                  <button
                    onClick={async () => {
                      setMenuOpen(false);
                      await signOut();
                      router.push("/");
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-body hover:bg-bg-secondary transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4 text-text-secondary" />
                    Sign out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <>
            <Link
              href="/login"
              className="text-[14px] font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              Sign in
            </Link>
            <Link href={ctaHref}>
              <motion.span
                whileTap={tap}
                transition={spring.snappy}
                className="inline-flex items-center h-9 px-4 rounded-full font-semibold text-[14px] cursor-pointer focus-ring transition-[filter] hover:brightness-110"
                style={{
                  background: "var(--today-pill-bg)",
                  color: "var(--today-pill-ink)",
                }}
              >
                Get Started
              </motion.span>
            </Link>
          </>
        )}
      </div>
    </motion.nav>
  );
}
