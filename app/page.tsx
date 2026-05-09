import Link from "next/link";

export default function Home() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "radial-gradient(circle at 20% 20%, #1f2937 0%, #0b1020 60%)",
        color: "#e5e7eb",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <main style={{ maxWidth: 720, textAlign: "center" }}>
        <div style={{ fontSize: 12, letterSpacing: 4, opacity: 0.6 }}>FLOW</div>
        <h1 style={{ fontSize: 56, fontWeight: 700, lineHeight: 1.05, margin: "16px 0 12px" }}>
          Learn system design by building it.
        </h1>
        <p style={{ fontSize: 18, opacity: 0.75, maxWidth: 540, margin: "0 auto 32px" }}>
          A level-based game where each challenge teaches a real distributed-systems
          concept. Drag components onto the canvas, wire them up, and watch traffic
          flow.
        </p>
        <Link
          href="/levels"
          style={{
            display: "inline-block",
            padding: "14px 28px",
            borderRadius: 999,
            background: "#34d399",
            color: "#0b1020",
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          Start playing →
        </Link>
      </main>
    </div>
  );
}
