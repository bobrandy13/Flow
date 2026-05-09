"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { LEVELS } from "@flow/shared/levels";
import type { Level } from "@flow/shared/types/level";
import { loadProgress, type ProgressMap } from "@/lib/storage/progress";

const EMPTY: ProgressMap = {};
let cachedRaw: string | null = null;
let cachedSnapshot: ProgressMap = EMPTY;
function subscribe(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
}
function getSnapshot(): ProgressMap {
  if (typeof window === "undefined") return EMPTY;
  const raw = window.localStorage.getItem("flow.progress.v1");
  if (raw === cachedRaw) return cachedSnapshot;
  cachedRaw = raw;
  cachedSnapshot = loadProgress();
  return cachedSnapshot;
}
function getServerSnapshot(): ProgressMap {
  return EMPTY;
}

const EMPTY_SEEN: Record<string, true> = {};
let seenCachedRaw: string | null = null;
let seenCachedSnapshot: Record<string, true> = EMPTY_SEEN;
function subscribeSeen(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
}
function getSeenSnapshot(): Record<string, true> {
  if (typeof window === "undefined") return EMPTY_SEEN;
  const raw = window.localStorage.getItem("flow.lessonsSeen.v1");
  if (raw === seenCachedRaw) return seenCachedSnapshot;
  seenCachedRaw = raw;
  try {
    seenCachedSnapshot = raw ? (JSON.parse(raw) as Record<string, true>) : EMPTY_SEEN;
  } catch {
    seenCachedSnapshot = EMPTY_SEEN;
  }
  return seenCachedSnapshot;
}
function getSeenServerSnapshot(): Record<string, true> {
  return EMPTY_SEEN;
}

const CHAPTER_ORDER: Array<NonNullable<Level["chapter"]>> = [
  "Basics",
  "Scaling",
  "Composition",
];

const CHAPTER_BLURBS: Record<NonNullable<Level["chapter"]>, string> = {
  Basics: "Foundations: clients, servers, persistence, scaling out, caching.",
  Scaling: "Handle bursts, decouple producers from consumers, partition by key.",
  Composition: "Combine patterns into real-world topologies. No single right answer.",
};

export default function LevelsPage() {
  const progress = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const seen = useSyncExternalStore(subscribeSeen, getSeenSnapshot, getSeenServerSnapshot);

  // Group levels by chapter, preserving the original level order within each.
  const byChapter = new Map<NonNullable<Level["chapter"]>, Array<{ level: Level; idx: number }>>();
  LEVELS.forEach((level, idx) => {
    const ch = level.chapter ?? "Basics";
    const arr = byChapter.get(ch) ?? [];
    arr.push({ level, idx });
    byChapter.set(ch, arr);
  });

  // A chapter is unlocked once any prior chapter has at least one completed level.
  // Soft gating: locked chapters are visible but visually muted.
  const isUnlocked = (chapter: NonNullable<Level["chapter"]>): boolean => {
    const order = CHAPTER_ORDER.indexOf(chapter);
    if (order <= 0) return true;
    const prev = CHAPTER_ORDER[order - 1];
    const prevLevels = byChapter.get(prev) ?? [];
    return prevLevels.some(({ level }) => progress[level.id]?.completed);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0b1020", color: "#e5e7eb", padding: "48px 24px" }}>
      <div style={{ maxWidth: 880, margin: "0 auto" }}>
        <Link href="/" style={{ fontSize: 12, color: "#60a5fa" }}>← Home</Link>
        <h1 style={{ fontSize: 28, marginTop: 16, marginBottom: 4 }}>Levels</h1>
        <p style={{ opacity: 0.7, fontSize: 14, marginBottom: 32 }}>
          Build the diagram. Pass the rules. Survive the simulation.
        </p>
        {CHAPTER_ORDER.filter((ch) => byChapter.has(ch)).map((chapter) => {
          const unlocked = isUnlocked(chapter);
          const levels = byChapter.get(chapter)!;
          return (
            <section key={chapter} style={{ marginBottom: 36, opacity: unlocked ? 1 : 0.55 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 4 }}>
                <h2 style={{ fontSize: 18, margin: 0 }}>{chapter}</h2>
                {!unlocked && (
                  <span
                    title="Complete a level in the previous chapter to unlock"
                    style={{ fontSize: 11, color: "#9ca3af", border: "1px solid #374151", borderRadius: 6, padding: "1px 6px" }}
                  >
                    🔒 locked
                  </span>
                )}
              </div>
              <p style={{ fontSize: 12, opacity: 0.6, margin: "0 0 12px" }}>{CHAPTER_BLURBS[chapter]}</p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                {levels.map(({ level, idx }) => {
                  const p = progress[level.id];
                  // Only route to lesson when one exists AND the player
                  // hasn't seen it. Returning players go straight to play.
                  const lessonAvailable = !!level.lesson;
                  const lessonSeen = !!seen[level.id];
                  const showLessonFirst = lessonAvailable && !lessonSeen;
                  const href = showLessonFirst
                    ? `/levels/${level.id}/lesson`
                    : `/levels/${level.id}/play`;
                  return (
                    <li key={level.id}>
                      <Link
                        href={href}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 16,
                          padding: 16,
                          borderRadius: 12,
                          border: "1px solid #1f2937",
                          background: "#111827",
                          color: "#e5e7eb",
                          textDecoration: "none",
                        }}
                      >
                        <div
                          style={{
                            width: 36, height: 36, borderRadius: 18,
                            background: p?.completed ? "#34d399" : "#1f2937",
                            color: p?.completed ? "#0b1020" : "#e5e7eb",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontWeight: 700, fontSize: 14,
                          }}
                        >
                          {p?.completed ? "✓" : idx + 1}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 16, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                            {level.title}
                            {showLessonFirst && (
                              <span
                                title="New concept — read the lesson first"
                                style={{
                                  fontSize: 10,
                                  fontWeight: 700,
                                  letterSpacing: 0.5,
                                  padding: "1px 7px",
                                  borderRadius: 999,
                                  border: "1px solid rgba(167, 139, 250, 0.4)",
                                  color: "#a78bfa",
                                  background: "rgba(167, 139, 250, 0.08)",
                                }}
                              >
                                NEW · 📖
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 13, opacity: 0.7, marginTop: 2 }}>{level.brief}</div>
                          {p?.bestMetrics && (
                            <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>
                              Best: p95 {p.bestMetrics.p95Latency} · success {(p.bestMetrics.successRate * 100).toFixed(0)}%
                            </div>
                          )}
                        </div>
                        <div style={{ fontSize: 18, opacity: 0.4 }}>{showLessonFirst ? "📖" : "→"}</div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
