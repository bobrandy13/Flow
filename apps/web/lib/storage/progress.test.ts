import { describe, it, expect, beforeEach } from "vitest";
import { hasSeenLesson, markLessonSeen } from "./progress";

describe("lessonSeen storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("hasSeenLesson is false before markLessonSeen is called", () => {
    expect(hasSeenLesson("01-hello-server")).toBe(false);
  });

  it("markLessonSeen persists per-level and survives reload", () => {
    markLessonSeen("01-hello-server");
    markLessonSeen("05-smooth-the-burst");
    expect(hasSeenLesson("01-hello-server")).toBe(true);
    expect(hasSeenLesson("05-smooth-the-burst")).toBe(true);
    expect(hasSeenLesson("99-not-real")).toBe(false);
  });

  it("markLessonSeen is idempotent (calling twice doesn't blow up)", () => {
    markLessonSeen("01-hello-server");
    markLessonSeen("01-hello-server");
    expect(hasSeenLesson("01-hello-server")).toBe(true);
  });

  /**
   * Regression: lessonSeen lives in its own localStorage key so it can't
   * collide with progress. If we ever merge them, this test must change
   * deliberately.
   */
  it("lessonSeen lives in flow.lessonsSeen.v1, not flow.progress.v1", () => {
    markLessonSeen("01-hello-server");
    expect(window.localStorage.getItem("flow.lessonsSeen.v1")).toContain("01-hello-server");
    expect(window.localStorage.getItem("flow.progress.v1")).toBeNull();
  });
});
