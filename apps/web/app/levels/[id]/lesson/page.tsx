"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { getLevel } from "@flow/shared/levels";
import type { LessonBlock } from "@flow/shared/types/level";
import { markLessonSeen } from "@/lib/storage/progress";

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
        <div style={{ marginBottom: 24 }}>
          <Link href="/levels" style={breadcrumbLink}>
            ← All levels
          </Link>
        </div>

        <header style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, opacity: 0.5, letterSpacing: 1, marginBottom: 4 }}>
            CONCEPT · LEVEL {level.id}
          </div>
          <h1 style={{ margin: "0 0 10px", fontSize: 32, lineHeight: 1.2 }}>{level.title}</h1>
          <p style={{ margin: 0, fontSize: 17, opacity: 0.85, color: "#a5b4fc" }}>
            {lesson.tagline}
          </p>
        </header>

        {lesson.sections.map((section, i) => (
          <section key={i} style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 18, margin: "0 0 12px", color: "#e5e7eb" }}>
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
              padding: "16px 20px",
              borderRadius: 12,
              border: "1px solid rgba(167, 139, 250, 0.3)",
              background: "rgba(167, 139, 250, 0.06)",
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 1,
                color: "#a78bfa",
                marginBottom: 8,
              }}
            >
              CHEATSHEET
            </div>
            <ul style={{ margin: 0, paddingLeft: 20, color: "#e5e7eb", fontSize: 14, lineHeight: 1.7 }}>
              {lesson.cheatsheet.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </section>
        )}

        <div
          style={{
            marginTop: 36,
            padding: "20px 24px",
            borderRadius: 12,
            border: "1px solid #1f2937",
            background: "#0f172a",
          }}
        >
          <div style={{ fontSize: 13, opacity: 0.75, marginBottom: 6 }}>The exercise</div>
          <p style={{ margin: "0 0 16px", fontSize: 14, lineHeight: 1.6 }}>{level.brief}</p>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <Link href={`/levels/${level.id}/play`} style={btnPrimary}>
              Start exercise →
            </Link>
            <Link href="/levels" style={{ ...btnSecondary, textDecoration: "none" }}>
              Back to levels
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function LessonBlockView({ block }: { block: LessonBlock }) {
  if (block.type === "p") {
    return (
      <p style={{ margin: "0 0 12px", fontSize: 14.5, lineHeight: 1.65, color: "#d1d5db" }}>
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
          color: "#d1d5db",
        }}
      >
        {block.items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    );
  }
  const tones: Record<typeof block.tone, { border: string; bg: string; tag: string }> = {
    info: { border: "rgba(96, 165, 250, 0.35)", bg: "rgba(96, 165, 250, 0.07)", tag: "#60a5fa" },
    warn: { border: "rgba(251, 191, 36, 0.35)", bg: "rgba(251, 191, 36, 0.07)", tag: "#fbbf24" },
    success: { border: "rgba(52, 211, 153, 0.35)", bg: "rgba(52, 211, 153, 0.07)", tag: "#34d399" },
  };
  const c = tones[block.tone];
  return (
    <div
      style={{
        margin: "10px 0 14px",
        padding: "12px 14px",
        borderRadius: 8,
        border: `1px solid ${c.border}`,
        background: c.bg,
      }}
    >
      {block.title && (
        <div style={{ fontSize: 12, fontWeight: 700, color: c.tag, marginBottom: 4 }}>
          {block.title}
        </div>
      )}
      <div style={{ fontSize: 14, lineHeight: 1.6, color: "#e5e7eb" }}>{block.text}</div>
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#0b1020",
  color: "#e5e7eb",
  padding: "32px 24px 64px",
};

const containerStyle: React.CSSProperties = {
  maxWidth: 760,
  margin: "0 auto",
};

const breadcrumbLink: React.CSSProperties = {
  fontSize: 12,
  color: "#9ca3af",
  textDecoration: "none",
};

const btnPrimary: React.CSSProperties = {
  display: "inline-block",
  padding: "10px 18px",
  borderRadius: 8,
  background: "#60a5fa",
  color: "#0b1020",
  fontWeight: 700,
  fontSize: 14,
  textDecoration: "none",
};

const btnSecondary: React.CSSProperties = {
  display: "inline-block",
  padding: "10px 18px",
  borderRadius: 8,
  border: "1px solid #1f2937",
  background: "transparent",
  color: "#e5e7eb",
  fontSize: 14,
  cursor: "pointer",
};
