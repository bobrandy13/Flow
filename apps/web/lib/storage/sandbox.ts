import type { Diagram } from "@flow/shared/types/diagram";

const PREFIX = "flow:sandbox:";

export interface SavedDesign {
  name: string;
  diagram: Diagram;
  updatedAt: string;
}

/** List all saved sandbox designs (sorted by most recently updated). */
export function listSandboxDesigns(): Array<{ name: string; updatedAt: string }> {
  if (typeof window === "undefined") return [];
  const results: Array<{ name: string; updatedAt: string }> = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith(PREFIX)) continue;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as { updatedAt?: string };
      results.push({
        name: key.slice(PREFIX.length),
        updatedAt: parsed.updatedAt ?? "",
      });
    } catch {
      // Skip malformed entries.
    }
  }
  return results.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/** Load a specific sandbox design by name. Returns null if not found. */
export function loadSandboxDesign(name: string): Diagram | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PREFIX + name);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedDesign;
    return parsed.diagram ?? null;
  } catch {
    return null;
  }
}

/** Save a sandbox design by name. Overwrites if exists. */
export function saveSandboxDesign(name: string, diagram: Diagram): void {
  if (typeof window === "undefined") return;
  const entry: SavedDesign = {
    name,
    diagram,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(PREFIX + name, JSON.stringify(entry));
}

/** Delete a sandbox design by name. */
export function deleteSandboxDesign(name: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PREFIX + name);
}
