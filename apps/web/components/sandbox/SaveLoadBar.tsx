"use client";

import { useCallback, useState } from "react";
import { color, fontFamily } from "@/lib/ui/theme";
import {
  listSandboxDesigns,
  loadSandboxDesign,
  saveSandboxDesign,
  deleteSandboxDesign,
} from "@/lib/storage/sandbox";
import type { Diagram } from "@flow/shared/types/diagram";

interface SaveLoadBarProps {
  currentName: string;
  onNameChange: (name: string) => void;
  diagram: Diagram;
  onLoad: (diagram: Diagram, name: string) => void;
  onNew: () => void;
}

type Dialog = "none" | "save-as" | "load";

export function SaveLoadBar({
  currentName,
  onNameChange,
  diagram,
  onLoad,
  onNew,
}: SaveLoadBarProps) {
  const [dialog, setDialog] = useState<Dialog>("none");
  const [saveAsName, setSaveAsName] = useState("");

  const handleSave = useCallback(() => {
    if (!currentName.trim()) {
      setDialog("save-as");
      setSaveAsName("");
      return;
    }
    saveSandboxDesign(currentName, diagram);
  }, [currentName, diagram]);

  const handleSaveAs = useCallback(() => {
    const name = saveAsName.trim();
    if (!name) return;
    saveSandboxDesign(name, diagram);
    onNameChange(name);
    setDialog("none");
  }, [saveAsName, diagram, onNameChange]);

  const handleLoadSelect = useCallback(
    (name: string) => {
      const loaded = loadSandboxDesign(name);
      if (loaded) {
        onLoad(loaded, name);
      }
      setDialog("none");
    },
    [onLoad],
  );

  const handleNew = useCallback(() => {
    const hasNodes = diagram.nodes.length > 0;
    if (hasNodes && !window.confirm("Start a new design? Unsaved changes will be lost.")) return;
    onNew();
  }, [diagram, onNew]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "6px 14px",
        borderBottom: `1px solid ${color.borderStrong}`,
        background: "rgba(14, 26, 43, 0.85)",
        fontFamily: fontFamily.mono,
        fontSize: 11,
        color: color.text,
        position: "relative",
      }}
    >
      <span style={{ color: color.textMuted, letterSpacing: 1 }}>DESIGN:</span>
      <span style={{ color: color.accent, fontWeight: 700, letterSpacing: 0.5 }}>
        {currentName || "Untitled"}
      </span>

      <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
        <BarButton onClick={handleNew}>New</BarButton>
        <BarButton onClick={handleSave}>Save</BarButton>
        <BarButton onClick={() => { setDialog("save-as"); setSaveAsName(currentName); }}>
          Save As
        </BarButton>
        <BarButton onClick={() => setDialog("load")}>Load</BarButton>
      </div>

      {dialog === "save-as" && (
        <DialogOverlay onClose={() => setDialog("none")}>
          <h3 style={dialogTitle}>Save As</h3>
          <input
            autoFocus
            type="text"
            placeholder="Design name"
            value={saveAsName}
            onChange={(e) => setSaveAsName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSaveAs(); }}
            style={inputStyle}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <BarButton onClick={handleSaveAs} accent>Save</BarButton>
            <BarButton onClick={() => setDialog("none")}>Cancel</BarButton>
          </div>
        </DialogOverlay>
      )}

      {dialog === "load" && (
        <DialogOverlay onClose={() => setDialog("none")}>
          <h3 style={dialogTitle}>Load Design</h3>
          <LoadList onSelect={handleLoadSelect} onClose={() => setDialog("none")} />
        </DialogOverlay>
      )}
    </div>
  );
}

function LoadList({ onSelect, onClose }: { onSelect: (name: string) => void; onClose: () => void }) {
  const [designs, setDesigns] = useState(() => listSandboxDesigns());

  if (designs.length === 0) {
    return (
      <div style={{ color: color.textMuted, fontSize: 12, padding: "8px 0" }}>
        No saved designs yet.
        <div style={{ marginTop: 10 }}>
          <BarButton onClick={onClose}>Close</BarButton>
        </div>
      </div>
    );
  }

  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0, maxHeight: 200, overflowY: "auto" }}>
      {designs.map((d) => (
        <li
          key={d.name}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 0",
            borderBottom: `1px dashed ${color.border}`,
          }}
        >
          <button
            onClick={() => onSelect(d.name)}
            style={{
              ...barBtnBase,
              flex: 1,
              textAlign: "left",
              color: color.accent,
            }}
          >
            {d.name}
          </button>
          <span style={{ fontSize: 9, color: color.textSubtle }}>
            {new Date(d.updatedAt).toLocaleDateString()}
          </span>
          <button
            onClick={() => {
              deleteSandboxDesign(d.name);
              setDesigns(listSandboxDesigns());
            }}
            style={{ ...barBtnBase, color: color.danger, fontSize: 10 }}
            title="Delete this design"
          >
            ✕
          </button>
        </li>
      ))}
    </ul>
  );
}

function DialogOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      style={{
        position: "absolute",
        top: "100%",
        right: 14,
        zIndex: 100,
        background: color.bgRaised,
        border: `1px solid ${color.borderStrong}`,
        padding: 16,
        minWidth: 260,
        boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
      }}
      onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}
    >
      {children}
    </div>
  );
}

const barBtnBase: React.CSSProperties = {
  background: "transparent",
  border: "none",
  cursor: "pointer",
  fontFamily: fontFamily.mono,
  fontSize: 11,
  letterSpacing: 1,
  padding: "4px 8px",
};

function BarButton({
  children,
  onClick,
  accent,
}: {
  children: React.ReactNode;
  onClick: () => void;
  accent?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...barBtnBase,
        color: accent ? color.accentInk : color.text,
        background: accent ? color.accent : "rgba(122, 223, 255, 0.08)",
        border: `1px solid ${accent ? color.accent : color.borderStrong}`,
        borderRadius: 2,
      }}
    >
      {children}
    </button>
  );
}

const dialogTitle: React.CSSProperties = {
  margin: "0 0 10px",
  fontFamily: fontFamily.display,
  fontSize: 14,
  letterSpacing: 1.5,
  textTransform: "uppercase",
  color: color.text,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  background: color.bg,
  border: `1px solid ${color.borderStrong}`,
  color: color.text,
  fontFamily: fontFamily.mono,
  fontSize: 12,
  outline: "none",
};
