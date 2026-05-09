import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ReactFlowProvider } from "@xyflow/react";
import { ComponentNode } from "./ComponentNode";

/**
 * Region pill on the canvas node:
 *   - present and shows the region label when a region is set,
 *   - completely absent when region is undefined (so single-region levels are
 *     visually identical to before).
 *
 * This is the visual-side counterpart to the engine's region tests.
 */
describe("ComponentNode region pill", () => {
  function renderNode(region?: string) {
    const props = {
      id: "x",
      data: { kind: "server", region },
      type: "component",
      selected: false,
      dragging: false,
      isConnectable: false,
      zIndex: 0,
      positionAbsoluteX: 0,
      positionAbsoluteY: 0,
      selectable: true,
      deletable: true,
      draggable: true,
    };
    return render(
      <ReactFlowProvider>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <ComponentNode {...(props as any)} />
      </ReactFlowProvider>,
    );
  }

  it("renders the region pill when region is set", () => {
    const { getByLabelText } = renderNode("eu-west");
    const pill = getByLabelText("region eu-west");
    expect(pill.textContent).toMatch(/EU-West/i);
  });

  it("does not render any region pill when region is undefined", () => {
    const { queryByLabelText } = renderNode(undefined);
    expect(queryByLabelText(/^region /)).toBeNull();
  });

  it("does not render a pill for an unknown region string (defensive)", () => {
    const { queryByLabelText } = renderNode("mars-1");
    expect(queryByLabelText(/^region /)).toBeNull();
  });
});
