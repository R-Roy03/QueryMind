import { Handle, Position } from "@xyflow/react";
import { Database, Shuffle, Download } from "lucide-react";

const NODE_STYLES = {
  source: {
    bg: "linear-gradient(135deg, #E6FAF7, #F0FDFA)",
    border: "#00A896",
    icon: Database,
    labelColor: "#00A896",
    tag: "SOURCE",
    tagBg: "rgba(0,168,150,0.1)",
  },
  transform: {
    bg: "linear-gradient(135deg, #F3E8FF, #FAF5FF)",
    border: "#8B5CF6",
    icon: Shuffle,
    labelColor: "#8B5CF6",
    tag: "TRANSFORM",
    tagBg: "rgba(139,92,246,0.1)",
  },
  sink: {
    bg: "linear-gradient(135deg, #ECFDF5, #F0FDF4)",
    border: "#00D264",
    icon: Download,
    labelColor: "#00D264",
    tag: "SINK",
    tagBg: "rgba(0,210,100,0.1)",
  },
};

export default function PipelineNode({ data }) {
  const kind = (data.type || "transform").toLowerCase();
  const style = NODE_STYLES[kind] || NODE_STYLES.transform;
  const Icon = style.icon;

  return (
    <div
      style={{
        minWidth: 200,
        borderRadius: 8,
        background: "var(--bg-card)",
        border: `2px solid ${style.border}`,
        boxShadow: `0 2px 12px ${style.border}20`,
        overflow: "hidden",
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: style.border, width: 10, height: 10, border: "2px solid var(--bg-card)" }}
      />

      {/* Header — colored tag */}
      <div
        style={{
          padding: "8px 14px",
          background: style.tagBg,
          display: "flex",
          alignItems: "center",
          gap: 8,
          borderBottom: `1px solid ${style.border}40`,
        }}
      >
        <Icon size={14} color={style.labelColor} strokeWidth={2.5} />
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: style.labelColor,
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {style.tag}
        </span>
      </div>

      {/* Body */}
      <div style={{ padding: "10px 14px" }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--text-primary)",
            marginBottom: 3,
            fontFamily: "'Sora', sans-serif",
          }}
        >
          {data.label}
        </div>
        {data.operation && (
          <div
            style={{
              fontSize: 11,
              fontFamily: "'JetBrains Mono', monospace",
              color: "var(--text-muted)",
              lineHeight: 1.5,
            }}
          >
            {data.operation}
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: style.border, width: 10, height: 10, border: "2px solid var(--bg-card)" }}
      />
    </div>
  );
}
