import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ComponentInfoCard } from "./ComponentInfoCard";
import { COMPONENT_SPECS } from "@flow/shared/engine/component-specs";

describe("ComponentInfoCard", () => {
  it("renders ms-first latency and ticks in tooltip", () => {
    render(<ComponentInfoCard kind="server" />);
    const expectedMs = COMPONENT_SPECS.server.baseLatency * 10;
    expect(screen.getByText(`${expectedMs} ms`)).toBeTruthy();
    // Tooltip text contains "ticks" reference
    expect(screen.getByText(/ticks/i)).toBeTruthy();
  });

  it("renders capacity as 'N concurrent' with req/s in tooltip", () => {
    render(<ComponentInfoCard kind="server" />);
    expect(screen.getByText(`${COMPONENT_SPECS.server.capacity} concurrent`)).toBeTruthy();
    expect(screen.getByText(/req\/s/i)).toBeTruthy();
  });

  it("renders an explainer paragraph + analogy", () => {
    render(<ComponentInfoCard kind="cache" />);
    expect(screen.getByText(/sits in front of slower storage/i)).toBeTruthy();
    expect(screen.getByText(/Think:/i)).toBeTruthy();
  });

  it("compact mode shows only the one-liner", () => {
    render(<ComponentInfoCard kind="database" compact />);
    expect(screen.getByText(/Stores data durably/i)).toBeTruthy();
    // No latency rows in compact mode
    expect(screen.queryByText(/Latency/i)).toBeNull();
  });
});
