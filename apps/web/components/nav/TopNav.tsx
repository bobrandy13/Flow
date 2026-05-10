"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LEVELS } from "@flow/shared/levels";
import { color, fontFamily } from "@/lib/ui/theme";
import { useProgress } from "@/lib/hooks/useProgress";

/**
 * Top navigation styled as a blueprint title block.
 *
 * Layout: [ wordmark · REV chip ]   [ Levels link ]   [ ASCII progress ]
 *
 * - Wordmark uses the industrial display font, all-caps, heavily tracked.
 * - Revision chip mimics a drawing's "REV A" stamp.
 * - Progress widget is a fixed-width 8-slot ASCII bar so completion reads
 *   like a meter on an instrument panel.
 *
 * Auto-hides on /play (the canvas owns the viewport there).
 */
export function TopNav() {
  const pathname = usePathname();
  const progress = useProgress();

  if (pathname?.includes("/play")) return null;

  const total = LEVELS.length;
  const done = LEVELS.filter((l) => progress[l.id]?.completed).length;

  // Render an 8-slot ASCII progress bar so it visually echoes a meter.
  const SLOTS = 8;
  const filled = total === 0 ? 0 : Math.round((done / total) * SLOTS);
  const bar = "█".repeat(filled) + "░".repeat(SLOTS - filled);

  return (
    <nav
      aria-label="Primary"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        gap: 24,
        padding: "10px 24px",
        background: "rgba(14, 26, 43, 0.85)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        borderTop: `1px solid ${color.borderStrong}`,
        borderBottom: `1px solid ${color.borderStrong}`,
        // Double-rule below for a "drafting title block" effect.
        boxShadow: `inset 0 -3px 0 ${color.paper}, inset 0 -4px 0 ${color.borderStrong}`,
        color: color.text,
        fontSize: 13,
      }}
    >
      <Link
        href="/"
        aria-label="Flow home"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          color: color.text,
          textDecoration: "none",
          fontFamily: fontFamily.display,
          fontWeight: 700,
          letterSpacing: 6,
          fontSize: 16,
          textTransform: "uppercase",
        }}
      >
        FLOW
        <span
          style={{
            fontFamily: fontFamily.mono,
            fontSize: 9,
            letterSpacing: 1,
            padding: "2px 6px",
            color: color.accent,
            border: `1px solid ${color.borderStrong}`,
            borderRadius: 2,
            opacity: 0.85,
          }}
          aria-hidden="true"
        >
          REV A
        </span>
      </Link>
      <NavLink href="/levels" active={pathname === "/levels"}>
        Drawings
      </NavLink>
      <div style={{ flex: 1 }} />
      <Link
        href="/levels"
        title={`${done} of ${total} levels completed`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          color: color.textMuted,
          textDecoration: "none",
          fontFamily: fontFamily.mono,
          fontSize: 11,
          padding: "4px 10px",
          border: `1px solid ${color.borderStrong}`,
          borderRadius: 2,
          background: "rgba(122, 223, 255, 0.04)",
        }}
      >
        <span style={{ color: color.accent, letterSpacing: 1 }}>{bar}</span>
        <span style={{ color: color.text, fontWeight: 700 }}>
          {done.toString().padStart(2, "0")}
        </span>
        <span style={{ opacity: 0.65 }}>/{total.toString().padStart(2, "0")}</span>
      </Link>
    </nav>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      style={{
        color: active ? color.text : color.textMuted,
        textDecoration: "none",
        fontFamily: fontFamily.display,
        fontWeight: active ? 700 : 500,
        letterSpacing: 3,
        fontSize: 12,
        textTransform: "uppercase",
        padding: "4px 0",
        borderBottom: active ? `2px solid ${color.accent}` : "2px solid transparent",
      }}
    >
      {children}
    </Link>
  );
}
