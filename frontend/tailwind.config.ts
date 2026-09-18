import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#0B2545",
        navySoft: "#13355E",
        teal: "#00A8B5",
        tealGlow: "#00D2E0",
        gold: "#E8A33D",
        sky: "#EAF4FA",
        riskRed: "#EF4444",
        riskAmber: "#F59E0B",
        safeGreen: "#10B981",
        textDark: "#1F2937",
        darkBg: "#060d19",
        darkSurface: "#091424",
        darkCard: "#0b1a2f",
        darkCardHover: "#0f233f",
        darkBorder: "#1b365d",
        darkBorderMuted: "#112644",
      },
    },
  },
  plugins: [],
} satisfies Config;

