"use client";

import { GlossaryPanelProvider } from "@/lib/glossary/usePanelStore";
import { GlossaryFab } from "@/components/glossary/GlossaryFab";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <GlossaryPanelProvider>
      {children}
      <GlossaryFab />
    </GlossaryPanelProvider>
  );
}
