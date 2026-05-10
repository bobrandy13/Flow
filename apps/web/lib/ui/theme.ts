/**
 * Flow design tokens.
 *
 * Single source of truth for colors, spacing, radii, and typography used
 * by the marketing surfaces (landing page, levels menu, top nav). Pulled
 * out of the previously-duplicated inline styles so a future visual
 * refresh can happen in one place.
 */

export const color = {
  bg: "#0b1020",
  bgRaisedSoft: "#111827",
  bgRaised: "#1f2937",
  border: "#1f2937",
  borderStrong: "#374151",

  text: "#e5e7eb",
  textMuted: "#9ca3af",
  textSubtle: "rgba(229, 231, 235, 0.6)",

  accent: "#34d399",
  accentInk: "#0b1020",
  link: "#60a5fa",
  highlight: "#a78bfa",
  highlightSoftBorder: "rgba(167, 139, 250, 0.4)",
  highlightSoftBg: "rgba(167, 139, 250, 0.08)",

  success: "#34d399",
  warning: "#f59e0b",
  danger: "#ef4444",

  focusRing: "#60a5fa",
} as const;

export const space = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  "2xl": 32,
  "3xl": 48,
} as const;

export const radius = {
  sm: 6,
  md: 8,
  lg: 12,
  pill: 999,
} as const;

export const fontSize = {
  xs: 11,
  sm: 12,
  base: 13,
  md: 14,
  lg: 16,
  xl: 18,
  "2xl": 28,
  hero: 56,
} as const;

export const heroGradient =
  "radial-gradient(circle at 20% 20%, #1f2937 0%, #0b1020 60%)";
