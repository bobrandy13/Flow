import type { ReactNode, CSSProperties } from "react";
import { color, radius } from "@/lib/ui/theme";

/**
 * Rounded outlined panel — the level-row card and other content tiles.
 *
 * `as` lets the same visual primitive render as a `<div>` (default), an
 * `<a>` (used by clickable level rows), or a `<section>`. We don't ship
 * a polymorphic generic here on purpose — only three forms are used in
 * Phase 3.1, and a generic adds noise without much win.
 */
export function Card({
  children,
  style,
  as = "div",
  ...rest
}: {
  children: ReactNode;
  style?: CSSProperties;
  as?: "div" | "a" | "section";
} & React.HTMLAttributes<HTMLElement> &
  Partial<Pick<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">>) {
  const baseStyle: CSSProperties = {
    background: color.bgRaisedSoft,
    border: `1px solid ${color.border}`,
    borderRadius: radius.lg,
    color: color.text,
    textDecoration: "none",
    ...style,
  };
  if (as === "a") {
    return (
      <a {...rest} style={baseStyle}>
        {children}
      </a>
    );
  }
  if (as === "section") {
    return (
      <section {...rest} style={baseStyle}>
        {children}
      </section>
    );
  }
  return (
    <div {...rest} style={baseStyle}>
      {children}
    </div>
  );
}
