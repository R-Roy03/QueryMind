export default function SemanticBadge({ text }) {
  if (!text) return null;
  return (
    <div style={{ fontSize: 10, color: "var(--teal)", fontStyle: "italic", marginTop: 2, paddingLeft: 2, opacity: 0.85 }}>
      {text}
    </div>
  );
}
