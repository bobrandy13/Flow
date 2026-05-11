import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import SandboxPage from "./page";

describe("SandboxPage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders the Sandbox heading", () => {
    render(<SandboxPage />);
    expect(screen.getByRole("heading", { name: /Sandbox/i })).toBeTruthy();
  });

  it("shows the free-form design subtitle", () => {
    render(<SandboxPage />);
    expect(screen.getByText(/FREE-FORM DESIGN/)).toBeTruthy();
  });

  it("renders the Run Simulation button", () => {
    render(<SandboxPage />);
    expect(screen.getAllByText(/Run Simulation/).length).toBeGreaterThan(0);
  });

  it("renders the Reset button", () => {
    render(<SandboxPage />);
    expect(screen.getByText("↺ Reset")).toBeTruthy();
  });

  it("renders the SaveLoadBar with Untitled", () => {
    render(<SandboxPage />);
    expect(screen.getByText("Untitled")).toBeTruthy();
  });

  it("has Save, Load, New buttons from SaveLoadBar", () => {
    render(<SandboxPage />);
    expect(screen.getByText("Save")).toBeTruthy();
    expect(screen.getByText("Load")).toBeTruthy();
    expect(screen.getByText("New")).toBeTruthy();
  });

  it("does not render a Validate button (no rules in sandbox)", () => {
    render(<SandboxPage />);
    // There should be no button with "Validate" text
    const btns = screen.queryAllByRole("button");
    const validateBtn = btns.find((b) => b.textContent?.includes("Validate"));
    expect(validateBtn).toBeUndefined();
  });

  it("renders the component palette (all component types available)", () => {
    render(<SandboxPage />);
    // Check for at least a few component types rendered in the palette
    expect(screen.getByText("Server")).toBeTruthy();
    expect(screen.getByText("Database")).toBeTruthy();
    expect(screen.getByText("Cache")).toBeTruthy();
    expect(screen.getByText("Queue")).toBeTruthy();
  });
});
