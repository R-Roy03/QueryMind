import { useState } from "react";
import { motion } from "framer-motion";
import { useSchema } from "../hooks/useSchema";
import { schemaApi } from "../services/api";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import ColumnProfile from "../components/schema/ColumnProfile";
import { staggerContainer, staggerItem } from "../lib/motion";
import { Key, Link, ArrowRight, Table2, Columns3, Rows3, Sparkles } from "lucide-react";
import toast from "react-hot-toast";

export default function SchemaPage() {
  const { schema, semantic, semanticReady, generating, generateSemantic } = useSchema();
  const [profileData, setProfileData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const handleGenerate = async () => {
    try { await generateSemantic(); toast.success("Semantic layer generated!"); } catch { toast.error("Failed to generate semantic layer"); }
  };

  const handleProfile = async (table, column) => {
    setProfileLoading(true); setProfileData(null);
    try {
      const res = await schemaApi.profileColumn(table, column);
      setProfileData(res.data);
    } catch { toast.error("Failed to load column profile"); }
    finally { setProfileLoading(false); }
  };

  if (!schema) return (
    <div className="flex items-center justify-center h-[50vh]">
      <div className="flex gap-1">{[0,1,2].map(i => (
        <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: "#00A896", animation: `bounce 1.2s ease-in-out ${i*0.2}s infinite` }} />
      ))}</div>
    </div>
  );

  const totalColumns = schema.tables?.reduce((s, t) => s + t.columns.length, 0) || 0;
  const totalRows = schema.tables?.reduce((s, t) => s + t.row_count, 0) || 0;
  const fkRelations = [];
  schema.tables?.forEach(t => t.columns.forEach(c => { if (c.foreign_key) fkRelations.push({ from: `${t.name}.${c.name}`, to: c.foreign_key }); }));

  const stats = [
    { label: "Tables", value: schema.tables?.length || 0, icon: Table2, color: "#00A896" },
    { label: "Columns", value: totalColumns, icon: Columns3, color: "#00A896" },
    { label: "Total Rows", value: totalRows.toLocaleString(), icon: Rows3, color: "#00D264" },
    { label: "Semantic Layer", value: semanticReady ? "Ready" : "Not Generated", icon: Sparkles, color: semanticReady ? "#00D264" : "#94A3B8" },
  ];

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2
            className="text-xl font-bold m-0"
            style={{ fontFamily: "'Sora', sans-serif", color: "var(--text-primary)" }}
          >
            Database Schema
          </h2>
          <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            {schema.database || "enterprise_demo"} · PostgreSQL
          </div>
        </div>
        <Button variant="teal" onClick={handleGenerate} disabled={generating}>
          {generating ? "Generating..." : "Generate Semantic Layer"}
        </Button>
      </div>

      {/* Stats — clean cards */}
      <div className="grid grid-cols-4 gap-5 mb-8">
        {stats.map((stat) => {
          const IconComp = stat.icon;
          return (
            <motion.div key={stat.label} variants={staggerItem}>
              <Card className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{ background: `${stat.color}15` }}
                  >
                    <IconComp size={18} style={{ color: stat.color }} />
                  </div>
                  <div className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{stat.label}</div>
                </div>
                <div
                  className="text-2xl font-bold"
                  style={{ fontFamily: "'Sora', sans-serif", color: stat.color }}
                >
                  {stat.value}
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Table cards — clean grid */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(360px,1fr))] gap-5 mb-8">
        {schema.tables?.map((table) => (
          <motion.div key={table.name} variants={staggerItem}>
            <Card>
              {/* Table header */}
              <div
                className="px-5 py-4 flex justify-between items-center"
                style={{ borderBottom: "1px solid var(--border-default)" }}
              >
                <div className="font-mono font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                  {table.name}
                </div>
                <Badge type="teal">{table.row_count.toLocaleString()} rows</Badge>
              </div>

              {/* Columns list */}
              <div className="px-5 py-3">
                {table.columns.map((col) => (
                  <div
                    key={col.name}
                    className="flex items-center justify-between py-2 cursor-pointer transition-colors duration-100"
                    style={{ borderBottom: "1px solid var(--border-subtle)" }}
                    onClick={() => handleProfile(table.name, col.name)}
                    onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    {/* Left: icon + name */}
                    <div className="flex items-center gap-2">
                      {col.primary_key && <Key size={12} className="text-amber-500 flex-shrink-0" />}
                      {col.foreign_key && <Link size={12} className="text-violet-500 flex-shrink-0" />}
                      <span
                        className="font-mono text-xs"
                        style={{
                          color: col.primary_key ? "#F59E0B" : col.foreign_key ? "#8B5CF6" : "var(--text-secondary)",
                        }}
                      >
                        {col.name}
                      </span>
                    </div>
                    {/* Right: type + badge */}
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono" style={{ color: "var(--text-faint)" }}>{col.type}</span>
                      {col.primary_key && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-500 dark:bg-amber-950 dark:text-amber-400">PK</span>}
                      {col.foreign_key && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-violet-50 text-violet-500 dark:bg-violet-950 dark:text-violet-400">FK</span>}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Relationships */}
      {fkRelations.length > 0 && (
        <motion.div variants={staggerItem}>
          <div
            className="text-xs font-bold tracking-[0.1em] uppercase mb-4"
            style={{ color: "var(--text-muted)" }}
          >
            Relationships
          </div>
          <div className="flex flex-col gap-2">
            {fkRelations.map((rel, i) => (
              <div
                key={i}
                className="flex items-center gap-3 py-2.5 px-4 rounded-lg text-xs"
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-default)",
                }}
              >
                <span className="font-mono text-violet-500">{rel.from}</span>
                <ArrowRight size={14} style={{ color: "var(--text-faint)" }} />
                <span className="font-mono text-amber-500">{rel.to}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Column Profile Modal */}
      {(profileData || profileLoading) && (
        <ColumnProfile data={profileData} loading={profileLoading} onClose={() => { setProfileData(null); setProfileLoading(false); }} />
      )}
    </motion.div>
  );
}
