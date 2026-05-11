import { color, fontFamily } from "@/lib/ui/theme";

/**
 * Three-step "construction schedule" rendered as numbered drawing-sheet
 * rows. Pure presentational — no state.
 */
export function ConceptStrip() {
  const steps: Array<{ no: string; title: string; body: string }> = [
    {
      no: "01",
      title: "PLACE COMPONENTS",
      body: "Drop clients, servers, queues, caches, and databases onto the sheet.",
    },
    {
      no: "02",
      title: "WIRE THE CIRCUIT",
      body: "Connect the nodes. The graph is your system architecture.",
    },
    {
      no: "03",
      title: "RUN THE SIMULATION",
      body: "Watch real traffic flow. Find the bottleneck. Iterate.",
    },
  ];
  return (
    <section
      aria-label="How it works"
      className="flow-panel"
      style={{
        marginTop: 40,
        position: "relative",
      }}
    >
      <CornerBrackets />
      <div
        style={{
          padding: "8px 14px",
          borderBottom: `1px solid ${color.borderStrong}`,
          fontFamily: fontFamily.mono,
          fontSize: 10,
          letterSpacing: 2,
          color: color.accent,
          textTransform: "uppercase",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>HOW IT WORKS</span>
        <span style={{ opacity: 0.6 }}>STEP 00 / 03</span>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        }}
      >
        {steps.map((s, i) => (
          <div
            key={s.title}
            style={{
              padding: 18,
              textAlign: "left",
              borderRight:
                i < steps.length - 1 ? `1px dashed ${color.border}` : "none",
            }}
          >
            <div
              style={{
                fontFamily: fontFamily.mono,
                fontSize: 11,
                color: color.accent,
                marginBottom: 6,
                letterSpacing: 1,
              }}
            >
              STEP {s.no}
            </div>
            <div
              style={{
                fontFamily: fontFamily.display,
                fontWeight: 700,
                fontSize: 15,
                letterSpacing: 1.5,
                marginBottom: 6,
                color: color.text,
              }}
            >
              {s.title}
            </div>
            <div style={{ fontSize: 13, color: color.textMuted, lineHeight: 1.55 }}>
              {s.body}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Four small CAD-style corner brackets, positioned at the panel corners. */
function CornerBrackets() {
  const arm = 10;
  const stroke = `1px solid ${color.accent}`;
  const off = -1;
  const base = { position: "absolute" as const, width: arm, height: arm, opacity: 0.7 };
  return (
    <>
      <span style={{ ...base, top: off, left: off, borderTop: stroke, borderLeft: stroke }} aria-hidden="true" />
      <span style={{ ...base, top: off, right: off, borderTop: stroke, borderRight: stroke }} aria-hidden="true" />
      <span style={{ ...base, bottom: off, left: off, borderBottom: stroke, borderLeft: stroke }} aria-hidden="true" />
      <span style={{ ...base, bottom: off, right: off, borderBottom: stroke, borderRight: stroke }} aria-hidden="true" />
    </>
  );
}
