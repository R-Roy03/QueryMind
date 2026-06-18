import { ArrowRight } from "lucide-react";

export default function LineageView({ pipelineData }) {
  if (!pipelineData || !pipelineData.nodes) {
    return (
      <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: 14 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
          <div>Build a pipeline to see data lineage</div>
        </div>
      </div>
    );
  }

  const sources = pipelineData.nodes.filter((n) => (n.type || "").toLowerCase() === "source");
  const transforms = pipelineData.nodes.filter((n) => (n.type || "").toLowerCase() === "transform");
  const sinks = pipelineData.nodes.filter((n) => (n.type || "").toLowerCase() === "sink");

  const renderCards = (nodes, color, borderColor) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {nodes.map((n) => (
        <div key={n.id} style={{ padding: "10px 14px", background: "var(--bg-card)", border: `1px solid ${borderColor}`, borderRadius: 10, minWidth: 160 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color, fontFamily: "var(--font-mono)" }}>{n.label}</div>
          {(n.operation || n.table || n.destination) && (
            <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>{n.operation || n.table || n.destination}</div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 32, padding: 24, border: "1px solid var(--border-dim)", borderRadius: 12, background: "var(--bg-surface)" }}>
      {/* Sources */}
      <div>
        <div style={{ fontSize: 9, color: "var(--blue-light)", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Sources</div>
        {renderCards(sources.length ? sources : [{ id: "s", label: "—" }], "var(--blue-light)", "rgba(67,97,238,0.3)")}
      </div>

      <ArrowRight size={20} color="var(--text-faint)" />

      {/* Transforms */}
      <div>
        <div style={{ fontSize: 9, color: "#a78bfa", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Transforms</div>
        {transforms.length > 0 ? (
          <div style={{ padding: "10px 20px", background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 99, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 18, fontWeight: 700, fontFamily: "var(--font-display)", color: "#a78bfa" }}>{transforms.length}</span>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>step{transforms.length > 1 ? "s" : ""}</span>
          </div>
        ) : (
          <div style={{ padding: "10px 14px", background: "var(--bg-card)", border: "1px solid var(--border-dim)", borderRadius: 10, color: "var(--text-muted)", fontSize: 12 }}>—</div>
        )}
      </div>

      <ArrowRight size={20} color="var(--text-faint)" />

      {/* Sinks */}
      <div>
        <div style={{ fontSize: 9, color: "var(--teal)", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Destinations</div>
        {renderCards(sinks.length ? sinks : [{ id: "d", label: "—" }], "var(--teal)", "rgba(6,214,160,0.3)")}
      </div>
    </div>
  );
}
