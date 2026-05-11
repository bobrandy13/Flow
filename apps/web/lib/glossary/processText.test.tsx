// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { processGlossaryText } from "./processText";

describe("processGlossaryText", () => {
  it("returns plain string when no glossary terms are present", () => {
    const result = processGlossaryText("Hello world, nothing special here.");
    expect(result).toBe("Hello world, nothing special here.");
  });

  it("wraps a known term in a GlossaryTerm component", () => {
    const { container } = render(<>{processGlossaryText("A load balancer distributes traffic.")}</>);
    const term = container.querySelector(".glossary-term");
    expect(term).not.toBeNull();
    expect(term!.textContent).toMatch(/load balancer/i);
  });

  it("only highlights the first occurrence of a term", () => {
    const { container } = render(
      <>{processGlossaryText("A queue feeds another queue for buffering.")}</>,
    );
    const terms = container.querySelectorAll(".glossary-term");
    expect(terms.length).toBe(1);
  });

  it("handles multiple different terms in one text", () => {
    const { container } = render(
      <>{processGlossaryText("Use sharding and replication for scale.")}</>,
    );
    const terms = container.querySelectorAll(".glossary-term");
    expect(terms.length).toBe(2);
  });

  it("preserves surrounding text", () => {
    const { container } = render(
      <>{processGlossaryText("Before latency after")}</>,
    );
    expect(container.textContent).toBe("Before latency after");
  });

  it("handles empty string", () => {
    expect(processGlossaryText("")).toBe("");
  });
});
