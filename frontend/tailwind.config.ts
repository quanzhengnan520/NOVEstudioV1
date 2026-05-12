import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        nove: {
          ink: "#050608",
          void: "#080a0f",
          graphite: "#12161f",
          mist: "#94a3b8",
          accent: "#5eead4",
          violet: "#8b5cf6",
          blue: "#3b82f6",
          surface: "#0f1419",
          line: "rgba(148, 163, 184, 0.12)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        glow: "0 0 40px -8px rgba(94, 234, 212, 0.35)",
        "glow-violet": "0 0 48px -10px rgba(139, 92, 246, 0.4)",
        "glow-soft": "0 0 60px -20px rgba(94, 234, 212, 0.25), 0 0 80px -30px rgba(139, 92, 246, 0.2)",
        "inner-glow": "inset 0 1px 0 0 rgba(255,255,255,0.06)",
      },
      maxWidth: {
        workspace: "1500px",
        landing: "1440px",
        promptStage: "980px",
      },
      keyframes: {
        "aurora-shift": {
          "0%, 100%": { transform: "translate(0%, 0%) scale(1)", opacity: "0.5" },
          "33%": { transform: "translate(4%, -3%) scale(1.05)", opacity: "0.65" },
          "66%": { transform: "translate(-3%, 2%) scale(0.98)", opacity: "0.45" },
        },
        "gradient-flow": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
        shimmer: {
          "0%": { transform: "translateX(-120%)" },
          "100%": { transform: "translateX(120%)" },
        },
        "slow-shimmer": {
          "0%": { transform: "translateX(-130%)", opacity: "0" },
          "40%": { opacity: "0.35" },
          "100%": { transform: "translateX(130%)", opacity: "0" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.55", boxShadow: "0 0 28px -6px rgba(94, 234, 212, 0.35)" },
          "50%": { opacity: "1", boxShadow: "0 0 48px -4px rgba(94, 234, 212, 0.55)" },
        },
        "pulse-glow-slow": {
          "0%, 100%": { opacity: "0.45", boxShadow: "0 0 20px -8px rgba(94, 234, 212, 0.25)" },
          "50%": { opacity: "0.85", boxShadow: "0 0 36px -6px rgba(94, 234, 212, 0.4)" },
        },
        "orb-drift": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "50%": { transform: "translate(12px, -10px) scale(1.04)" },
        },
        "hero-drift": {
          "0%, 100%": { transform: "translate(0, 0)" },
          "50%": { transform: "translate(3px, -4px)" },
        },
        "hero-scan": {
          "0%": { transform: "translateY(-120%)" },
          "100%": { transform: "translateY(120%)" },
        },
        "nove-breathe": {
          "0%, 100%": { transform: "scale(1)", filter: "brightness(1)" },
          "50%": { transform: "scale(1.02)", filter: "brightness(1.05)" },
        },
        "glow-rotate": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "dot-pulse": {
          "0%, 100%": { opacity: "0.25", transform: "scale(0.9)" },
          "50%": { opacity: "1", transform: "scale(1)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-slide-slow": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "aurora-shift": "aurora-shift 18s ease-in-out infinite",
        "gradient-flow": "gradient-flow 10s ease infinite",
        float: "float 5s ease-in-out infinite",
        shimmer: "shimmer 1.8s ease-in-out infinite",
        "slow-shimmer": "slow-shimmer 9s ease-in-out infinite",
        "pulse-glow": "pulse-glow 2.2s ease-in-out infinite",
        "pulse-glow-slow": "pulse-glow-slow 4.5s ease-in-out infinite",
        "orb-drift": "orb-drift 14s ease-in-out infinite",
        "hero-drift": "hero-drift 12s ease-in-out infinite",
        "hero-scan": "hero-scan 14s linear infinite",
        "nove-breathe": "nove-breathe 2.8s ease-in-out infinite",
        "glow-rotate": "glow-rotate 28s linear infinite",
        "dot-pulse": "dot-pulse 2.4s ease-in-out infinite",
        "fade-up": "fade-up 1.1s ease-out 0.15s both",
        "fade-slide-slow": "fade-slide-slow 1.1s ease-out 0.12s both",
        "fade-slide-delay": "fade-slide-slow 1s ease-out 0.42s both",
      },
      backgroundSize: {
        "300p": "300% 300%",
      },
    },
  },
  plugins: [],
};

export default config;
