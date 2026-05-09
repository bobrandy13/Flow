"use client";

import { useEffect, useRef, useState } from "react";
import { useReactFlow, useViewport, type ReactFlowState, useStore } from "@xyflow/react";
import type { EdgeTransition } from "@flow/shared/types/validation";

interface ParticleLayerProps {
  /** Latest tick's transitions; particles are spawned each time this changes identity. */
  transitions: EdgeTransition[] | undefined;
  /** Wall-clock ms each particle takes to traverse src → dst. */
  durationMs?: number;
}

interface Particle {
  id: number;
  edgeId: string;
  fromNodeId: string;
  toNodeId: string;
  direction: "forward" | "return";
  spawnedAt: number;
  duration: number;
}

const MAX_PARTICLES = 120;
const FORWARD_COLOR = "#60a5fa";
const RETURN_COLOR = "#34d399";
/** Perpendicular offset (in flow units) between forward/return lanes. */
const LANE_OFFSET = 7;
let nextParticleId = 1;

const internalsSelector = (s: ReactFlowState) => s.nodeLookup;

/**
 * Renders moving SVG dots along edges as the simulation runs.
 *
 * Geometry: dots ride the EXACT bezier path React Flow already drew, by
 * querying the rendered <path class="react-flow__edge-path"> via DOM and
 * sampling it with getPointAtLength(). Tangent-based perpendicular offset
 * puts forward (request) particles on one side of the curve and return
 * (response) particles on the other.
 *
 * Performance: positions are mutated directly on circle DOM nodes inside the
 * rAF loop — no React state per frame. State only updates when the set of
 * live particles changes (spawn / batch cleanup), which happens at most once
 * per simulation tick.
 */
