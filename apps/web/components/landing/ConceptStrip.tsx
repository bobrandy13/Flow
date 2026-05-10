import { color, radius } from "@/lib/ui/theme";

/**
 * Three-step concept teaser shown below the hero on the landing page.
 * Pure presentational — no state, no interactivity.
 */
export function ConceptStrip() {
  const steps: Array<{ icon: string; title: string; body: string }> = [
    {
      icon: "🎛️",
      title: "1. Drag components",
      body: "Pull clients, servers, queues, caches, databases onto the canvas.",
    },
    {
      icon: "🔌",
      title: "2. Wire them up",
      body: "Connect the nodes. The graph is your system architecture.",
    },
    {
      icon: "▶️",
      title: "3. Run the sim",
      body: "Watch real traffic flow through. Find the bottleneck. Iterate.",
    },
  ];
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: 16,
        marginTop: 40,
      }}
    >
      {steps.map((s) => (
        <div
          key={s.title}
          style={{
            background: color.bgRaisedSoft,
            border: `1px solid ${color.border}`,
            borderRadius: radius.lg,
            padding: 18,
            textAlign: "left",
          }}
        >
          <div style={{ fontSize: 22, marginBottom: 8 }} aria-hidden="true">
            {s.icon}
          </div>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
            {s.title}
          </div>
          <div style={{ fontSize: 12, opacity: 0.7, lineHeight: 1.5 }}>{s.body}</div>
        </div>
      ))}
    </div>
  );
}
