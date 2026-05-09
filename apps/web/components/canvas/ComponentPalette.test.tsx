import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ComponentPalette } from "./ComponentPalette";
import { PALETTE_DRAG_MIME } from "./DiagramCanvas";

/**
 * Regression: the palette must initiate an HTML5 drag carrying the component
 * kind under the agreed MIME type so the canvas drop handler can recognise it.
 * If this contract breaks, drag-from-palette silently stops working.
 */
describe("ComponentPalette drag-and-drop", () => {
  function buildDataTransfer() {
    const store = new Map<string, string>();
    return {
      setData: vi.fn((type: string, value: string) => {
        store.set(type, value);
      }),
      getData: (type: string) => store.get(type) ?? "",
      types: [] as string[],
      effectAllowed: "" as string,
    };
  }

  it("renders one draggable button per allowed kind", () => {
    render(<ComponentPalette allowed={["client", "server"]} onAdd={() => {}} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(2);
    for (const b of buttons) expect(b).toHaveAttribute("draggable", "true");
  });

  it("onDragStart writes the kind under PALETTE_DRAG_MIME", () => {
    render(<ComponentPalette allowed={["server"]} onAdd={() => {}} />);
    const button = screen.getByRole("button", { name: /server/i });
    const dt = buildDataTransfer();
    fireEvent.dragStart(button, { dataTransfer: dt });
    expect(dt.setData).toHaveBeenCalledWith(PALETTE_DRAG_MIME, "server");
    expect(dt.effectAllowed).toBe("move");
  });

  it("click still calls onAdd as a keyboard / a11y fallback", () => {
    const onAdd = vi.fn();
    render(<ComponentPalette allowed={["database"]} onAdd={onAdd} />);
    fireEvent.click(screen.getByRole("button", { name: /database/i }));
    expect(onAdd).toHaveBeenCalledWith("database");
  });
});
