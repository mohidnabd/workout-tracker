/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      boxShadow: {
        edge: "0 18px 60px rgba(2, 6, 23, 0.28)",
        lift: "0 14px 34px rgba(15, 23, 42, 0.18)",
      },
      animation: {
        "fade-up": "fadeUp 560ms ease both",
        "soft-pulse": "softPulse 2.8s ease-in-out infinite",
        "line-scan": "lineScan 6s linear infinite",
        "slide-panel": "slidePanel 280ms ease both",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        softPulse: {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.04)", opacity: "0.78" },
        },
        lineScan: {
          "0%": { transform: "translateX(-30%)" },
          "100%": { transform: "translateX(130%)" },
        },
        slidePanel: {
          "0%": { opacity: "0", transform: "translateX(12px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
    },
  },
  plugins: [],
};
