"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { LEVELS } from "@/lib/levels";
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

export default function LevelsPage() {
  const progress = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <div style={{ minHeight: "100vh", background: "#0b1020", color: "#e5e7eb", padding: "48px 24px" }}>
      <div style={{ maxWidth: 880, margin: "0 auto" }}>
        <Link href="/" style={{ fontSize: 12, color: "#60a5fa" }}>← Home</Link>
        <h1 style={{ fontSize: 28, marginTop: 16, marginBottom: 4 }}>Levels</h1>
        <p style={{ opacity: 0.7, fontSize: 14, marginBottom: 24 }}>
          Build the diagram. Pass the rules. Survive the simulation.
        </p>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
          {LEVELS.map((level, idx) => {
            const p = progress[level.id];
            return (
              <li key={level.id}>
                <Link
                  href={`/levels/${level.id}/play`}
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
                    <div style={{ fontSize: 16, fontWeight: 600 }}>{level.title}</div>
                    <div style={{ fontSize: 13, opacity: 0.7, marginTop: 2 }}>{level.brief}</div>
                    {p?.bestMetrics && (
                      <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>
                        Best: p95 {p.bestMetrics.p95Latency} · success {(p.bestMetrics.successRate * 100).toFixed(0)}%
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: 18, opacity: 0.4 }}>→</div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
