import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { monitorApi } from "../services/api";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Skeleton } from "../components/ui/Skeleton";
import { staggerContainer, staggerItem } from "../lib/motion";
import toast from "react-hot-toast";

export default function MonitorPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [diagnosing, setDiagnosing] = useState(null);
  const [diagnosis, setDiagnosis] = useState({});

  useEffect(() => { fetchHistory(); }, []);

  const fetchHistory = async () => {
    try {
      const res = await monitorApi.history(40);
      setData(res.data);
    } catch { toast.error("Failed to load pipeline history"); }
    finally { setLoading(false); }
  };

  const handleDiagnose = async (runId) => {
    if (diagnosis[runId]) return;
    setDiagnosing(runId);
    try {
      const res = await monitorApi.diagnose(runId);
      setDiagnosis((prev) => ({ ...prev, [runId]: res.data }));
    } catch { toast.error("Diagnosis failed"); }
    finally { setDiagnosing(null); }
  };

  const formatDuration = (s) => {
    if (!s) return "—";
    if (s < 60) return `${s}s`;
    return `${Math.floor(s / 60)}m ${s % 60}s`;
  };

  const timeAgo = (iso) => {
    if (!iso) return "—";
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hrs ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  };

  if (loading) {
    return (
      <div>
        <div className="grid grid-cols-4 gap-5 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-lg p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)" }}>
              <Skeleton height={12} width="60%" /><div className="h-2" /><Skeleton height={28} width="50%" />
            </div>
          ))}
        </div>
        <Skeleton height={300} rounded={18} />
      </div>
    );
  }

  if (!data) return null;

  const { summary, recent_runs } = data;

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-5 mb-5">
        {[
          { icon: "📦", label: "Total Runs", value: summary.total_runs, color: "#3B82F6" },
          { icon: "✅", label: "Success Rate", value: `${summary.success_rate}%`, color: summary.success_rate >= 85 ? "#10B981" : "#F59E0B" },
          { icon: "⚡", label: "Avg Duration", value: formatDuration(summary.avg_duration_seconds), color: "#06B6D4" },
          { icon: "📊", label: "Rows Processed", value: summary.total_rows_processed?.toLocaleString(), color: "#3B82F6" },
        ].map((s) => (
          <motion.div key={s.label} variants={staggerItem}>
            <Card className="p-4">
              <div className="text-xl mb-1">{s.icon}</div>
              <div className="text-2xl font-bold" style={{ fontFamily: "'Sora', sans-serif", color: s.color }}>{s.value}</div>
              <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{s.label}</div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Run History Table */}
      <motion.div variants={staggerItem}>
        <Card>
          <div
            className="px-5 py-3 text-xs font-bold tracking-[0.1em] uppercase"
            style={{ borderBottom: "1px solid var(--border-default)", color: "var(--text-muted)" }}
          >
            Recent Pipeline Runs
          </div>

          {/* Header */}
          <div
            className="grid px-5 py-2 text-xs font-bold uppercase tracking-wider"
            style={{
              gridTemplateColumns: "2fr 0.7fr 0.7fr 0.8fr 0.8fr 1fr",
              borderBottom: "1px solid var(--border-subtle)",
              color: "var(--text-faint)",
            }}
          >
            <span>Pipeline</span><span>Status</span><span>Duration</span><span>Rows</span><span>When</span><span>Action</span>
          </div>

          {/* Rows */}
          {recent_runs.map((run) => (
            <div key={run.id}>
              <div
                className="grid px-5 py-2.5 text-xs items-center transition-colors duration-100"
                style={{
                  gridTemplateColumns: "2fr 0.7fr 0.7fr 0.8fr 0.8fr 1fr",
                  borderBottom: "1px solid var(--border-subtle)",
                  color: "var(--text-secondary)",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                <div>
                  <div className="font-mono text-xs" style={{ color: "var(--text-primary)" }}>{run.pipeline_name}</div>
                  {run.pipeline_desc && <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{run.pipeline_desc}</div>}
                </div>
                <div>
                  <Badge type={run.status === "success" ? "green" : "red"}>
                    {run.status === "success" ? "✅ Success" : "❌ Failed"}
                  </Badge>
                </div>
                <span className="font-mono text-xs">{formatDuration(run.duration_seconds)}</span>
                <span className="font-mono text-xs">{run.rows_processed ? run.rows_processed.toLocaleString() : "—"}</span>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>{timeAgo(run.started_at)}</span>
                <div>
                  {run.status === "failed" && (
                    <button
                      onClick={() => handleDiagnose(run.id)}
                      disabled={diagnosing === run.id}
                      className="px-2.5 py-1 rounded-lg text-xs cursor-pointer transition-all duration-150"
                      style={{
                        border: "1px solid var(--accent-cyan-border)",
                        background: "var(--accent-cyan-bg)",
                        color: "var(--accent-cyan)",
                        fontFamily: "'Inter', sans-serif",
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "rgba(6,182,212,0.12)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "var(--accent-cyan-bg)"}
                    >
                      {diagnosing === run.id ? "Diagnosing..." : diagnosis[run.id] ? "🤖 View Diagnosis" : "🤖 Diagnose"}
                    </button>
                  )}
                </div>
              </div>

              {/* Diagnosis panel */}
              {diagnosis[run.id] && (
                <div
                  className="px-5 py-3 pl-9 animate-[fade-up_0.3s_ease-out_forwards]"
                  style={{
                    background: "var(--accent-cyan-bg)",
                    borderBottom: "1px solid var(--accent-cyan-border)",
                  }}
                >
                  <div className="text-xs font-bold mb-2 tracking-wider" style={{ color: "var(--accent-cyan)" }}>
                    🤖 AI FAILURE DIAGNOSIS
                  </div>

                  {diagnosis[run.id].error ? (
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>{diagnosis[run.id].error}</div>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                        <strong className="text-amber-500">Error:</strong> {diagnosis[run.id].error_type} — {diagnosis[run.id].error_message}
                      </div>
                      <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                        <strong className="text-red-500">Root Cause:</strong> {diagnosis[run.id].root_cause}
                      </div>
                      <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                        <strong style={{ color: "var(--accent-cyan)" }}>Fix:</strong> {diagnosis[run.id].immediate_fix}
                      </div>
                      <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                        <strong className="text-blue-500">Prevention:</strong> {diagnosis[run.id].prevention}
                      </div>
                      <Badge type={diagnosis[run.id].severity === "critical" ? "red" : diagnosis[run.id].severity === "high" ? "amber" : "blue"}>
                        Severity: {diagnosis[run.id].severity}
                      </Badge>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </Card>
      </motion.div>
    </motion.div>
  );
}
