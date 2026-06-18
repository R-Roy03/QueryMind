import { useState } from "react";
import { ChevronDown, ChevronRight, RotateCcw, Trash2 } from "lucide-react";
import { Badge } from "../ui/Badge";

export default function QueryHistory({ history, onRerun, onClear }) {
  const [open, setOpen] = useState(false);
  if (!history || history.length === 0) return null;

  return (
    <div className="mb-5">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 bg-transparent border-none cursor-pointer text-xs py-1 transition-colors"
        style={{ color: "var(--text-muted)", fontFamily: "'Inter', sans-serif" }}
      >
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        📋 Recent Queries ({history.length})
        {open && (
          <span
            onClick={(e) => { e.stopPropagation(); onClear(); }}
            className="ml-2 flex items-center cursor-pointer"
            style={{ color: "var(--color-error)" }}
          >
            <Trash2 size={11} />
          </span>
        )}
      </button>
      {open && (
        <div className="mt-1.5 flex flex-col gap-1">
          {history.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer transition-all duration-150"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
              }}
              onClick={() => onRerun(item.question)}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--accent-cyan)"}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border-subtle)"}
            >
              <span
                className="flex-1 text-xs overflow-hidden text-ellipsis whitespace-nowrap"
                style={{ color: "var(--text-secondary)" }}
              >
                {item.question}
              </span>
              <Badge type="blue">{item.row_count} rows</Badge>
              <Badge type="default">{item.execution_time_ms}ms</Badge>
              <RotateCcw size={11} style={{ color: "var(--text-muted)" }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
