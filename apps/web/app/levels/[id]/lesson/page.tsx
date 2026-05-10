"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { getLevel } from "@flow/shared/levels";
import type { LessonBlock } from "@flow/shared/types/level";
import { markLessonSeen } from "@/lib/storage/progress";
import { color, fontFamily } from "@/lib/ui/theme";

export default function LessonPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const level = getLevel(params.id);

  useEffect(() => {
    if (level) markLessonSeen(level.id);
  }, [level]);

  if (!level) {
    return (
      <div style={pageStyle}>
        <p>Level not found.</p>
        <button onClick={() => router.push("/levels")} style={btnSecondary}>
          Back to levels
        </button>
      </div>
    );
  }

  if (!level.lesson) {
    if (typeof window !== "undefined") {
      router.replace(`/levels/${level.id}/play`);
    }
    return null;
  }

  const lesson = level.lesson;

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <div style={{ marginBottom: 20 }}>
          <Link href="/levels" style={breadcrumbLink}>
            ← BACK TO DRAWING SET
          </Link>
        </div>

        {/* Drafting title block */}
        <header
          style={{
            marginBottom: 28,
            border: `1px solid ${color.borderStrong}`,
            background: "rgba(14, 26, 43, 0.7)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "8px 14px",
              borderBottom: `1px dashed ${color.border}`,
              fontFamily: fontFamily.mono,
              fontSize: 10,
              letterSpacing: 2,
              color: color.accent,
              textTransform: "uppercase",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <span>SPECIFICATION · CONCEPT BRIEF</span>
            <span style={{ opacity: 0.65 }}>DWG · {level.id.toUpperCase()}</span>
          </div>
          <div style={{ padding: "16px 18px" }}>
            <h1
              style={{
                margin: "0 0 10px",
                fontFamily: fontFamily.display,
                fontSize: 30,
                lineHeight: 1.1,
                letterSpacing: 2,
                textTransform: "uppercase",
                color: color.text,
              }}
            >
              {level.title}
            </h1>
            <p
              style={{
                margin: 0,
                fontSize: 16,
                lineHeight: 1.5,
                color: color.accent,
              }}
            >
              {lesson.tagline}
            </p>
          </div>
        </header>

        {lesson.sections.map((section, i) => (
          <section key={i} style={{ marginBottom: 28 }}>
            <h2
              style={{
                fontFamily: fontFamily.display,
                fontSize: 16,
                margin: "0 0 12px",
                color: color.text,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                paddingBottom: 6,
                borderBottom: `1px dashed ${color.border}`,
              }}
            >
              <span style={{ color: color.accent, fontFamily: fontFamily.mono, fontSize: 11, marginRight: 8 }}>
                §{(i + 1).toString().padStart(2, "0")}
              </span>
              {section.heading}
            </h2>
            {section.blocks.map((block, j) => (
              <LessonBlockView key={j} block={block} />
            ))}
          </section>
        ))}

        {lesson.cheatsheet && lesson.cheatsheet.length > 0 && (
          <section
            style={{
              marginTop: 32,
              border: `1px solid ${color.highlightSoftBorder}`,
              background: color.highlightSoftBg,
            }}
          >
            <div
              style={{
                fontFamily: fontFamily.mono,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 2,
                color: color.highlight,
                padding: "8px 14px",
                borderBottom: `1px dashed ${color.highlightSoftBorder}`,
              }}
            >
              ⚑ CHEATSHEET · QUICK REFERENCE
            </div>
            <ul
              style={{
                margin: 0,
                padding: "12px 18px 14px 36px",
                color: color.text,
                fontSize: 14,
                lineHeight: 1.7,
              }}
            >
              {lesson.cheatsheet.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </section>
        )}

        <div
          style={{
            marginTop: 36,
            border: `1px solid ${color.borderStrong}`,
            background: "rgba(14, 26, 43, 0.7)",
          }}
        >
          <div
            style={{
              padding: "8px 14px",
              borderBottom: `1px dashed ${color.border}`,
              fontFamily: fontFamily.mono,
              fontSize: 10,
              letterSpacing: 2,
              color: color.accent,
              textTransform: "uppercase",
            }}
          >
            ▸ THE EXERCISE
          </div>
          <div style={{ padding: "16px 18px" }}>
            <p style={{ margin: "0 0 16px", fontSize: 14, lineHeight: 1.6, color: color.text }}>
              {level.brief}
            </p>
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <Link href={`/levels/${level.id}/play`} style={btnPrimary}>
                ▸ START EXERCISE
              </Link>
              <Link href="/levels" style={btnSecondary}>
                BACK TO DRAWING SET
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LessonBlockView({ block }: { block: LessonBlock }) {
  if (block.type === "p") {
    return (
      <p style={{ margin: "0 0 12px", fontSize: 14.5, lineHeight: 1.65, color: color.text }}>
        {block.text}
      </p>
    );
  }
  if (block.type === "bullets") {
    return (
      <ul
        style={{
          margin: "0 0 12px",
          paddingLeft: 22,
          fontSize: 14.5,
          lineHeight: 1.7,
          color: color.text,
        }}
      >
        {block.items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    );
  }
  const tones: Record<typeof block.tone, { border: string; bg: string; tag: string; label: string }> = {
    info:    { border: "rgba(122, 223, 255, 0.45)", bg: "rgba(122, 223, 255, 0.08)", tag: color.accent,  label: "NOTE" },
    warn:    { border: color.highlightSoftBorder,   bg: color.highlightSoftBg,        tag: color.warning, label: "CAUTION" },
    success: { border: "rgba(155, 227, 107, 0.45)", bg: "rgba(155, 227, 107, 0.08)", tag: color.success, label: "APPROVED" },
  };
  const c = tones[block.tone];
  return (
    <div
      style={{
        margin: "10px 0 14px",
        border: `1px solid ${c.border}`,
        background: c.bg,
      }}
    >
      <div
        style={{
          padding: "4px 10px",
          fontFamily: fontFamily.mono,
          fontSize: 10,
          letterSpacing: 2,
          color: c.tag,
          borderBottom: `1px dashed ${c.border}`,
        }}
      >
        ⚑ {c.label}
      </div>
      <div style={{ padding: "10px 14px" }}>
        {block.title && (
          <div
            style={{
              fontFamily: fontFamily.display,
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: 1,
              textTransform: "uppercase",
              color: c.tag,
              marginBottom: 4,
            }}
          >
            {block.title}
          </div>
        )}
        <div style={{ fontSize: 14, lineHeight: 1.6, color: color.text }}>{block.text}</div>
      </div>
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  color: color.text,
  padding: "32px 24px 64px",
};

const containerStyle: React.CSSProperties = {
  maxWidth: 780,
  margin: "0 auto",
};

const breadcrumbLink: React.CSSProperties = {
  fontFamily: fontFamily.mono,
  fontSize: 11,
  letterSpacing: 1.5,
  color: color.accent,
  textDecoration: "none",
};

const btnPrimary: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "10px 18px",
  background: color.accent,
  color: color.accentInk,
  fontFamily: fontFamily.display,
  fontWeight: 700,
  fontSize: 13,
  letterSpacing: 2,
  textDecoration: "none",
  textTransform: "uppercase",
  border: `1px solid ${color.accent}`,
  boxShadow: `3px 3px 0 0 ${color.borderStrong}`,
};

const btnSecondary: React.CSSProperties = {
  display: "inline-block",
  padding: "10px 18px",
  border: `1px solid ${color.borderStrong}`,
  background: "transparent",
  color: color.text,
  fontFamily: fontFamily.display,
  fontSize: 12,
  letterSpacing: 2,
  textTransform: "uppercase",
  textDecoration: "none",
  cursor: "pointer",
};
