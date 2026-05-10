"use client";

import Link from "next/link";
import { color, radius, heroGradient } from "@/lib/ui/theme";
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
        background: heroGradient,
        color: color.text,
        padding: "48px 24px 64px",
      }}
    >
      <main style={{ maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
        <div style={{ fontSize: 12, letterSpacing: 4, opacity: 0.6 }}>FLOW</div>
        <h1
          style={{
            fontSize: "clamp(36px, 8vw, 56px)",
            fontWeight: 700,
            lineHeight: 1.05,
            margin: "16px 0 12px",
          }}
        >
          Learn system design by building it.
        </h1>
        <p
          style={{
            fontSize: 18,
            opacity: 0.75,
            maxWidth: 540,
            margin: "0 auto 28px",
          }}
        >
          A level-based game where each challenge teaches a real
          distributed-systems concept. Drag components onto the canvas, wire
          them up, and watch traffic flow.
        </p>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
            marginBottom: 32,
          }}
        >
          <Link
            href={cta.href}
            style={{
              display: "inline-block",
              padding: "14px 28px",
              borderRadius: radius.pill,
              background: color.accent,
              color: color.accentInk,
              fontWeight: 700,
              textDecoration: "none",
              fontSize: 16,
            }}
          >
            {cta.label} →
          </Link>
          {cta.subtitle && (
            <div style={{ fontSize: 12, opacity: 0.7 }}>{cta.subtitle}</div>
          )}
          <Link
            href="/levels"
            style={{
              fontSize: 13,
              color: color.link,
              textDecoration: "none",
              marginTop: 4,
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
          maxWidth: 720,
          margin: "48px auto 0",
          textAlign: "center",
          fontSize: 11,
          opacity: 0.5,
        }}
      >
        Flow — built with Next.js
      </footer>
    </div>
  );
}
