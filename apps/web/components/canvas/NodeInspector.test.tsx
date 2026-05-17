import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NodeInspector } from "./NodeInspector";
import type { Diagram } from "@flow/shared/types/diagram";

const diagram: Diagram = {
  nodes: [{ id: "db", kind: "database", position: { x: 0, y: 0 } }],
  edges: [],
};

describe("NodeInspector replication controls", () => {
  it("does not allow database replication past the level max", () => {
    const onChange = vi.fn();

    render(
      <NodeInspector
        diagram={diagram}
        selectedNodeId="db"
        maxOf={{ database: 1 }}
        onChange={onChange}
      />,
    );

    const button = screen.getByRole("button", { name: /database replica limit reached/i });
    expect(button).toBeDisabled();
    expect(screen.getByText(/this level allows 1 database node/i)).toBeInTheDocument();

    fireEvent.click(button);

    expect(onChange).not.toHaveBeenCalled();
  });

  it("allows database replication when the level has room for another database", () => {
    const onChange = vi.fn();

    render(
      <NodeInspector
        diagram={diagram}
        selectedNodeId="db"
        maxOf={{ database: 2 }}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /replicate database/i }));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        nodes: expect.arrayContaining([
          expect.objectContaining({ id: "db", role: "primary" }),
          expect.objectContaining({ kind: "database", role: "replica" }),
        ]),
      }),
    );
  });
});