export function ParticleLayer({ transitions, durationMs = 600 }: ParticleLayerProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const elRefs = useRef<Map<number, SVGCircleElement | null>>(new Map());
  const svgRef = useRef<SVGSVGElement | null>(null);
  const viewport = useViewport();
  const nodeLookup = useStore(internalsSelector);
  const rf = useReactFlow();

  // We pass viewport via a ref so the rAF loop can read the latest values
  // without re-running its effect on every pan/zoom (which would tear down
  // and rebuild the loop on every wheel tick).
  const viewportRef = useRef(viewport);
  useEffect(() => {
    viewportRef.current = viewport;
  }, [viewport]);

  // Spawn new particles whenever a fresh batch of transitions arrives.
  // We intentionally setState in this effect body — particles are derived from
  // a streaming input and we need to merge live ones with new arrivals.
  useEffect(() => {
    if (!transitions || transitions.length === 0) return;
    const t0 = performance.now();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setParticles((prev) => {
      const live = prev.filter((p) => t0 - p.spawnedAt < p.duration);
      const room = MAX_PARTICLES - live.length;
      if (room <= 0) return live;
      const added: Particle[] = transitions.slice(0, room).map((t) => ({
        id: nextParticleId++,
        edgeId: t.edgeId,
        fromNodeId: t.fromNodeId,
        toNodeId: t.toNodeId,
        direction: t.direction,
        spawnedAt: t0,
        duration: durationMs,
      }));
      return [...live, ...added];
    });
  }, [transitions, durationMs]);

  // Drive imperative position updates. Re-runs only when the SET of particles
  // changes (spawn / cleanup), not every frame.
  useEffect(() => {
    if (particles.length === 0) return;
    let raf = 0;
    const svgRoot = svgRef.current?.ownerDocument ?? document;

    // Cache the path element per edgeId for the lifetime of this effect.
    // React Flow re-uses the same <path> across renders unless the edge is
    // removed, so this lookup is amortized.
    const pathCache = new Map<string, SVGPathElement | null>();
    const lookupPath = (edgeId: string): SVGPathElement | null => {
      if (pathCache.has(edgeId)) return pathCache.get(edgeId) ?? null;
      // Synthetic transitions (no real edge) won't resolve — they fall back
      // to straight-line interpolation in step().
      const el = svgRoot.querySelector<SVGPathElement>(
        `g.react-flow__edge[data-id="${cssEscape(edgeId)}"] path.react-flow__edge-path`,
      );
      pathCache.set(edgeId, el ?? null);
      return el ?? null;
    };

    // Resolve node centers in flow coords (used for synthetic-edge fallback).
    const center = (nodeId: string): { x: number; y: number } | null => {
      const internal = nodeLookup.get(nodeId);
      if (internal) {
        const w = internal.measured?.width ?? 120;
        const h = internal.measured?.height ?? 60;
        return { x: internal.position.x + w / 2, y: internal.position.y + h / 2 };
      }
      const n = rf.getNode(nodeId);
      if (!n) return null;
      return {
        x: n.position.x + ((n as { width?: number }).width ?? 120) / 2,
        y: n.position.y + ((n as { height?: number }).height ?? 60) / 2,
      };
    };

    let needsCleanup = false;

    const step = () => {
      const now = performance.now();
      const vp = viewportRef.current;
      const z = vp.zoom;
      const ox = vp.x;
      const oy = vp.y;

      let stillAlive = false;

      for (const p of particles) {
        const el = elRefs.current.get(p.id);
        if (!el) continue;
        const elapsed = now - p.spawnedAt;
        if (elapsed >= p.duration) {
          if (el.style.display !== "none") {
            el.style.display = "none";
            needsCleanup = true;
          }
          continue;
        }
        stillAlive = true;
        const t = elapsed / p.duration;
        // Return particles travel BACKWARD along the same path the forward
        // request took (we still draw on the same edge, just reverse-parametrised).
        const tParam = p.direction === "forward" ? t : 1 - t;

        const path = lookupPath(p.edgeId);
        let fx: number, fy: number;
        if (path) {
          const len = path.getTotalLength();
          const at = tParam * len;
          const pt = path.getPointAtLength(at);
          // Tangent via finite-difference for the perpendicular offset.
          const eps = 1.0;
          const ahead = path.getPointAtLength(Math.min(len, at + eps));
          const tx = ahead.x - pt.x;
          const ty = ahead.y - pt.y;
          const tlen = Math.hypot(tx, ty) || 1;
          // Perpendicular unit vector. Forward goes one side, return the other,
          // BUT remember return is moving along path "backwards" (decreasing t),
          // so its tangent is reversed → flipping the lane sign keeps return
          // visually offset to the opposite side of the underlying edge.
          const lane = p.direction === "forward" ? 1 : -1;
          const px = (-ty / tlen) * LANE_OFFSET * lane;
          const py = (tx / tlen) * LANE_OFFSET * lane;
          fx = pt.x + px;
          fy = pt.y + py;
        } else {
          // Fallback: straight line between node centers (synthetic edges, or
          // edge not yet in the DOM on first frame).
          const fromId = p.direction === "forward" ? p.fromNodeId : p.toNodeId;
          const toId = p.direction === "forward" ? p.toNodeId : p.fromNodeId;
          const from = center(fromId);
          const to = center(toId);
          if (!from || !to) continue;
          const dx = to.x - from.x;
          const dy = to.y - from.y;
          const len = Math.hypot(dx, dy) || 1;
          const lane = p.direction === "forward" ? 1 : -1;
          const px = (-dy / len) * LANE_OFFSET * lane;
          const py = (dx / len) * LANE_OFFSET * lane;
          fx = from.x + dx * t + px;
          fy = from.y + dy * t + py;
        }

        // Convert flow coords → screen coords for our viewport-overlay SVG.
        const sx = fx * z + ox;
        const sy = fy * z + oy;
        el.setAttribute("cx", String(sx));
        el.setAttribute("cy", String(sy));
        if (t > 0.85) {
          el.setAttribute("opacity", String(((1 - t) / 0.15).toFixed(3)));
        } else if (el.getAttribute("opacity") !== "1") {
          el.setAttribute("opacity", "1");
        }
      }

      if (stillAlive) {
        raf = requestAnimationFrame(step);
      } else if (needsCleanup) {
        // Drop expired particles from React state so DOM nodes get released.
        const cutoff = performance.now();
        setParticles((prev) => prev.filter((p) => cutoff - p.spawnedAt < p.duration));
      }
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [particles, nodeLookup, rf]);

  // Clean up stale entries in the ref map when particle list shrinks.
  useEffect(() => {
    const live = new Set(particles.map((p) => p.id));
    for (const id of elRefs.current.keys()) {
      if (!live.has(id)) elRefs.current.delete(id);
    }
  }, [particles]);

  return (
    <svg
      ref={svgRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        overflow: "visible",
        zIndex: 4,
      }}
      aria-hidden="true"
    >
      {particles.map((p) => {
        const color = p.direction === "forward" ? FORWARD_COLOR : RETURN_COLOR;
        const glow = p.direction === "forward"
          ? "drop-shadow(0 0 4px rgba(96,165,250,0.8))"
          : "drop-shadow(0 0 4px rgba(52,211,153,0.8))";
        return (
          <circle
            key={p.id}
            ref={(el) => { elRefs.current.set(p.id, el); }}
            r={4}
            fill={color}
            opacity={1}
            style={{ filter: glow }}
          />
        );
      })}
    </svg>
  );
}

/** Conservative CSS attribute-selector escaper for edge IDs (which may
 *  contain quotes, brackets, or other CSS-special characters). */
function cssEscape(s: string): string {
  // Native CSS.escape exists in all modern browsers; fall back to a regex
  // that escapes the characters we actually expect to encounter in edge IDs.
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(s);
  }
  return s.replace(/(["\\\[\]])/g, "\\$1");
}
