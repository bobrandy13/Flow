"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface PanelStore {
  isOpen: boolean;
  activeTerm: string | null;
  open: (termKey?: string) => void;
  close: () => void;
  toggle: () => void;
}

const GlossaryPanelContext = createContext<PanelStore | null>(null);

export const GlossaryPanelProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTerm, setActiveTerm] = useState<string | null>(null);

  const open = (termKey?: string) => {
    setIsOpen(true);
    setActiveTerm(termKey ?? null);
  };

  const close = () => {
    setIsOpen(false);
  };

  const toggle = () => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "g") return;
      const el = document.activeElement;
      if (!el) return;
      const tag = el.tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        (el as HTMLElement).contentEditable === "true"
      ) {
        return;
      }
      toggle();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // toggle is recreated each render; use isOpen directly to avoid stale closure
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const store: PanelStore = { isOpen, activeTerm, open, close, toggle };

  return React.createElement(GlossaryPanelContext.Provider, { value: store }, children);
};

export function useGlossaryPanel(): PanelStore {
  const ctx = useContext(GlossaryPanelContext);
  if (!ctx) {
    throw new Error("useGlossaryPanel must be used inside <GlossaryPanelProvider>");
  }
  return ctx;
}
