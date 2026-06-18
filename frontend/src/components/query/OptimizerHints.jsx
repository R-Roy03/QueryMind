import { Badge } from "../ui/Badge";

const TYPE_MAP = { index: "blue", join: "purple", select: "default", partition: "teal" };

export default function OptimizerHints({ hints }) {
  if (!hints || hints.length === 0) return null;
  return (
    <div
      className="mt-3 rounded-lg"
      style={{ border: "1px solid rgba(245, 158, 11, 0.25)" }}
    >
      <div
        className="px-3.5 py-2.5 text-xs font-bold tracking-[0.08em]"
        style={{ background: "var(--color-warning-bg)", color: "var(--color-warning)" }}
      >
        ⚡ OPTIMIZATION HINTS
      </div>
      {hints.map((hint, i) => (
        <div
          key={i}
          className="px-3.5 py-2.5 flex items-center gap-2"
          style={{ borderTop: "1px solid var(--border-subtle)" }}
        >
          <Badge type={TYPE_MAP[hint.type] || "default"}>{hint.type || "tip"}</Badge>
          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{hint.tip}</span>
        </div>
      ))}
    </div>
  );
}
