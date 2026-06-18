import { useState } from "react";
import { motion } from "framer-motion";
import { piiApi, contractApi, anomalyApi } from "../services/api";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Skeleton } from "../components/ui/Skeleton";
import { staggerContainer, staggerItem } from "../lib/motion";
import { Shield, FileCheck, BarChart3, Play } from "lucide-react";
import toast from "react-hot-toast";

const TABS = [
  { id: "pii", label: "PII Scanner", icon: Shield, color: "#EF4444" },
  { id: "contracts", label: "Data Contracts", icon: FileCheck, color: "#06B6D4" },
  { id: "anomalies", label: "Anomaly Detection", icon: BarChart3, color: "#F59E0B" },
];

export default function GovernancePage() {
  const [activeTab, setActiveTab] = useState("pii");
  const [piiData, setPiiData] = useState(null);
  const [contractData, setContractData] = useState(null);
  const [anomalyData, setAnomalyData] = useState(null);
  const [loading, setLoading] = useState(false);

  const runPiiScan = async () => {
    setLoading(true);
    try {
      const res = await piiApi.scanAll();
      setPiiData(res.data);
      toast.success(`PII scan complete — ${res.data.total_pii_columns} columns flagged`);
    } catch { toast.error("PII scan failed"); }
    finally { setLoading(false); }
  };

  const runContractValidation = async () => {
    setLoading(true);
    try {
      const res = await contractApi.validateAll();
      setContractData(res.data);
      toast.success(`Contract validation complete — ${res.data.overall_contract_health}% health`);
    } catch { toast.error("Contract validation failed"); }
    finally { setLoading(false); }
  };

  const runAnomalyScan = async () => {
    setLoading(true);
    try {
      const res = await anomalyApi.scanAll();
      setAnomalyData(res.data);
      toast.success(`Anomaly scan complete — ${res.data.total_anomalies} columns with anomalies`);
    } catch { toast.error("Anomaly scan failed"); }
    finally { setLoading(false); }
  };

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg w-fit mb-5" style={{ background: "var(--bg-surface)" }}>
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs cursor-pointer transition-all duration-150"
              style={{
                border: "none",
                fontWeight: isActive ? 600 : 400,
                background: isActive ? "var(--bg-card)" : "transparent",
                color: isActive ? tab.color : "var(--text-muted)",
                boxShadow: isActive ? "var(--shadow-sm)" : "none",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              <Icon size={13} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "pii" && <PiiTab data={piiData} loading={loading} onScan={runPiiScan} />}
      {activeTab === "contracts" && <ContractsTab data={contractData} loading={loading} onValidate={runContractValidation} />}
      {activeTab === "anomalies" && <AnomaliesTab data={anomalyData} loading={loading} onScan={runAnomalyScan} />}
    </div>
  );
}


function PiiTab({ data, loading, onScan }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="text-base font-bold" style={{ fontFamily: "'Sora', sans-serif", color: "var(--text-primary)" }}>PII Detection & Compliance</div>
          <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Scan for email, phone, Aadhaar, PAN, credit card, IP addresses</div>
        </div>
        <Button variant="primary" icon={<Play size={14} />} onClick={onScan} disabled={loading}>
          {loading ? "Scanning..." : "Run PII Scan"}
        </Button>
      </div>

      {loading && <LoadingSkeleton />}

      {data && !loading && (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible">
          <div className="grid grid-cols-3 gap-5 mb-5">
            <StatCard icon="🔍" label="Tables Scanned" value={data.total_tables} color="#3B82F6" />
            <StatCard icon="⚠️" label="PII Columns Found" value={data.total_pii_columns} color={data.total_pii_columns > 0 ? "#F59E0B" : "#10B981"} />
            <StatCard icon="🛡️" label="Compliance Risk" value={data.compliance_risk} color={data.compliance_risk === "HIGH" ? "#EF4444" : data.compliance_risk === "MEDIUM" ? "#F59E0B" : "#10B981"} />
          </div>

          {data.tables.map((table) => (
            <motion.div key={table.table} variants={staggerItem} className="mb-5">
              <Card>
                <div className="px-5 py-3 flex justify-between items-center" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm" style={{ color: "var(--text-primary)" }}>{table.table}</span>
                    <Badge type={table.pii_columns > 0 ? "red" : "green"}>
                      {table.pii_columns > 0 ? `${table.pii_columns} PII columns` : "Clean"}
                    </Badge>
                  </div>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>{table.columns_scanned} columns scanned</span>
                </div>

                {table.columns.filter((c) => c.pii_detected).map((col) => (
                  <div key={col.column} className="px-5 py-2.5 flex gap-2.5 items-start" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <div className="mt-0.5">{col.risk_level === "critical" ? "🔴" : col.risk_level === "high" ? "🟠" : "🟡"}</div>
                    <div className="flex-1">
                      <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
                        <span className="font-mono text-amber-500">{col.column}</span>
                      </div>
                      {col.findings.map((f, i) => (
                        <div key={i} className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                          Type: <strong>{f.type}</strong> · Confidence: {f.confidence}%
                          {f.masked_example && <> · Masked: <code className="text-cyan-500 text-xs">{f.masked_example}</code></>}
                        </div>
                      ))}
                      <div className="text-xs italic mt-0.5" style={{ color: "var(--text-muted)" }}>→ {col.recommendation}</div>
                    </div>
                    <Badge type={col.risk_level === "critical" ? "red" : col.risk_level === "high" ? "amber" : "default"}>{col.risk_level}</Badge>
                  </div>
                ))}

                {table.pii_columns === 0 && (
                  <div className="px-5 py-3 text-xs flex items-center gap-1.5" style={{ color: "#10B981" }}>✅ No PII detected</div>
                )}
              </Card>
            </motion.div>
          ))}

          {Array.isArray(data.governance_recommendations) && data.governance_recommendations.length > 0 && (
            <motion.div variants={staggerItem} className="mt-6">
              <Card style={{ border: "1px solid var(--accent-cyan-border)" }}>
                <div className="px-5 py-3 text-xs font-bold tracking-[0.1em] uppercase" style={{ borderBottom: "1px solid var(--border-subtle)", color: "var(--accent-cyan)" }}>
                  🤖 AI Governance Recommendations
                </div>
                {data.governance_recommendations.map((rec, i) => (
                  <div key={i} className="px-5 py-2.5 flex gap-2.5 items-center" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <Badge type={rec.priority === "immediate" ? "red" : rec.priority === "short-term" ? "amber" : "blue"}>{rec.priority}</Badge>
                    <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{rec.recommendation}</span>
                  </div>
                ))}
              </Card>
            </motion.div>
          )}
        </motion.div>
      )}

      {!data && !loading && <EmptyState icon="🔒" title="PII Scanner" desc="Detect personally identifiable information across your database for GDPR and DPDP Act compliance." />}
    </div>
  );
}


