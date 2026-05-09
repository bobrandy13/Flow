import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import LevelsPage from "./page";

/**
 * Regression: levels are grouped into chapters with headings + blurbs.
 * The 5 new Phase 2.5 levels must show up under the right chapters.
 */
describe("LevelsPage chapters", () => {
  it("renders Basics, Scaling, and Composition headings", () => {
    render(<LevelsPage />);
    expect(screen.getByRole("heading", { name: "Basics" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Scaling" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Composition" })).toBeTruthy();
  });

  it("includes the new Phase 2.5 level titles", () => {
    render(<LevelsPage />);
    expect(screen.getByText("Smooth the Burst")).toBeTruthy();
    expect(screen.getByText("Async Writes")).toBeTruthy();
    expect(screen.getByText("Shard the Database")).toBeTruthy();
    expect(screen.getByText("Read + Write Split")).toBeTruthy();
    expect(screen.getByText("Open Ended")).toBeTruthy();
  });

  it("locks chapters when the prior chapter has no completed levels", () => {
    // localStorage is empty in a fresh test → only Basics is unlocked.
    render(<LevelsPage />);
    const lockBadges = screen.getAllByText(/locked/);
    // Scaling + Composition + Reliability all locked initially.
    expect(lockBadges.length).toBe(3);
  });
});
