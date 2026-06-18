import { X } from "lucide-react";
import { Badge } from "../ui/Badge";
import { Skeleton } from "../ui/Skeleton";

export default function ColumnProfile({ data, loading, onClose }) {
  if (!data && !loading) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={onClose}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} />
      <div style={{ position: "relative", background: "var(--bg-card)", border: "1px solid var(--border-mid)", borderRadius: 14, padding: "20px 24px", width: 380, maxHeight: "70vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.6)" }}
        onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>Column Profile</div>
            {data && <div style={{ fontFamily: "var(--font-mono)", fontSize: 14, color: "var(--text-primary)", marginTop: 2 }}>{data.table}.{data.column}</div>}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={16} /></button>
        </div>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Skeleton height={20} /><Skeleton height={20} /><Skeleton height={20} width="80%" />
          </div>
        ) : data ? (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              {[
                { label: "Total Rows", value: data.total_rows, type: "blue" },
                { label: "Non-Null", value: data.non_null_count, type: "green" },
                { label: "Null %", value: `${data.null_percentage}%`, type: data.null_percentage > 10 ? "red" : "default" },
                { label: "Unique", value: `${data.uniqueness_percentage}%`, type: "teal" },
              ].map((stat) => (
                <div key={stat.label} style={{ background: "var(--bg-elevated)", borderRadius: 8, padding: "8px 12px" }}>
                  <div style={{ fontSize: 9, color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>{stat.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "var(--font-display)", color: "var(--text-primary)", marginTop: 2 }}>{stat.value}</div>
                </div>
              ))}
            </div>

            {data.top_values?.length > 0 && (
              <>
                <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Top Values</div>
                {data.top_values.map((item, i) => {
                  const maxCount = data.top_values[0]?.count || 1;
                  const pct = (item.count / maxCount) * 100;
                  return (
                    <div key={i} style={{ marginBottom: 6 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 2 }}>
                        <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-secondary)", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.value}</span>
                        <span style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{item.count}</span>
                      </div>
                      <div style={{ height: 4, background: "var(--bg-elevated)", borderRadius: 99 }}>
                        <div style={{ width: `${pct}%`, height: "100%", borderRadius: 99, background: "linear-gradient(90deg, var(--blue), var(--teal))", transition: "width 0.5s ease" }} />
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
