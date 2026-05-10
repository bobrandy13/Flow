"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { LEVELS } from "@flow/shared/levels";
import type { Level } from "@flow/shared/types/level";
import { useProgress } from "@/lib/hooks/useProgress";
import { clearAllProgress } from "@/lib/storage/progress";
import { notifyProgressChanged } from "@/lib/hooks/useProgress";
import { color, fontFamily, radius } from "@/lib/ui/theme";

const CHAPTER_ORDER: Array<NonNullable<Level["chapter"]>> = [
  "Basics",
  "Scaling",
  "Composition",
  "Reliability",
  "Edge",
];

const CHAPTER_BLURBS: Record<NonNullable<Level["chapter"]>, string> = {
  Basics: "Foundations: clients, servers, persistence, scaling out, caching.",
  Scaling: "Handle bursts, decouple producers from consumers, partition by key.",
  Composition: "Combine patterns into real-world topologies. No single right answer.",
  Reliability: "Survive failures: replicas, rate limits, circuit breakers, dead-letter queues.",
  Edge: "Move work closer to users: CDNs, regional caching, the speed-of-light tax.",
};

// Discipline label per chapter — gives the section header a "drawing
// set table-of-contents" feel without claiming the chapters literally
// map to AEC disciplines.
const CHAPTER_DISCIPLINE: Record<NonNullable<Level["chapter"]>, string> = {
  Basics: "FOUNDATIONS",
  Scaling: "SCALING",
  Composition: "COMPOSITION",
  Reliability: "RELIABILITY",
  Edge: "EDGE",
};

type FilterKey = "all" | "in_progress" | "completed" | "locked";

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "All" },
  { key: "in_progress", label: "In progress" },
  { key: "completed", label: "Completed" },
  { key: "locked", label: "Locked" },
];

