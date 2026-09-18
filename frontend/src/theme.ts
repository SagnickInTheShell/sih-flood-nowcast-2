export const theme = {
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
  textPrimary: "#F1F5F9",
  textMuted: "#94A3B8",
} as const;

export const stateColor: Record<string, [number, number, number]> = {
  clear: [16, 185, 129], // #10B981 vibrant emerald
  at_risk: [245, 158, 11], // #F59E0B vibrant amber
  flooded: [239, 68, 68], // #EF4444 vibrant red
};

export const stateLabel: Record<string, string> = {
  clear: "Clear",
  at_risk: "At risk",
  flooded: "Flooded",
};

