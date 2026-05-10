"use client";

import Link from "next/link";
import { color, fontFamily } from "@/lib/ui/theme";
import { useProgress } from "@/lib/hooks/useProgress";
import { pickPrimaryCta } from "@/lib/ui/pickPrimaryCta";
import { HeroPreview } from "@/components/landing/HeroPreview";
import { ConceptStrip } from "@/components/landing/ConceptStrip";

export default function Home() {
  const progress = useProgress();
  const cta = pickPrimaryCta(progress);

  return (
    <div
      style={{
        minHeight: "calc(100vh - 49px)",
        color: color.text,
        padding: "48px 24px 64px",
      }}
    >
      <main style={{ maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
        {/* Drawing-stamp eyebrow */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            fontFamily: fontFamily.mono,
            fontSize: 10,
            letterSpacing: 2,
            color: color.accent,
            border: `1px solid ${color.borderStrong}`,
            padding: "4px 12px",
            background: "rgba(122, 223, 255, 0.06)",
          }}
        >
          <span>DRAWING NO. 001</span>
          <span style={{ opacity: 0.5 }}>·</span>
          <span>REV A</span>
          <span style={{ opacity: 0.5 }}>·</span>
          <span>SYSTEM DESIGN CURRICULUM</span>
        </div>

        <h1
          style={{
            fontFamily: fontFamily.display,
            fontSize: "clamp(40px, 9vw, 72px)",
            fontWeight: 700,
            lineHeight: 1.0,
            letterSpacing: 2,
            textTransform: "uppercase",
            margin: "20px 0 16px",
            color: color.text,
          }}
        >
          Learn system design<br />by building it.
        </h1>
        <p
          style={{
            fontSize: 17,
            color: color.textMuted,
            maxWidth: 540,
            margin: "0 auto 32px",
            lineHeight: 1.55,
          }}
        >
          A level-based game where each challenge teaches a real
          distributed-systems concept. Drag components onto the sheet, wire
          them up, and watch traffic flow.
        </p>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
            marginBottom: 40,
          }}
        >
          <Link
            href={cta.href}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "14px 28px",
              background: color.accent,
              color: color.accentInk,
              fontFamily: fontFamily.display,
              fontWeight: 700,
              letterSpacing: 2,
              textTransform: "uppercase",
              textDecoration: "none",
              fontSize: 14,
              border: `1px solid ${color.accent}`,
              boxShadow: `4px 4px 0 0 ${color.borderStrong}`,
            }}
          >
            <span aria-hidden="true" style={{ fontFamily: fontFamily.mono }}>▸</span>
            {cta.label}
          </Link>
          {cta.subtitle && (
            <div
              style={{
                fontFamily: fontFamily.mono,
                fontSize: 11,
                color: color.textMuted,
                letterSpacing: 1,
              }}
            >
              · {cta.subtitle} ·
            </div>
          )}
          <Link
            href="/levels"
            style={{
              fontSize: 12,
              color: color.link,
              textDecoration: "underline",
              textUnderlineOffset: 4,
              marginTop: 6,
              fontFamily: fontFamily.mono,
              letterSpacing: 1,
            }}
          >
            Browse all levels
          </Link>
        </div>

        <HeroPreview />
        <ConceptStrip />
      </main>

      <footer
        style={{
          maxWidth: 760,
          margin: "56px auto 0",
          textAlign: "center",
          fontFamily: fontFamily.mono,
          fontSize: 10,
          color: color.textSubtle,
          letterSpacing: 2,
          textTransform: "uppercase",
        }}
      >
        PROJECT: FLOW · ENGINEER: YOU · DRAWN WITH NEXT.JS
      </footer>
    </div>
  );
}
