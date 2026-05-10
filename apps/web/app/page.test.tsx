import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Home from "./page";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

describe("Home (landing) page", () => {
  it("shows the hero, primary CTA, and concept teaser steps", () => {
    if (typeof window !== "undefined") window.localStorage.clear();
    render(<Home />);
    expect(
      screen.getByRole("heading", { name: /Learn system design/i }),
    ).toBeTruthy();
    // Context-aware CTA on a fresh slate is "Start your first level".
    const cta = screen.getByRole("link", { name: /Start your first level/i });
    expect(cta).toBeTruthy();
    expect(cta.getAttribute("href")).toMatch(/^\/levels\/.+\/lesson$/);
    // The three blueprint construction-schedule steps are present.
    expect(screen.getByText(/PLACE COMPONENTS/i)).toBeTruthy();
    expect(screen.getByText(/WIRE THE CIRCUIT/i)).toBeTruthy();
    expect(screen.getByText(/RUN THE SIMULATION/i)).toBeTruthy();
  });

  it("renders the inline animated preview as accessible SVG", () => {
    render(<Home />);
    const preview = screen.getByRole("img", { name: /Animated preview/i });
    expect(preview.tagName.toLowerCase()).toBe("svg");
  });

  it("has a secondary 'Browse all levels' link", () => {
    render(<Home />);
    expect(screen.getByRole("link", { name: /Browse all levels/i })).toBeTruthy();
  });
});
