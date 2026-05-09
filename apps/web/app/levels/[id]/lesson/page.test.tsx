import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import LessonPage from "./page";

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "05-smooth-the-burst" }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

describe("LessonPage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    cleanup();
  });

  it("renders the level title, tagline, and section headings", () => {
    render(<LessonPage />);
    // title comes from the level
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/burst/i);
    // at least one section heading
    expect(screen.getAllByRole("heading", { level: 2 }).length).toBeGreaterThan(0);
  });

  it("renders a 'Start exercise' link to the play page", () => {
    render(<LessonPage />);
    const link = screen.getByRole("link", { name: /start exercise/i });
    expect(link).toHaveAttribute("href", "/levels/05-smooth-the-burst/play");
  });

  it("marks the lesson as seen on mount", async () => {
    render(<LessonPage />);
    // useEffect runs after render
    await new Promise((r) => setTimeout(r, 0));
    const raw = window.localStorage.getItem("flow.lessonsSeen.v1");
    expect(raw).toContain("05-smooth-the-burst");
  });

  it("renders the cheatsheet when present", () => {
    render(<LessonPage />);
    expect(screen.getByText(/cheatsheet/i)).toBeInTheDocument();
  });
});
