import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "var(--bg-primary)",
          secondary: "var(--bg-secondary)",
          elevated: "var(--bg-elevated)",
        },
        separator: "var(--separator)",
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          tertiary: "var(--text-tertiary)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          soft: "var(--accent-soft)",
        },
        success: "var(--success)",
        warning: "var(--warning)",
        danger: "var(--danger)",
        event: {
          1: "var(--event-1)",
          2: "var(--event-2)",
          3: "var(--event-3)",
          4: "var(--event-4)",
          5: "var(--event-5)",
          6: "var(--event-6)",
          7: "var(--event-7)",
          8: "var(--event-8)",
          ink: "var(--event-ink)",
        },
        "sidebar-soft": "var(--bg-sidebar-soft)",
        "today-pill": {
          bg: "var(--today-pill-bg)",
          ink: "var(--today-pill-ink)",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Text",
          "Segoe UI",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        mono: ["SF Mono", "ui-monospace", "Menlo", "monospace"],
      },
      fontSize: {
        display: ["34px", { lineHeight: "40px", letterSpacing: "-0.5px", fontWeight: "700" }],
        title: ["22px", { lineHeight: "28px", letterSpacing: "-0.3px", fontWeight: "600" }],
        headline: ["17px", { lineHeight: "22px", letterSpacing: "-0.2px", fontWeight: "600" }],
        body: ["15px", { lineHeight: "20px", letterSpacing: "0", fontWeight: "400" }],
        caption: ["13px", { lineHeight: "18px", letterSpacing: "0", fontWeight: "400" }],
        micro: ["11px", { lineHeight: "14px", letterSpacing: "0.1px", fontWeight: "500" }],
      },
      borderRadius: {
        chip: "8px",
        btn: "12px",
        card: "16px",
        modal: "24px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)",
        "card-dark": "0 0 0 1px rgba(255,255,255,0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
