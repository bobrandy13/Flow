import type { ReactNode, CSSProperties } from "react";

/**
 * Centered max-width container. Default max-width matches the levels
 * menu (880); landing uses 720 via the `size` prop.
 */
export function Container({
  children,
  size = "wide",
  style,
}: {
  children: ReactNode;
  size?: "narrow" | "wide";
  style?: CSSProperties;
}) {
  const maxWidth = size === "narrow" ? 720 : 880;
  return (
    <div style={{ maxWidth, margin: "0 auto", ...style }}>{children}</div>
  );
}
