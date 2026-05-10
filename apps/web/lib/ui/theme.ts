/**
 * Flow design tokens — Phase 3.2 "Factory Blueprint" palette.
 *
 * The visual concept is an engineering / blueprint drawing:
 *   - paper colour: deep blueprint navy
 *   - ink:          warm off-white
 *   - measurements: cyan
 *   - warnings:     amber
 *   - approved:     lime
 *   - rejected:     red
 *
 * Existing token keys (color.bg, color.text, ...) are preserved so the
 * components built in Phase 3.1 don't have to change shape. New
 * blueprint-specific keys (paper, ink, stamp*, gridMajor) are additive.
 */

export const color = {
  // Surfaces
  bg: "#0e1a2b",
  bgRaisedSoft: "#13243a",
  bgRaised: "#1a2f4a",
  border: "#22405f",
  borderStrong: "#3a5e85",

  // Type
  text: "#f5efd6",
  textMuted: "rgba(245, 239, 214, 0.65)",
  textSubtle: "rgba(245, 239, 214, 0.45)",

  // Accent (cyan — measurements, primary action, completion check)
  accent: "#7adfff",
  accentInk: "#0e1a2b",
  link: "#7adfff",

  // Highlight (amber — drawing-stamp / NEW callouts)
  highlight: "#ffb547",
  highlightSoftBorder: "rgba(255, 181, 71, 0.45)",
  highlightSoftBg: "rgba(255, 181, 71, 0.10)",

  // Status
  success: "#9be36b",
  warning: "#ffb547",
  danger: "#ff5c5c",

  focusRing: "#7adfff",

  // Blueprint extras (additive)
  paper: "#0e1a2b",
  ink: "#f5efd6",
  gridMajor: "rgba(122, 223, 255, 0.08)",
  gridMinor: "rgba(122, 223, 255, 0.035)",
  stampApproved: "#9be36b",
  stampRejected: "#ff5c5c",
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

/**
 * Blueprint paper background — flat navy with a faint cyan grid (8px minor /
 * 24px major). Pure CSS gradient, no image. Apply to a full-viewport surface.
 */
export const heroGradient = `
  linear-gradient(${color.gridMajor} 1px, transparent 1px) 0 0 / 24px 24px,
  linear-gradient(90deg, ${color.gridMajor} 1px, transparent 1px) 0 0 / 24px 24px,
  linear-gradient(${color.gridMinor} 1px, transparent 1px) 0 0 / 8px 8px,
  linear-gradient(90deg, ${color.gridMinor} 1px, transparent 1px) 0 0 / 8px 8px,
  radial-gradient(circle at 30% 20%, #1a2f4a 0%, ${color.paper} 70%)
`;

/**
 * Display + monospace font CSS variables — defined by next/font in the root
 * layout. Use these in `style.fontFamily` for headings (display) and metric
 * callouts (mono).
 */
export const fontFamily = {
  display: "var(--font-display), 'Oswald', 'Impact', sans-serif",
  mono: "var(--font-mono), 'JetBrains Mono', ui-monospace, monospace",
  body: "var(--font-geist-sans), system-ui, -apple-system, sans-serif",
} as const;
