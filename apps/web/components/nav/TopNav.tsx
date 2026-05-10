"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LEVELS } from "@flow/shared/levels";
import { color, radius } from "@/lib/ui/theme";
import { useProgress } from "@/lib/hooks/useProgress";

/**
 * Persistent top navigation for marketing surfaces (landing page,
 * levels menu, lesson pages). Auto-hides on the play page where the
 * canvas owns the viewport.
 */
export function TopNav() {
  const pathname = usePathname();
  const progress = useProgress();

  if (pathname?.includes("/play")) return null;

  const total = LEVELS.length;
  const done = LEVELS.filter((l) => progress[l.id]?.completed).length;

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
        background: "rgba(11, 16, 32, 0.85)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        borderBottom: `1px solid ${color.border}`,
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
          gap: 8,
          color: color.text,
          textDecoration: "none",
          fontWeight: 700,
          letterSpacing: 4,
          fontSize: 12,
        }}
      >
        FLOW
      </Link>
      <NavLink href="/levels" active={pathname === "/levels"}>
        Levels
      </NavLink>
      <div style={{ flex: 1 }} />
      <Link
        href="/levels"
        title={`${done} of ${total} levels completed`}
        style={{
          color: color.textMuted,
          textDecoration: "none",
          fontSize: 12,
          padding: "4px 10px",
          borderRadius: radius.pill,
          border: `1px solid ${color.border}`,
        }}
      >
        <span style={{ color: color.success, fontWeight: 700 }}>{done}</span>
        <span style={{ opacity: 0.7 }}> / {total} ✓</span>
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
        fontWeight: active ? 600 : 500,
        padding: "4px 0",
        borderBottom: active ? `2px solid ${color.accent}` : "2px solid transparent",
      }}
    >
      {children}
    </Link>
  );
}
