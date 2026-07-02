/**
 * PEDSAFE — Design tokens
 * Premium bodybuilding + healthcare aesthetic (dark theme)
 */

export const theme = {
  colors: {
    background: "#0B0E14",
    surface: "#12161F",
    surfaceElevated: "#1A1F2E",
    surfaceHover: "#222838",
    border: "#2A3142",
    borderSubtle: "#1E2433",
    primary: "#14B8A6",
    primaryHover: "#0D9488",
    primaryMuted: "rgba(20, 184, 166, 0.15)",
    secondary: "#D4A853",
    secondaryHover: "#B8923F",
    secondaryMuted: "rgba(212, 168, 83, 0.15)",
    accent: "#EF4444",
    accentMuted: "rgba(239, 68, 68, 0.15)",
    success: "#22C55E",
    warning: "#F59E0B",
    info: "#3B82F6",
    textPrimary: "#F1F5F9",
    textSecondary: "#94A3B8",
    textMuted: "#64748B",
  },
  gradients: {
    hero: "linear-gradient(135deg, #0B0E14 0%, #12161F 50%, #0F1A1A 100%)",
    primary: "linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)",
    gold: "linear-gradient(135deg, #D4A853 0%, #B8923F 100%)",
    card: "linear-gradient(180deg, rgba(26, 31, 46, 0.8) 0%, rgba(18, 22, 31, 0.9) 100%)",
    glow: "radial-gradient(ellipse at center, rgba(20, 184, 166, 0.15) 0%, transparent 70%)",
  },
  radius: {
    sm: "0.375rem",
    md: "0.5rem",
    lg: "0.75rem",
    xl: "1rem",
    "2xl": "1.25rem",
    full: "9999px",
  },
  shadows: {
    sm: "0 1px 2px rgba(0, 0, 0, 0.4)",
    md: "0 4px 12px rgba(0, 0, 0, 0.5)",
    lg: "0 8px 24px rgba(0, 0, 0, 0.6)",
    glow: "0 0 40px rgba(20, 184, 166, 0.2)",
    glowGold: "0 0 40px rgba(212, 168, 83, 0.15)",
  },
} as const;

export type Theme = typeof theme;
