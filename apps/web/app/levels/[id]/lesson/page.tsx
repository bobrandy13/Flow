"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { getLevel } from "@flow/shared/levels";
import type { LessonBlock } from "@flow/shared/types/level";
import { markLessonSeen } from "@/lib/storage/progress";
import { color, fontFamily } from "@/lib/ui/theme";
import { processGlossaryText } from "@/lib/glossary/processText";
import { PrereqCallout } from "@/components/lesson/PrereqCallout";

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
      <div className="flow-content-zone" style={containerStyle}>
        <nav style={{ marginBottom: 24 }}>
          <Link href="/levels" style={breadcrumbLink}>
            ← Back to All Levels
          </Link>
        </nav>

        {/* Title card */}
        <header style={headerStyle}>
          <div style={headerBadge}>
            <span style={{ color: color.accent }}>CONCEPT</span>
            <span style={{ opacity: 0.5 }}>·</span>
            <span style={{ color: color.textMuted }}>LEVEL {level.id.split("-")[0]}</span>
          </div>
          <div style={{ padding: "20px 24px 24px" }}>
            <h1 style={titleStyle}>{level.title}</h1>
            <p style={taglineStyle}>{lesson.tagline}</p>
          </div>
        </header>

        {/* Sections */}
        {lesson.sections.map((section, i) => (
          <section key={i} style={sectionStyle}>
            <h2 style={sectionHeadingStyle}>
              <span style={sectionNumberStyle}>{(i + 1).toString().padStart(2, "0")}</span>
              {section.heading}
            </h2>
            <div style={sectionBodyStyle}>
              {section.blocks.map((block, j) => (
                <LessonBlockView key={j} block={block} />
              ))}
            </div>
          </section>
        ))}

        {/* Cheatsheet */}
        {lesson.cheatsheet && lesson.cheatsheet.length > 0 && (
          <section style={cheatsheetStyle}>
            <div style={cheatsheetHeader}>
              <span style={{ marginRight: 8 }}>📋</span>
              CHEATSHEET · QUICK REFERENCE
            </div>
            <ul style={cheatsheetList}>
              {lesson.cheatsheet.map((line, i) => (
                <li key={i} style={cheatsheetItem}>{processGlossaryText(line)}</li>
              ))}
            </ul>
          </section>
        )}

        {/* Exercise CTA */}
        <div style={ctaCardStyle}>
          <div style={ctaHeader}>READY TO BUILD</div>
          <div style={{ padding: "20px 24px" }}>
            <p style={{ margin: "0 0 18px", fontSize: 15, lineHeight: 1.6, color: color.text }}>
              {level.brief}
            </p>
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <Link href={`/levels/${level.id}/play`} style={btnPrimary}>
                ▸ START EXERCISE
              </Link>
              <Link href="/levels" style={btnSecondary}>
                ALL LEVELS
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
    return <p style={paragraphStyle}>{processGlossaryText(block.text)}</p>;
  }

  if (block.type === "bullets") {
    return (
      <ul style={bulletListStyle}>
        {block.items.map((item, i) => (
          <li key={i} style={bulletItemStyle}>
            <span style={bulletDot}>▸</span>
            <span>{processGlossaryText(item)}</span>
          </li>
        ))}
      </ul>
    );
  }

  if (block.type === "definitions") {
    return (
      <dl style={defListStyle}>
        {block.items.map((item, i) => (
          <div key={i} style={defItemStyle}>
            <dt style={defTermStyle}>{item.term}</dt>
            <dd style={defDescStyle}>{processGlossaryText(item.description)}</dd>
          </div>
        ))}
      </dl>
    );
  }

  if (block.type === "code") {
    return (
      <pre style={codeBlockStyle}>
        <code>{block.text}</code>
      </pre>
    );
  }

  if (block.type === "prereq") {
    return <PrereqCallout title={block.title} items={block.items} />;
  }

  // callout
  const toneConfig: Record<typeof block.tone, { border: string; bg: string; accent: string; icon: string }> = {
    info: {
      border: "rgba(122, 223, 255, 0.35)",
      bg: "rgba(122, 223, 255, 0.06)",
      accent: color.accent,
      icon: "💡",
    },
    warn: {
      border: "rgba(255, 181, 71, 0.4)",
      bg: "rgba(255, 181, 71, 0.07)",
      accent: color.warning,
      icon: "⚠️",
    },
    success: {
      border: "rgba(155, 227, 107, 0.4)",
      bg: "rgba(155, 227, 107, 0.07)",
      accent: color.success,
      icon: "✓",
    },
  };
  const tone = toneConfig[block.tone];

  return (
    <div style={{ ...calloutStyle, borderColor: tone.border, background: tone.bg, borderLeftColor: tone.accent }}>
      {block.title && (
        <div style={{ ...calloutTitleStyle, color: tone.accent }}>
          <span style={{ marginRight: 8 }}>{tone.icon}</span>
          {block.title}
        </div>
      )}
      <div style={calloutBodyStyle}>{processGlossaryText(block.text)}</div>
    </div>
  );
}

