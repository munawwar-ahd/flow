"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { spring } from "@/lib/motion";

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" className="shrink-0">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.336z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
      />
    </svg>
  );
}

export default function LoginPage() {
  const [pending, setPending] = useState(false);

  const signInWithGoogle = async () => {
    if (pending) return;
    setPending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setPending(false);
  };

  const stagger = (i: number) => ({
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { ...spring.gentle, delay: 0.05 * i },
  });

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-bg-primary px-4 pt-safe pb-safe overflow-hidden">
      {/* Ambient pastel blur in one corner — pulled way back so it's decor, not a feature */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -left-24 w-[380px] h-[380px] rounded-full blur-3xl opacity-60"
        style={{ background: "var(--event-5)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -right-24 w-[420px] h-[420px] rounded-full blur-3xl opacity-50"
        style={{ background: "var(--event-1)" }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={spring.gentle}
        className="relative w-full max-w-[400px] rounded-3xl p-10 border border-separator/70 shadow-2xl backdrop-blur-3xl backdrop-saturate-150"
        style={{ background: "var(--glass-bg)" }}
      >
        <motion.h1
          {...stagger(1)}
          className="text-display text-center"
          style={{ letterSpacing: "-0.5px" }}
        >
          Flow
        </motion.h1>

        <motion.p
          {...stagger(2)}
          className="text-body text-text-secondary text-center mt-2"
        >
          Your day, beautifully organized.
        </motion.p>

        <motion.div {...stagger(3)} className="mt-6">
          <motion.button
            onClick={signInWithGoogle}
            whileTap={{ scale: 0.97 }}
            transition={spring.snappy}
            aria-label="Continue with Google"
            disabled={pending}
            className="w-full h-[52px] rounded-xl border border-separator bg-white text-text-primary dark:bg-bg-elevated flex items-center justify-center gap-3 font-medium focus-ring transition-colors hover:bg-bg-secondary dark:hover:bg-[#3A3A3C] disabled:opacity-60"
          >
            <GoogleMark />
            <span>{pending ? "Redirecting…" : "Continue with Google"}</span>
          </motion.button>
        </motion.div>

        <motion.p
          {...stagger(4)}
          className="text-caption text-text-tertiary text-center mt-4"
        >
          By continuing, you agree to use Flow responsibly.
        </motion.p>
      </motion.div>
    </div>
  );
}
