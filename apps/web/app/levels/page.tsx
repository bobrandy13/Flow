"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { LEVELS } from "@flow/shared/levels";
import type { Level } from "@flow/shared/types/level";
import { useProgress } from "@/lib/hooks/useProgress";
import { clearAllProgress } from "@/lib/storage/progress";
import { notifyProgressChanged } from "@/lib/hooks/useProgress";
import { color, radius } from "@/lib/ui/theme";

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

  // Group levels by chapter, preserving original level order.
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

  // Chapter unlock cascades from any completion in the prior chapter.
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
    <div style={{ minHeight: "100vh", background: color.bg, color: color.text, padding: "32px 24px 64px" }}>
      <div style={{ maxWidth: 880, margin: "0 auto" }}>
        <h1 style={{ fontSize: 28, marginTop: 8, marginBottom: 4 }}>Levels</h1>
        <p style={{ opacity: 0.7, fontSize: 14, marginBottom: 24 }}>
          Build the diagram. Pass the rules. Survive the simulation.
        </p>

        {/* Progress header */}
        <section
          aria-label="Overall progress"
          style={{
            background: color.bgRaisedSoft,
            border: `1px solid ${color.border}`,
            borderRadius: radius.lg,
            padding: 16,
            marginBottom: 24,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>
              <span style={{ color: color.success }}>{completedLevels}</span>
              <span style={{ opacity: 0.7 }}> / {totalLevels} levels complete</span>
            </div>
            <div style={{ fontSize: 12, opacity: 0.6 }}>
              {unlockedChapters} of {totalChapters} chapters unlocked
            </div>
          </div>
          <div
            role="progressbar"
            aria-valuenow={Math.round(completePct * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            style={{
              height: 6,
              background: color.bgRaised,
              borderRadius: radius.pill,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${completePct * 100}%`,
                height: "100%",
                background: color.success,
                transition: "width 200ms ease",
              }}
            />
          </div>
        </section>

        {/* Filter row */}
        <div
          role="tablist"
          aria-label="Filter levels"
          style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}
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
                  border: `1px solid ${active ? color.borderStrong : color.border}`,
                  color: active ? color.text : color.textMuted,
                  borderRadius: radius.pill,
                  padding: "4px 12px",
                  fontSize: 12,
                  cursor: "pointer",
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
              <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 4, flexWrap: "wrap" }}>
                <h2 style={{ fontSize: 18, margin: 0 }}>
                  {chapter}
                  {chComplete && <span title="Chapter complete" style={{ marginLeft: 8 }}>🎉</span>}
                </h2>
                <span style={{ fontSize: 12, opacity: 0.6 }}>
                  {chDone} / {chTotal}
                </span>
                {!unlocked && (
                  <span
                    style={{
                      fontSize: 11,
                      color: color.textMuted,
                      border: `1px solid ${color.borderStrong}`,
                      borderRadius: radius.sm,
                      padding: "1px 6px",
                    }}
                  >
                    🔒 locked
                  </span>
                )}
              </div>
              <p style={{ fontSize: 12, opacity: 0.6, margin: "0 0 6px" }}>{CHAPTER_BLURBS[chapter]}</p>
              {!unlocked && (
                <p style={{ fontSize: 11, opacity: 0.55, margin: "0 0 12px" }}>
                  Complete any level in <strong>{CHAPTER_ORDER[CHAPTER_ORDER.indexOf(chapter) - 1]}</strong> to unlock.
                </p>
              )}
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                {visibleLevels.map(({ level, idx }) => (
                  <LevelRow
                    key={level.id}
                    level={level}
                    idx={idx}
                    progress={progress[level.id]}
                  />
                ))}
              </ul>
            </section>
          );
        })}

        <footer style={{ marginTop: 48, paddingTop: 16, borderTop: `1px solid ${color.border}`, fontSize: 11, opacity: 0.5, textAlign: "center" }}>
          <button
            type="button"
            onClick={handleResetProgress}
            style={{
              background: "transparent",
              border: "none",
              color: color.textMuted,
              fontSize: 11,
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

function LevelRow({
  level,
  idx,
  progress,
}: {
  level: Level;
  idx: number;
  progress: { completed: boolean; bestMetrics?: { p95Latency: number; successRate: number } } | undefined;
}) {
  // We can't read lesson-seen state from this hook, but the route choice
  // is the same as before: always go to the lesson if one exists and the
  // player hasn't passed the level yet. Returning players still get the
  // play page first.
  const lessonAvailable = !!level.lesson;
  const showLessonFirst = lessonAvailable && !progress?.completed;
  const href = showLessonFirst
    ? `/levels/${level.id}/lesson`
    : `/levels/${level.id}/play`;

  return (
    <li>
      <Link
        href={href}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: 16,
          borderRadius: radius.lg,
          border: `1px solid ${color.border}`,
          background: color.bgRaisedSoft,
          color: color.text,
          textDecoration: "none",
        }}
      >
        <div
          style={{
            width: 36, height: 36, borderRadius: radius.pill,
            background: progress?.completed ? color.success : color.bgRaised,
            color: progress?.completed ? color.accentInk : color.text,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 700, fontSize: 14, flexShrink: 0,
          }}
        >
          {progress?.completed ? "✓" : idx + 1}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {level.title}
            {showLessonFirst && (
              <span
                title="Read the lesson first"
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: 0.5,
                  padding: "1px 7px",
                  borderRadius: radius.pill,
                  border: `1px solid ${color.highlightSoftBorder}`,
                  color: color.highlight,
                  background: color.highlightSoftBg,
                }}
              >
                NEW · 📖
              </span>
            )}
          </div>
          <div style={{ fontSize: 13, opacity: 0.7, marginTop: 2 }}>{level.brief}</div>
          {progress?.bestMetrics && (
            <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>
              Best: p95 {progress.bestMetrics.p95Latency} · success {(progress.bestMetrics.successRate * 100).toFixed(0)}%
            </div>
          )}
        </div>
        <div style={{ fontSize: 18, opacity: 0.4 }}>{showLessonFirst ? "📖" : "→"}</div>
      </Link>
    </li>
  );
}
