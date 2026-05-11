// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GlossaryTerm } from "./GlossaryTerm";
import type { GlossaryEntry } from "@/lib/glossary/terms";

const mockEntry: GlossaryEntry = {
  term: "Load Balancer",
  definition: "Distributes requests across servers.",
  relevance: "Essential for horizontal scaling.",
  analogy: "Like a restaurant host seating guests.",
};

describe("GlossaryTerm", () => {
  it("renders the matched text", () => {
    render(<GlossaryTerm entry={mockEntry} matchedText="load balancer" />);
    expect(screen.getByText("load balancer")).toBeInTheDocument();
  });

  it("does not show tooltip initially", () => {
    render(<GlossaryTerm entry={mockEntry} matchedText="load balancer" />);
    expect(screen.queryByText("Distributes requests across servers.")).toBeNull();
  });

  it("shows tooltip on hover with definition, relevance, and analogy", () => {
    render(<GlossaryTerm entry={mockEntry} matchedText="load balancer" />);
    fireEvent.mouseEnter(screen.getByText("load balancer"));
    expect(screen.getByText("Load Balancer")).toBeInTheDocument();
    expect(screen.getByText("Distributes requests across servers.")).toBeInTheDocument();
    expect(screen.getByText("Essential for horizontal scaling.")).toBeInTheDocument();
    expect(screen.getByText(/Like a restaurant host/)).toBeInTheDocument();
  });

  it("hides tooltip on mouse leave (after delay)", async () => {
    render(<GlossaryTerm entry={mockEntry} matchedText="load balancer" />);
    fireEvent.mouseEnter(screen.getByText("load balancer"));
    expect(screen.getByText("Distributes requests across servers.")).toBeInTheDocument();
    fireEvent.mouseLeave(screen.getByText("load balancer"));
    // Tooltip has 150ms delay before hiding
    await new Promise((r) => setTimeout(r, 200));
    expect(screen.queryByText("Distributes requests across servers.")).toBeNull();
  });

  it("has correct aria-label for accessibility", () => {
    render(<GlossaryTerm entry={mockEntry} matchedText="load balancer" />);
    expect(screen.getByRole("button", { name: "Definition of Load Balancer" })).toBeInTheDocument();
  });

  it("works without an analogy", () => {
    const entryNoAnalogy: GlossaryEntry = {
      term: "Throughput",
      definition: "Requests per second.",
      relevance: "Measures capacity.",
    };
    render(<GlossaryTerm entry={entryNoAnalogy} matchedText="throughput" />);
    fireEvent.mouseEnter(screen.getByText("throughput"));
    expect(screen.getByText("Requests per second.")).toBeInTheDocument();
    expect(screen.queryByText("💡")).toBeNull();
  });
});