/* ── Styles ── */

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  color: color.text,
  padding: "32px 24px 80px",
  // No background override — let the body blueprint grid show through.
  // The flow-content-zone class (applied to the container) adds a subtle
  // center-strip dim so text stays readable over the grid.
};

const containerStyle: React.CSSProperties = {
  maxWidth: 720,
  margin: "0 auto",
};

const breadcrumbLink: React.CSSProperties = {
  fontFamily: fontFamily.mono,
  fontSize: 12,
  letterSpacing: 1,
  color: color.accent,
  textDecoration: "none",
  opacity: 0.85,
};

const headerStyle: React.CSSProperties = {
  marginBottom: 36,
  background: "rgba(19, 36, 58, 0.85)",
  border: `1px solid ${color.borderStrong}`,
  borderRadius: 8,
  overflow: "hidden",
  backdropFilter: "blur(8px)",
};

const headerBadge: React.CSSProperties = {
  display: "flex",
  gap: 8,
  alignItems: "center",
  padding: "10px 24px",
  borderBottom: `1px solid ${color.border}`,
  fontFamily: fontFamily.mono,
  fontSize: 11,
  letterSpacing: 2,
  textTransform: "uppercase",
};

const titleStyle: React.CSSProperties = {
  margin: "0 0 10px",
  fontFamily: fontFamily.display,
  fontSize: 28,
  lineHeight: 1.15,
  letterSpacing: 1,
  textTransform: "uppercase",
  color: color.text,
};

const taglineStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 16,
  lineHeight: 1.5,
  color: color.accent,
  fontStyle: "italic",
};

const sectionStyle: React.CSSProperties = {
  marginBottom: 32,
};

const sectionHeadingStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  fontFamily: fontFamily.display,
  fontSize: 17,
  margin: "0 0 16px",
  color: color.text,
  letterSpacing: 1,
  textTransform: "uppercase",
  paddingBottom: 8,
  borderBottom: `1px solid ${color.border}`,
};

const sectionNumberStyle: React.CSSProperties = {
  fontFamily: fontFamily.mono,
  fontSize: 12,
  color: color.accent,
  background: "rgba(122, 223, 255, 0.1)",
  padding: "2px 8px",
  borderRadius: 4,
  letterSpacing: 1,
};

const sectionBodyStyle: React.CSSProperties = {
  paddingLeft: 4,
};

const paragraphStyle: React.CSSProperties = {
  margin: "0 0 16px",
  fontSize: 15,
  lineHeight: 1.75,
  color: color.text,
};

const bulletListStyle: React.CSSProperties = {
  margin: "0 0 16px",
  padding: 0,
  listStyle: "none",
};

const bulletItemStyle: React.CSSProperties = {
  display: "flex",
  gap: 10,
  alignItems: "flex-start",
  marginBottom: 8,
  fontSize: 15,
  lineHeight: 1.7,
  color: color.text,
};

