import { useState } from "react";
import { ChevronDown, ChevronRight, Key, Link } from "lucide-react";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";

export default function SchemaPanel({ schema, semantic, generating, onGenerate }) {
  const [expanded, setExpanded] = useState({});

  const toggle = (name) => setExpanded((prev) => ({ ...prev, [name]: !prev[name] }));

  return (
    <div className="flex flex-col h-full">
      <div
        className="px-4 py-3.5 flex items-center justify-between"
        style={{ borderBottom: "1px solid var(--border-default)" }}
      >
        <span
          className="text-xs font-bold uppercase tracking-[0.1em]"
          style={{ color: "var(--text-muted)" }}
        >
          Schema Browser
        </span>
        <Badge type={semantic ? "teal" : "default"}>{semantic ? "Semantic" : "Raw"}</Badge>
      </div>

      <div className="flex-1 overflow-auto py-1">
        {schema?.tables?.map((table) => (
          <div key={table.name}>
            <button
              onClick={() => toggle(table.name)}
              className="w-full flex items-center gap-2 px-4 py-2 bg-transparent border-none cursor-pointer text-left transition-colors duration-150 font-mono text-xs"
              style={{ color: "var(--text-secondary)", fontWeight: 500 }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              {expanded[table.name] ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              <span className="flex-1 truncate">{table.name}</span>
              <Badge type="teal">{table.row_count.toLocaleString()}</Badge>
            </button>
            {expanded[table.name] && (
              <div className="pl-8 pr-4 py-1">
                {table.columns.map((col) => (
                  <div key={col.name} className="flex items-center justify-between py-1 text-xs">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {col.primary_key && <Key size={10} className="text-amber-500 flex-shrink-0" />}
                      {col.foreign_key && <Link size={10} className="text-violet-500 flex-shrink-0" />}
                      <span
                        className="font-mono truncate"
                        style={{
                          color: col.primary_key ? "#F59E0B" : col.foreign_key ? "#8B5CF6" : "var(--text-muted)",
                        }}
                      >
                        {col.name}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono ml-2 flex-shrink-0" style={{ color: "var(--text-faint)" }}>
                      {col.type}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="px-4 py-3" style={{ borderTop: "1px solid var(--border-default)" }}>
        <Button
          variant="teal"
          size="sm"
          onClick={onGenerate}
          disabled={generating}
          className="w-full justify-center"
        >
          {generating ? "Generating..." : "Generate Semantic Layer"}
        </Button>
      </div>
    </div>
  );
}
