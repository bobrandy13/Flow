import type { ReactNode, CSSProperties } from "react";
import { color, heroGradient } from "@/lib/ui/theme";

/**
 * Top-level page wrapper for marketing surfaces (landing, levels menu).
 *
 * Sets dark-theme background + foreground and a sensible min-height. The
 * `tone` prop selects between the flat menu background and the radial
 * hero gradient used on the landing page.
 *
 * Canvas pages do NOT use this — they own their own viewport because the
 * React Flow canvas needs full control over its layout.
 */
export function PageShell({
  children,
  tone = "flat",
  style,
}: {
  children: ReactNode;
  tone?: "flat" | "hero";
  style?: CSSProperties;
}) {
  const background = tone === "hero" ? heroGradient : color.bg;
  return (
    <div
      style={{
        minHeight: "100vh",
        background,
        color: color.text,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
