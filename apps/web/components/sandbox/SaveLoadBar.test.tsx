import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SaveLoadBar } from "./SaveLoadBar";
import { saveSandboxDesign } from "@/lib/storage/sandbox";
import type { Diagram } from "@flow/shared/types/diagram";

const emptyDiagram: Diagram = { nodes: [], edges: [] };
const testDiagram: Diagram = {
  nodes: [{ id: "n1", kind: "server", position: { x: 0, y: 0 } }],
  edges: [],
};

describe("SaveLoadBar", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("displays current design name", () => {
    render(
      <SaveLoadBar
        currentName="My Design"
        onNameChange={vi.fn()}
        diagram={emptyDiagram}
        onLoad={vi.fn()}
        onNew={vi.fn()}
      />,
    );
    expect(screen.getByText("My Design")).toBeTruthy();
  });

  it("displays 'Untitled' when no name", () => {
    render(
      <SaveLoadBar
        currentName=""
        onNameChange={vi.fn()}
        diagram={emptyDiagram}
        onLoad={vi.fn()}
        onNew={vi.fn()}
      />,
    );
    expect(screen.getByText("Untitled")).toBeTruthy();
  });

  it("has New, Save, Save As, and Load buttons", () => {
    render(
      <SaveLoadBar
        currentName=""
        onNameChange={vi.fn()}
        diagram={emptyDiagram}
        onLoad={vi.fn()}
        onNew={vi.fn()}
      />,
    );
    expect(screen.getByText("New")).toBeTruthy();
    expect(screen.getByText("Save")).toBeTruthy();
    expect(screen.getByText("Save As")).toBeTruthy();
    expect(screen.getByText("Load")).toBeTruthy();
  });

  it("clicking Save when no name opens Save As dialog", () => {
    render(
      <SaveLoadBar
        currentName=""
        onNameChange={vi.fn()}
        diagram={emptyDiagram}
        onLoad={vi.fn()}
        onNew={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText("Save"));
    // Dialog should appear with a name input
    expect(screen.getByPlaceholderText("Design name")).toBeTruthy();
  });

  it("Save As dialog saves with entered name", () => {
    const onNameChange = vi.fn();
    render(
      <SaveLoadBar
        currentName=""
        onNameChange={onNameChange}
        diagram={testDiagram}
        onLoad={vi.fn()}
        onNew={vi.fn()}
      />,
    );
    // Open Save As
    fireEvent.click(screen.getAllByText("Save As")[0]);
    const input = screen.getByPlaceholderText("Design name");
    fireEvent.change(input, { target: { value: "Test Design" } });
    // Click Save inside the dialog
    fireEvent.click(screen.getAllByText("Save")[1]);
    expect(onNameChange).toHaveBeenCalledWith("Test Design");
    // Verify it was actually saved to localStorage
    expect(localStorage.getItem("flow:sandbox:Test Design")).toBeTruthy();
  });

  it("clicking Load shows the load list", () => {
    saveSandboxDesign("saved-one", testDiagram);
    render(
      <SaveLoadBar
        currentName=""
        onNameChange={vi.fn()}
        diagram={emptyDiagram}
        onLoad={vi.fn()}
        onNew={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText("Load"));
    expect(screen.getByText("Load Design")).toBeTruthy();
    expect(screen.getByText("saved-one")).toBeTruthy();
  });

  it("selecting a design from load list calls onLoad", () => {
    saveSandboxDesign("design-a", testDiagram);
    const onLoad = vi.fn();
    render(
      <SaveLoadBar
        currentName=""
        onNameChange={vi.fn()}
        diagram={emptyDiagram}
        onLoad={onLoad}
        onNew={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText("Load"));
    fireEvent.click(screen.getByText("design-a"));
    expect(onLoad).toHaveBeenCalledWith(testDiagram, "design-a");
  });

  it("New button calls onNew for empty diagrams", () => {
    const onNew = vi.fn();
    render(
      <SaveLoadBar
        currentName="x"
        onNameChange={vi.fn()}
        diagram={emptyDiagram}
        onLoad={vi.fn()}
        onNew={onNew}
      />,
    );
    fireEvent.click(screen.getByText("New"));
    expect(onNew).toHaveBeenCalled();
  });

  it("New button confirms when diagram has nodes", () => {
    const onNew = vi.fn();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(
      <SaveLoadBar
        currentName="x"
        onNameChange={vi.fn()}
        diagram={testDiagram}
        onLoad={vi.fn()}
        onNew={onNew}
      />,
    );
    fireEvent.click(screen.getByText("New"));
    expect(window.confirm).toHaveBeenCalled();
    expect(onNew).toHaveBeenCalled();
  });

  it("New button does not call onNew if confirm is cancelled", () => {
    const onNew = vi.fn();
    vi.spyOn(window, "confirm").mockReturnValue(false);
    render(
      <SaveLoadBar
        currentName="x"
        onNameChange={vi.fn()}
        diagram={testDiagram}
        onLoad={vi.fn()}
        onNew={onNew}
      />,
    );
    fireEvent.click(screen.getByText("New"));
    expect(onNew).not.toHaveBeenCalled();
  });

  it("shows empty state when no saved designs in load dialog", () => {
    render(
      <SaveLoadBar
        currentName=""
        onNameChange={vi.fn()}
        diagram={emptyDiagram}
        onLoad={vi.fn()}
        onNew={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText("Load"));
    expect(screen.getByText("No saved designs yet.")).toBeTruthy();
  });
});