const bulletDot: React.CSSProperties = {
  color: color.accent,
  fontWeight: 700,
  flexShrink: 0,
  marginTop: 2,
};

const defListStyle: React.CSSProperties = {
  margin: "0 0 16px",
  padding: 0,
};

const defItemStyle: React.CSSProperties = {
  marginBottom: 12,
  padding: "10px 14px",
  background: "rgba(19, 36, 58, 0.6)",
  border: `1px solid ${color.border}`,
  borderRadius: 6,
};

const defTermStyle: React.CSSProperties = {
  fontFamily: fontFamily.mono,
  fontSize: 13,
  fontWeight: 700,
  color: color.accent,
  marginBottom: 4,
  letterSpacing: 0.5,
};

const defDescStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 14,
  lineHeight: 1.65,
  color: color.text,
};

const codeBlockStyle: React.CSSProperties = {
  margin: "0 0 16px",
  padding: "12px 16px",
  background: "rgba(14, 26, 43, 0.9)",
  border: `1px solid ${color.border}`,
  borderRadius: 6,
  fontFamily: fontFamily.mono,
  fontSize: 13,
  lineHeight: 1.6,
  color: color.accent,
  overflow: "auto",
  whiteSpace: "pre-wrap",
};

const calloutStyle: React.CSSProperties = {
  margin: "12px 0 18px",
  padding: "14px 18px",
  borderRadius: 6,
  border: "1px solid",
  borderLeftWidth: 4,
};

const calloutTitleStyle: React.CSSProperties = {
  fontFamily: fontFamily.display,
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: 0.8,
  textTransform: "uppercase",
  marginBottom: 6,
};

const calloutBodyStyle: React.CSSProperties = {
  fontSize: 14.5,
  lineHeight: 1.7,
  color: color.text,
};

const cheatsheetStyle: React.CSSProperties = {
  marginTop: 40,
  background: "rgba(155, 227, 107, 0.05)",
  border: `1px solid rgba(155, 227, 107, 0.3)`,
  borderRadius: 8,
  overflow: "hidden",
};

const cheatsheetHeader: React.CSSProperties = {
  fontFamily: fontFamily.mono,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 2,
  color: color.success,
  padding: "10px 20px",
  borderBottom: `1px solid rgba(155, 227, 107, 0.2)`,
  display: "flex",
  alignItems: "center",
};

const cheatsheetList: React.CSSProperties = {
  margin: 0,
  padding: "14px 24px 16px",
  listStyle: "none",
};

const cheatsheetItem: React.CSSProperties = {
  position: "relative",
  paddingLeft: 18,
  marginBottom: 8,
  fontSize: 14,
  lineHeight: 1.7,
  color: color.text,
};

const ctaCardStyle: React.CSSProperties = {
  marginTop: 40,
  background: "rgba(19, 36, 58, 0.85)",
  border: `1px solid ${color.accent}`,
  borderRadius: 8,
  overflow: "hidden",
  backdropFilter: "blur(8px)",
};

const ctaHeader: React.CSSProperties = {
  padding: "10px 24px",
  borderBottom: `1px solid rgba(122, 223, 255, 0.25)`,
  fontFamily: fontFamily.mono,
  fontSize: 11,
  letterSpacing: 2,
  color: color.accent,
};

const btnPrimary: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "10px 20px",
  background: color.accent,
  color: color.accentInk,
  fontFamily: fontFamily.display,
  fontWeight: 700,
  fontSize: 13,
  letterSpacing: 2,
  textDecoration: "none",
  textTransform: "uppercase",
  border: "none",
  borderRadius: 4,
};

const btnSecondary: React.CSSProperties = {
  display: "inline-block",
  padding: "10px 20px",
  border: `1px solid ${color.borderStrong}`,
  background: "transparent",
  color: color.textMuted,
  fontFamily: fontFamily.display,
  fontSize: 12,
  letterSpacing: 2,
  textTransform: "uppercase",
  textDecoration: "none",
  cursor: "pointer",
  borderRadius: 4,
};
