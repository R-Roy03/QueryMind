import { useState } from "react";
import { motion } from "framer-motion";
import { qualityApi } from "../services/api";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Skeleton } from "../components/ui/Skeleton";
import { staggerContainer, staggerItem, fadeUpMotion } from "../lib/motion";
import { Shield, Play } from "lucide-react";
import toast from "react-hot-toast";

const getHealthColor = (score) => {
  if (score >= 80) return "#10B981";
  if (score >= 60) return "#F59E0B";
  return "#EF4444";
};

const getHealthGradient = (score) => {
  if (score >= 80) return "linear-gradient(90deg, #10B981, #06B6D4)";
  if (score >= 60) return "linear-gradient(90deg, #F59E0B, #E6A524)";
  return "linear-gradient(90deg, #EF4444, #F87171)";
};

export default function DataQualityPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleScan = async () => {
    try {
      setLoading(true);
      setData(null);
      const res = await qualityApi.scanAll();
      setData(res.data);
      toast.success(`Scan complete — ${res.data.summary.total_issues} issues found`);
    } catch {
      toast.error("Quality scan failed");
    } finally { setLoading(false); }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2
            className="text-xl font-bold m-0"
            style={{ fontFamily: "'Sora', sans-serif", color: "var(--text-primary)" }}
          >
            Data Quality
          </h2>
          <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            Automated health checks across all tables
          </div>
        </div>
        <Button variant="primary" icon={<Play size={14} />} onClick={handleScan} disabled={loading}>
          {loading ? "Scanning..." : "Run Full Quality Scan"}
        </Button>
      </div>

      {/* Loading */}
      {loading && (
        <div>
          <div className="grid grid-cols-3 gap-5 mb-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-lg p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)" }}>
                <Skeleton height={12} width="60%" /><div className="h-2" /><Skeleton height={24} width="40%" />
              </div>
            ))}
          </div>
          {[1, 2].map((i) => (
            <div key={i} className="rounded-lg p-5 mb-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)" }}>
              <Skeleton height={16} width="50%" /><div className="h-2.5" /><Skeleton height={4} /><div className="h-3" /><Skeleton height={14} /><div className="h-1.5" /><Skeleton height={14} width="80%" />
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {data && !loading && (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible">
          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-5 mb-6">
            {[
              { icon: "📊", label: "Tables Scanned", value: data.summary.tables_scanned, color: "#3B82F6" },
              { icon: "⚠️", label: "Total Issues", value: data.summary.total_issues, color: data.summary.total_issues > 0 ? "#F59E0B" : "#10B981" },
              { icon: "🛡️", label: "Overall Health", value: `${data.summary.overall_health_score}%`, color: getHealthColor(data.summary.overall_health_score) },
            ].map((stat) => (
              <motion.div key={stat.label} variants={staggerItem}>
                <Card className="p-4">
                  <div className="text-xl mb-1.5">{stat.icon}</div>
                  <div className="text-2xl font-bold" style={{ fontFamily: "'Sora', sans-serif", color: stat.color }}>{stat.value}</div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{stat.label}</div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Per-table cards */}
          {data.tables.map((table) => {
            const hColor = getHealthColor(table.health_score);
            const hGradient = getHealthGradient(table.health_score);
            return (
              <motion.div key={table.table} variants={staggerItem} className="mb-5">
                <Card
                  style={{
                    border: `1px solid ${table.health_score >= 80 ? "var(--border-default)" : table.health_score >= 60 ? "rgba(245,158,11,0.2)" : "rgba(239,68,68,0.2)"}`,
                  }}
                >
                  {/* Header */}
                  <div className="px-5 py-3.5" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <Shield size={14} style={{ color: hColor }} />
                        <span className="font-mono text-sm" style={{ color: "var(--text-primary)" }}>{table.table}</span>
                      </div>
                      <span className="text-[13px] font-bold" style={{ fontFamily: "'Sora', sans-serif", color: hColor }}>
                        {table.health_score}% healthy
                      </span>
                    </div>
                    <div className="h-1 rounded-full" style={{ background: "var(--bg-surface)" }}>
                      <div className="h-full rounded-full transition-all duration-800" style={{ width: `${table.health_score}%`, background: hGradient }} />
                    </div>
                  </div>

                  {/* Issues */}
                  {table.issues.length === 0 ? (
                    <div className="px-5 py-3 text-xs flex items-center gap-1.5" style={{ color: "#10B981" }}>
                      ✅ No quality issues found
                    </div>
                  ) : (
                    table.issues.map((issue, i) => (
                      <div
                        key={i}
                        className="px-5 py-2.5 flex gap-2.5 items-start"
                        style={{ borderBottom: "1px solid var(--border-subtle)" }}
                      >
                        <div className="mt-0.5">{issue.severity === "high" ? "🔴" : issue.severity === "medium" ? "🟡" : "🔵"}</div>
                        <div className="flex-1">
                          <div className="text-xs mb-0.5" style={{ color: "var(--text-secondary)" }}>
                            <span className="font-mono text-amber-500">{issue.column}</span>
                            {" — "}{issue.message}
                          </div>
                          {issue.recommendation && (
                            <div className="text-xs italic" style={{ color: "var(--text-muted)" }}>
                              → {issue.recommendation}
                            </div>
                          )}
                        </div>
                        <Badge type={issue.severity === "high" ? "red" : issue.severity === "medium" ? "amber" : "blue"}>
                          {issue.severity}
                        </Badge>
                      </div>
                    ))
                  )}
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Empty state */}
      {!data && !loading && (
        <div className="flex flex-col items-center justify-center gap-4" style={{ height: "50vh" }}>
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, var(--color-warning-bg), var(--accent-azure-bg))" }}
          >
            <Shield size={24} className="text-amber-500" />
          </div>
          <div className="text-center">
            <div
              className="text-base font-semibold mb-1.5"
              style={{ fontFamily: "'Sora', sans-serif", color: "var(--text-primary)" }}
            >
              Data Quality Scanner
            </div>
            <div className="text-[13px] max-w-[360px]" style={{ color: "var(--text-muted)" }}>
              Run automated NULL checks, duplicate detection, and AI-powered recommendations across all tables.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
