import type { ReactNode, CSSProperties } from "react";
import { color, radius } from "@/lib/ui/theme";

/**
 * Small status pill. `tone` selects the visual treatment:
 *   - `neutral`  — outlined, used for "🔒 locked".
 *   - `highlight`— purple soft-fill, used for "NEW · 📖".
 *   - `success`  — green, used for completed indicators.
 *   - `info`     — blue, used for chapter completion counts.
 */
export function Badge({
  children,
  tone = "neutral",
  title,
  style,
}: {
  children: ReactNode;
  tone?: "neutral" | "highlight" | "success" | "info";
  title?: string;
  style?: CSSProperties;
}) {
  const palette: Record<NonNullable<Parameters<typeof Badge>[0]["tone"]>, CSSProperties> = {
    neutral: {
      color: color.textMuted,
      border: `1px solid ${color.borderStrong}`,
      background: "transparent",
    },
    highlight: {
      color: color.highlight,
      border: `1px solid ${color.highlightSoftBorder}`,
      background: color.highlightSoftBg,
    },
    success: {
      color: color.accentInk,
      border: `1px solid ${color.success}`,
      background: color.success,
    },
    info: {
      color: color.link,
      border: `1px solid ${color.link}`,
      background: "transparent",
    },
  };
  return (
    <span
      title={title}
      style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: 0.5,
        padding: "1px 7px",
        borderRadius: radius.pill,
        whiteSpace: "nowrap",
        ...palette[tone],
        ...style,
      }}
    >
      {children}
    </span>
  );
}
