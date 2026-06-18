import { Badge } from "../ui/Badge";

export default function ExplanationCard({ question, explanation, executionTime, confidence }) {
  return (
    <div
      className="rounded-lg p-5"
      style={{
        background: "linear-gradient(135deg, var(--accent-cyan-bg), var(--accent-azure-bg))",
        border: "1px solid var(--accent-cyan-border)",
      }}
    >
      <div
        className="text-xs font-bold tracking-[0.1em] uppercase mb-5"
        style={{ color: "var(--accent-cyan)" }}
      >
        ✦ AI EXPLANATION
      </div>
      <div
        className="text-sm leading-relaxed whitespace-pre-wrap"
        style={{ color: "var(--text-secondary)" }}
      >
        {explanation}
      </div>
      <div className="flex gap-2 mt-6">
        {executionTime && <Badge type="teal">⏱ {executionTime}ms</Badge>}
        {confidence && <Badge type="blue">💯 {Math.round(confidence * 100)}% confidence</Badge>}
      </div>
    </div>
  );
}