export default function LevelsPage() {
  const progress = useProgress();
  const [filter, setFilter] = useState<FilterKey>("all");

  const byChapter = useMemo(() => {
    const m = new Map<NonNullable<Level["chapter"]>, Array<{ level: Level; idx: number }>>();
    LEVELS.forEach((level, idx) => {
      const ch = level.chapter ?? "Basics";
      const arr = m.get(ch) ?? [];
      arr.push({ level, idx });
      m.set(ch, arr);
    });
    return m;
  }, []);

  const isUnlocked = (chapter: NonNullable<Level["chapter"]>): boolean => {
    const order = CHAPTER_ORDER.indexOf(chapter);
    if (order <= 0) return true;
    const prev = CHAPTER_ORDER[order - 1];
    const prevLevels = byChapter.get(prev) ?? [];
    return prevLevels.some(({ level }) => progress[level.id]?.completed);
  };

  const totalLevels = LEVELS.length;
  const completedLevels = LEVELS.filter((l) => progress[l.id]?.completed).length;
  const totalChapters = CHAPTER_ORDER.filter((c) => byChapter.has(c)).length;
  const unlockedChapters = CHAPTER_ORDER.filter((c) => byChapter.has(c) && isUnlocked(c)).length;
  const completePct = totalLevels > 0 ? completedLevels / totalLevels : 0;

  const showLevel = (level: Level, chapterUnlocked: boolean): boolean => {
    const p = progress[level.id];
    switch (filter) {
      case "all":
        return true;
      case "in_progress":
        return !!p?.lastDiagram && !p?.completed && chapterUnlocked;
      case "completed":
        return !!p?.completed;
      case "locked":
        return !chapterUnlocked;
    }
  };

  const handleResetProgress = () => {
    if (typeof window === "undefined") return;
    const ok = window.confirm(
      "Reset ALL progress? This clears completed levels, best metrics, last designs, and lesson-seen state. This cannot be undone.",
    );
    if (!ok) return;
    clearAllProgress();
    notifyProgressChanged();
  };

  return (
    <div style={{ minHeight: "100vh", color: color.text, padding: "32px 24px 64px" }}>
      <div style={{ maxWidth: 920, margin: "0 auto" }}>
        {/* Drawing set masthead */}
        <div
          style={{
            fontFamily: fontFamily.mono,
            fontSize: 10,
            letterSpacing: 2,
            color: color.accent,
            marginBottom: 4,
          }}
        >
          DRAWING SET · INDEX
        </div>
        <h1
          style={{
            fontFamily: fontFamily.display,
            fontSize: 32,
            letterSpacing: 2,
            textTransform: "uppercase",
            margin: "0 0 6px",
          }}
        >
          System Design Curriculum
        </h1>
        <p style={{ color: color.textMuted, fontSize: 14, marginBottom: 28 }}>
          Build the diagram. Pass the rules. Survive the simulation.
        </p>

        {/* Progress / completion stamp */}
        <ProgressStamp
          completedLevels={completedLevels}
          totalLevels={totalLevels}
          unlockedChapters={unlockedChapters}
          totalChapters={totalChapters}
          completePct={completePct}
        />

        {/* Filing-tab style filters */}
        <div
          role="tablist"
          aria-label="Filter levels"
          style={{
            display: "flex",
            gap: 0,
            marginBottom: 20,
            flexWrap: "wrap",
            borderBottom: `1px solid ${color.borderStrong}`,
          }}
        >
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(f.key)}
                style={{
                  background: active ? color.bgRaised : "transparent",
                  border: `1px solid ${active ? color.accent : color.borderStrong}`,
                  borderBottom: active ? `1px solid ${color.bgRaised}` : "none",
                  borderRadius: "4px 4px 0 0",
                  color: active ? color.accent : color.textMuted,
                  padding: "6px 14px",
                  fontFamily: fontFamily.display,
                  fontSize: 11,
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                  cursor: "pointer",
                  marginRight: 2,
                  marginBottom: -1,
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {CHAPTER_ORDER.filter((ch) => byChapter.has(ch)).map((chapter) => {
          const unlocked = isUnlocked(chapter);
          const allLevels = byChapter.get(chapter)!;
          const visibleLevels = allLevels.filter(({ level }) => showLevel(level, unlocked));
          if (visibleLevels.length === 0) return null;

          const chDone = allLevels.filter(({ level }) => progress[level.id]?.completed).length;
          const chTotal = allLevels.length;
          const chComplete = chDone === chTotal;

          return (
            <section key={chapter} style={{ marginBottom: 36, opacity: unlocked ? 1 : 0.55 }}>
              {/* Section title block */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  borderTop: `1px solid ${color.borderStrong}`,
                  borderBottom: `1px dashed ${color.border}`,
                  padding: "10px 0",
                  marginBottom: 12,
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{
                    fontFamily: fontFamily.mono,
                    fontSize: 10,
                    color: color.accent,
                    letterSpacing: 2,
                  }}
                >
                  SECTION · {CHAPTER_DISCIPLINE[chapter]}
                </div>
                <h2
                  style={{
                    fontFamily: fontFamily.display,
                    fontSize: 18,
                    letterSpacing: 2,
                    textTransform: "uppercase",
                    margin: 0,
                  }}
                >
                  {chapter}
                  {chComplete && (
                    <span
                      title="Section complete"
                      style={{ marginLeft: 10, fontFamily: fontFamily.mono, color: color.success, fontSize: 12 }}
                    >
                      ✔ COMPLETE
                    </span>
                  )}
                </h2>
                <span
                  style={{
                    fontFamily: fontFamily.mono,
                    fontSize: 11,
                    color: color.textMuted,
                    marginLeft: "auto",
                  }}
                >
                  {chDone.toString().padStart(2, "0")} / {chTotal.toString().padStart(2, "0")}
                </span>
                {!unlocked && (
                  <span
                    style={{
                      fontFamily: fontFamily.mono,
                      fontSize: 10,
                      color: color.warning,
                      border: `1px solid ${color.warning}`,
                      padding: "2px 8px",
                      letterSpacing: 1,
                    }}
                  >
                    🔒 LOCKED
                  </span>
                )}
              </div>
              <p style={{ fontSize: 12, color: color.textMuted, margin: "0 0 6px" }}>
                {CHAPTER_BLURBS[chapter]}
              </p>
              {!unlocked && (
                <p style={{ fontSize: 11, color: color.textSubtle, margin: "0 0 12px" }}>
                  Complete any level in <strong>{CHAPTER_ORDER[CHAPTER_ORDER.indexOf(chapter) - 1]}</strong> to unlock.
                </p>
              )}
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                {visibleLevels.map(({ level, idx }) => (
                  <LevelRow
                    key={level.id}
                    level={level}
                    idx={idx}
                    total={totalLevels}
                    progress={progress[level.id]}
                  />
                ))}
              </ul>
            </section>
          );
        })}

        <footer
          style={{
            marginTop: 48,
            paddingTop: 16,
            borderTop: `1px solid ${color.borderStrong}`,
            fontFamily: fontFamily.mono,
            fontSize: 10,
            color: color.textSubtle,
            textAlign: "center",
            letterSpacing: 1,
          }}
        >
          <button
            type="button"
            onClick={handleResetProgress}
            style={{
              background: "transparent",
              border: "none",
              color: color.textMuted,
              fontFamily: fontFamily.mono,
              fontSize: 11,
              letterSpacing: 1,
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            Reset all progress
          </button>
        </footer>
      </div>
    </div>
  );
}

function ProgressStamp({
  completedLevels,
  totalLevels,
  unlockedChapters,
  totalChapters,
  completePct,
}: {
  completedLevels: number;
  totalLevels: number;
  unlockedChapters: number;
  totalChapters: number;
  completePct: number;
}) {
  return (
    <section
      aria-label="Overall progress"
      style={{
        position: "relative",
        background: "rgba(14, 26, 43, 0.7)",
        border: `1px solid ${color.borderStrong}`,
        padding: 16,
        marginBottom: 24,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          flexWrap: "wrap",
          gap: 8,
          paddingBottom: 8,
          borderBottom: `1px dashed ${color.border}`,
        }}
      >
        <div
          style={{
            fontFamily: fontFamily.display,
            fontSize: 13,
            letterSpacing: 2,
            textTransform: "uppercase",
            color: color.text,
          }}
        >
          PROJECT STATUS
        </div>
        <div
          style={{
            fontFamily: fontFamily.mono,
            fontSize: 11,
            color: color.textMuted,
            letterSpacing: 1,
          }}
        >
          {unlockedChapters} OF {totalChapters} SECTIONS UNLOCKED
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <div
          style={{
            fontFamily: fontFamily.display,
            fontSize: 28,
            letterSpacing: 1,
            color: color.accent,
            lineHeight: 1,
          }}
        >
          {completedLevels.toString().padStart(2, "0")}
          <span style={{ color: color.textMuted, fontSize: 18 }}>
            {" "}/ {totalLevels.toString().padStart(2, "0")}
          </span>
        </div>
        <div
          style={{
            fontFamily: fontFamily.mono,
            fontSize: 10,
            color: color.textMuted,
            letterSpacing: 1.5,
          }}
        >
          SHEETS<br />COMPLETE
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div
            role="progressbar"
            aria-valuenow={Math.round(completePct * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            style={{
              height: 8,
              background: color.bgRaised,
              border: `1px solid ${color.borderStrong}`,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${completePct * 100}%`,
                height: "100%",
                background: `repeating-linear-gradient(45deg, ${color.success} 0 6px, ${color.accent} 6px 12px)`,
                transition: "width 200ms ease",
              }}
            />
          </div>
          <div
            style={{
              fontFamily: fontFamily.mono,
              fontSize: 10,
              color: color.textMuted,
              marginTop: 4,
              letterSpacing: 1,
            }}
          >
            {Math.round(completePct * 100)}% COMPLETE
          </div>
        </div>
      </div>
    </section>
  );
}

function LevelRow({
  level,
  idx,
  total,
  progress,
}: {
  level: Level;
  idx: number;
  total: number;
  progress: { completed: boolean; bestMetrics?: { p95Latency: number; successRate: number } } | undefined;
}) {
  const lessonAvailable = !!level.lesson;
  const showLessonFirst = lessonAvailable && !progress?.completed;
  const href = showLessonFirst
    ? `/levels/${level.id}/lesson`
    : `/levels/${level.id}/play`;
  const sheet = `SHT ${(idx + 1).toString().padStart(2, "0")} / ${total.toString().padStart(2, "0")}`;

  return (
    <li>
      <Link
        href={href}
        style={{
          display: "flex",
          alignItems: "stretch",
          gap: 0,
          border: `1px solid ${color.borderStrong}`,
          background: "rgba(19, 36, 58, 0.6)",
          color: color.text,
          textDecoration: "none",
          fontFamily: fontFamily.body,
        }}
      >
        {/* Sheet number gutter */}
        <div
          style={{
            width: 80,
            padding: "12px 8px",
            borderRight: `1px dashed ${color.border}`,
            background: progress?.completed
              ? "rgba(155, 227, 107, 0.10)"
              : "rgba(122, 223, 255, 0.04)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
          }}
        >
          <div
            style={{
              fontFamily: fontFamily.mono,
              fontSize: 9,
              letterSpacing: 1,
              color: color.textMuted,
            }}
          >
            {sheet}
          </div>
          <div
            style={{
              fontFamily: fontFamily.display,
              fontSize: 18,
              letterSpacing: 1,
              color: progress?.completed ? color.success : color.text,
            }}
          >
            {progress?.completed ? "✓" : (idx + 1).toString().padStart(2, "0")}
          </div>
        </div>
        {/* Body */}
        <div style={{ flex: 1, minWidth: 0, padding: "12px 16px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
              fontFamily: fontFamily.display,
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            {level.title}
            {showLessonFirst && (
              <span
                title="Read the lesson first"
                style={{
                  fontFamily: fontFamily.mono,
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: 1.5,
                  padding: "2px 7px",
                  border: `1px solid ${color.highlightSoftBorder}`,
                  color: color.highlight,
                  background: color.highlightSoftBg,
                  borderRadius: 2,
                }}
              >
                NEW · 📖
              </span>
            )}
          </div>
          <div style={{ fontSize: 13, color: color.textMuted, marginTop: 4, lineHeight: 1.5 }}>
            {level.brief}
          </div>
          {progress?.bestMetrics && (
            <div
              style={{
                fontFamily: fontFamily.mono,
                fontSize: 10,
                color: color.textSubtle,
                marginTop: 6,
                letterSpacing: 1,
              }}
            >
              BEST · p95 {progress.bestMetrics.p95Latency}ms ·
              SUCCESS {(progress.bestMetrics.successRate * 100).toFixed(0)}%
            </div>
          )}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "0 16px",
            color: color.accent,
            fontFamily: fontFamily.mono,
            fontSize: 18,
          }}
        >
          {showLessonFirst ? "📖" : "▸"}
        </div>
      </Link>
    </li>
  );
}

// `radius` is intentionally unused here; the blueprint chrome favours
// crisp rectangular borders. Suppress the unused-import noise.
void radius;
