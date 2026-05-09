"use client";

import { COMPONENT_SPECS } from "@flow/shared/engine/component-specs";
import {
  KIND_EXPLAINERS,
  formatLatency,
  formatCapacity,
} from "@flow/shared/engine/units";
import type { ComponentKind } from "@flow/shared/types/components";
import { InfoTooltip } from "@/components/ui/InfoTooltip";

interface ComponentInfoCardProps {
  kind: ComponentKind;
  /** When true, render a compact one-line variant suitable for tooltips. */
  compact?: boolean;
}

/**
 * Plain-English information card for a component kind. Shown in the inspector
 * when a node is selected and inside palette hover-popovers, so beginners
 * always have a way to learn what each component is and what its numbers mean.
 */
export function ComponentInfoCard({ kind, compact = false }: ComponentInfoCardProps) {
  const spec = COMPONENT_SPECS[kind];
  const explainer = KIND_EXPLAINERS[kind];
  const latency = formatLatency(spec.baseLatency);
  const capacity = formatCapacity(spec);

  if (compact) {
    return (
      <div style={{ fontSize: 12, lineHeight: 1.4 }}>
        <div style={{ fontWeight: 700, marginBottom: 2 }}>
          {spec.emoji} {spec.label}
        </div>
        <div style={{ opacity: 0.85 }}>{explainer.one_liner}</div>
      </div>
    );
  }

  return (
    <div style={{ fontSize: 12, lineHeight: 1.5 }}>
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
        {spec.emoji} {spec.label}
      </div>
      <div style={{ opacity: 0.85, marginBottom: 8 }}>{explainer.what_it_does}</div>
      <div style={{ opacity: 0.6, fontStyle: "italic", marginBottom: 10 }}>
        {explainer.analogy}
      </div>

      <SpecRow
        label="Latency"
        primary={latency.primary}
        tip={`How long this component spends handling each request. ${latency.secondary} in simulation time. Jitter ±${Math.round(spec.jitter * 100)}% adds realistic variation.`}
      />
      <SpecRow
        label="Capacity"
        primary={capacity.primary}
        tip={`Max requests this component can work on at the same time. ${capacity.secondary}, derived from capacity ÷ latency. If more requests arrive than this, they get dropped.`}
      />
    </div>
  );
}

function SpecRow({ label, primary, tip }: { label: string; primary: string; tip: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 4,
      }}
    >
      <InfoTooltip tip={tip}>
        <span style={{ opacity: 0.6 }}>{label}</span>
      </InfoTooltip>
      <span style={{ fontWeight: 600 }}>{primary}</span>
    </div>
  );
}
