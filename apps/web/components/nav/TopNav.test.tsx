import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { TopNav } from "./TopNav";

vi.mock("next/navigation", () => ({
  usePathname: () => "/levels",
}));

describe("TopNav", () => {
  beforeEach(() => {
    if (typeof window !== "undefined") window.localStorage.clear();
  });

  it("renders Flow wordmark, Drawings link, and progress widget", () => {
    render(<TopNav />);
    expect(screen.getByRole("link", { name: /Flow home/i })).toBeTruthy();
    expect(screen.getByRole("link", { name: /Drawings/i })).toBeTruthy();
    // Progress widget shows "00 / N" on a fresh slate.
    expect(screen.getByTitle(/of \d+ levels completed/)).toBeTruthy();
  });

  it("marks the active route with aria-current=page", () => {
    render(<TopNav />);
    const drawingsLink = screen.getByRole("link", { name: /Drawings/i });
    expect(drawingsLink.getAttribute("aria-current")).toBe("page");
  });
});

describe("TopNav on play page", () => {
  it("hides itself when the current path is a /play route", async () => {
    vi.resetModules();
    vi.doMock("next/navigation", () => ({
      usePathname: () => "/levels/01-hello-server/play",
    }));
    const { TopNav: TopNavOnPlay } = await import("./TopNav");
    const { container } = render(<TopNavOnPlay />);
    expect(container.firstChild).toBeNull();
  });
});