function ContractsTab({ data, loading, onValidate }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="text-base font-bold" style={{ fontFamily: "'Sora', sans-serif", color: "var(--text-primary)" }}>Data Contract Validator</div>
          <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Validate business rules across all tables</div>
        </div>
        <Button variant="primary" icon={<Play size={14} />} onClick={onValidate} disabled={loading}>
          {loading ? "Validating..." : "Validate All Contracts"}
        </Button>
      </div>

      {loading && <LoadingSkeleton />}

      {data && !loading && (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible">
          <div className="grid grid-cols-3 gap-5 mb-5">
            <StatCard icon="📋" label="Tables Checked" value={data.tables_checked} color="#3B82F6" />
            <StatCard icon="📊" label="Overall Health" value={`${data.overall_contract_health}%`} color={data.overall_contract_health >= 80 ? "#10B981" : "#F59E0B"} />
            <StatCard icon="✅" label="Total Rules" value={data.tables.reduce((s, t) => s + t.total_rules, 0)} color="#06B6D4" />
          </div>

          {data.tables.map((table) => {
            const hColor = table.contract_health >= 80 ? "#10B981" : table.contract_health >= 60 ? "#F59E0B" : "#EF4444";
            return (
              <motion.div key={table.table} variants={staggerItem} className="mb-5">
                <Card>
                  <div className="px-5 py-3" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-mono text-sm" style={{ color: "var(--text-primary)" }}>{table.table}</span>
                      <span className="text-[13px] font-bold" style={{ fontFamily: "'Sora', sans-serif", color: hColor }}>{table.contract_health}% health</span>
                    </div>
                    <div className="h-1 rounded-full" style={{ background: "var(--bg-surface)" }}>
                      <div className="h-full rounded-full transition-all duration-800" style={{ width: `${table.contract_health}%`, background: hColor }} />
                    </div>
                  </div>

                  {table.rules.map((rule) => (
                    <div key={rule.rule_id} className="px-5 py-2 flex justify-between items-center" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                      <div className="flex items-center gap-2">
                        <span>{rule.status === "pass" ? "✅" : rule.status === "warn" ? "⚠️" : rule.status === "fail" ? "❌" : "🔧"}</span>
                        <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{rule.description}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {rule.pass_rate !== undefined && (
                          <span className="font-mono text-xs" style={{ color: rule.status === "pass" ? "#10B981" : "#F59E0B" }}>{rule.pass_rate}%</span>
                        )}
                        <Badge type={rule.status === "pass" ? "green" : rule.status === "warn" ? "amber" : "red"}>{rule.status}</Badge>
                      </div>
                    </div>
                  ))}

                  {Array.isArray(table.ai_diagnosis) && table.ai_diagnosis.length > 0 && (
                    <div className="px-5 py-2.5" style={{ background: "var(--accent-cyan-bg)", borderTop: "1px solid var(--accent-cyan-border)" }}>
                      <div className="text-xs font-bold mb-1.5 tracking-wider" style={{ color: "var(--accent-cyan)" }}>🤖 AI ROOT CAUSE ANALYSIS</div>
                      {table.ai_diagnosis.map((d, i) => (
                        <div key={i} className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>
                          <strong className="text-amber-500">{d.violation || d.rule}:</strong> {d.root_cause} → <em style={{ color: "var(--accent-cyan)" }}>{d.fix}</em>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {!data && !loading && <EmptyState icon="📋" title="Data Contracts" desc="Validate data quality rules like non-null constraints, value ranges, and allowed values across all tables." />}
    </div>
  );
}


function AnomaliesTab({ data, loading, onScan }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="text-base font-bold" style={{ fontFamily: "'Sora', sans-serif", color: "var(--text-primary)" }}>Anomaly Detection</div>
          <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Z-score + IQR statistical analysis on numeric columns</div>
        </div>
        <Button variant="primary" icon={<Play size={14} />} onClick={onScan} disabled={loading}>
          {loading ? "Scanning..." : "Run Anomaly Scan"}
        </Button>
      </div>

      {loading && <LoadingSkeleton />}

      {data && !loading && (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible">
          <div className="grid grid-cols-3 gap-5 mb-5">
            <StatCard icon="📊" label="Tables Scanned" value={data.tables_scanned} color="#3B82F6" />
            <StatCard icon="🔍" label="Columns w/ Anomalies" value={data.total_anomalies} color={data.total_anomalies > 0 ? "#F59E0B" : "#10B981"} />
            <StatCard icon="📈" label="Method" value="Z-Score + IQR" color="#06B6D4" />
          </div>

          {data.tables.map((table) => (
            <motion.div key={table.table} variants={staggerItem} className="mb-5">
              <Card>
                <div className="px-5 py-3 flex justify-between items-center" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  <span className="font-mono text-sm" style={{ color: "var(--text-primary)" }}>{table.table}</span>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>{table.columns_analyzed} numeric columns analyzed</span>
                </div>

                {table.results.map((col) => (
                  <div key={col.column} className="px-5 py-3" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <div className="flex justify-between items-center mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[13px] text-amber-500">{col.column}</span>
                        <Badge type={col.severity === "high" ? "red" : col.severity === "medium" ? "amber" : "green"}>
                          {col.anomaly_rate_pct}% anomaly rate
                        </Badge>
                      </div>
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>{col.anomaly_count} anomalies / {col.total_values} values</span>
                    </div>

                    <div className="flex gap-4 text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>
                      <span>Mean: <strong style={{ color: "var(--text-secondary)" }}>{col.stats.mean}</strong></span>
                      <span>Std: <strong style={{ color: "var(--text-secondary)" }}>{col.stats.std_dev}</strong></span>
                      <span>Range: [{col.stats.min} — {col.stats.max}]</span>
                      <span>IQR Fence: [{col.iqr_fence.lower} — {col.iqr_fence.upper}]</span>
                    </div>

                    {col.z_score_anomalies.length > 0 && (
                      <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>
                        Outliers: {col.z_score_anomalies.map((a) => (
                          <code key={a.value} className="text-red-500 mr-2 text-xs">{a.value} (z={a.z_score})</code>
                        ))}
                      </div>
                    )}

                    {col.ai_insight && (
                      <div
                        className="text-xs italic mt-1.5 p-2 rounded-lg"
                        style={{
                          color: "var(--accent-cyan)",
                          background: "var(--accent-cyan-bg)",
                          borderLeft: "2px solid var(--accent-cyan)",
                        }}
                      >
                        🤖 {col.ai_insight}
                      </div>
                    )}
                  </div>
                ))}
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {!data && !loading && <EmptyState icon="📈" title="Anomaly Detection" desc="Detect statistical outliers in numeric columns using Z-score and IQR methods with AI-powered interpretation." />}
    </div>
  );
}


/* Shared mini-components */
function StatCard({ icon, label, value, color }) {
  return (
    <Card className="p-4">
      <div className="text-xl mb-1.5">{icon}</div>
      <div className="text-[22px] font-bold" style={{ fontFamily: "'Sora', sans-serif", color }}>{value}</div>
      <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{label}</div>
    </Card>
  );
}

function EmptyState({ icon, title, desc }) {
  return (
    <div className="flex flex-col items-center justify-center gap-5" style={{ height: "45vh" }}>
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center text-[28px]"
        style={{ background: "linear-gradient(135deg, rgba(239,68,68,0.08), var(--accent-azure-bg))" }}
      >
        {icon}
      </div>
      <div className="text-center">
        <div className="text-base font-semibold mb-1" style={{ fontFamily: "'Sora', sans-serif", color: "var(--text-primary)" }}>{title}</div>
        <div className="text-[13px] max-w-[380px]" style={{ color: "var(--text-muted)" }}>{desc}</div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div>
      <div className="grid grid-cols-3 gap-5 mb-5">
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
  );
}
