import { useState } from "react";
import { motion } from "framer-motion";
import { pipelineApi } from "../services/api";
import PipelineCanvas from "../components/pipeline/PipelineCanvas";
import GeneratedCode from "../components/pipeline/GeneratedCode";
import LineageView from "../components/pipeline/LineageView";
import { Button } from "../components/ui/Button";
import { fadeUpMotion } from "../lib/motion";
import { Play } from "lucide-react";
import toast from "react-hot-toast";

const EXAMPLES = [
  "Read delivered orders, join with customers and items, aggregate revenue by state, write to state_revenue_summary table",
  "Extract all sellers with reviews below 3 stars, join with order items, calculate total complaints, write to seller_quality_report",
  "Read order reviews, filter 1-star ratings, join with products, aggregate by category, write to low_rated_products_report",
];

export default function PipelinePage() {
  const [description, setDescription] = useState("");
  const [pipelineData, setPipelineData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [rightTab, setRightTab] = useState("visualization");

  const handleBuild = async () => {
    if (!description.trim() || loading) return;
    try {
      setLoading(true);
      const res = await pipelineApi.build(description.trim());
      setPipelineData(res.data);
      toast.success("Pipeline built successfully!");
    } catch {
      toast.error("Failed to build pipeline.");
    } finally { setLoading(false); }
  };

  return (
    <div className="flex gap-5" style={{ height: "calc(100vh - 100px)" }}>
      {/* Left panel */}
      <div className="w-[400px] min-w-[400px] flex flex-col overflow-auto">
        <div
          className="text-xs font-bold tracking-[0.1em] uppercase mb-5"
          style={{ color: "var(--text-muted)" }}
        >
          Describe Your Pipeline
        </div>

        <div
          className="rounded-lg p-[1px] mb-5"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-default)",
          }}
        >
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Read orders from last 30 days, join with customers, filter by region North, aggregate revenue..."
            rows={5}
            className="w-full text-sm leading-relaxed resize-none outline-none rounded-[13px] px-5 py-4.5"
            style={{
              background: "var(--bg-card)",
              border: "none",
              color: "var(--text-primary)",
              fontFamily: "'Inter', sans-serif",
            }}
          />
        </div>

        {/* Numbered examples */}
        <div className="flex flex-col gap-1.5 mb-5">
          {EXAMPLES.map((ex, i) => (
            <button
              key={i}
              onClick={() => setDescription(ex)}
              className="block w-full text-left px-4 py-3 rounded-lg text-xs cursor-pointer transition-all duration-150"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-muted)",
                fontFamily: "'Inter', sans-serif",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--accent-azure)";
                e.currentTarget.style.color = "var(--text-secondary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border-subtle)";
                e.currentTarget.style.color = "var(--text-muted)";
              }}
            >
              <span className="font-mono text-xs mr-2" style={{ color: "var(--text-faint)" }}>{i + 1}.</span>
              {ex}
            </button>
          ))}
        </div>

        <Button
          variant="primary"
          onClick={handleBuild}
          disabled={!description.trim() || loading}
          className="w-full justify-center"
          icon={<Play size={14} />}
        >
          {loading ? "Building..." : "Build Pipeline"}
        </Button>

        {pipelineData?.airflow_dag_code && (
          <motion.div variants={fadeUpMotion} initial="hidden" animate="visible" className="mt-3.5">
            <GeneratedCode code={pipelineData.airflow_dag_code} />
          </motion.div>
        )}
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col min-h-[400px]">
        <div className="flex items-center justify-between mb-5">
          {/* Tab switcher */}
          <div
            className="flex gap-2 p-1 rounded-lg"
            style={{ background: "var(--bg-surface)" }}
          >
            {["visualization", "lineage"].map((tab) => (
              <button
                key={tab}
                onClick={() => setRightTab(tab)}
                className="px-3.5 py-1.5 rounded-lg text-xs capitalize cursor-pointer transition-all duration-150"
                style={{
                  border: "none",
                  fontWeight: rightTab === tab ? 600 : 400,
                  background: rightTab === tab ? "var(--bg-card)" : "transparent",
                  color: rightTab === tab ? "var(--text-primary)" : "var(--text-muted)",
                  boxShadow: rightTab === tab ? "var(--shadow-sm)" : "none",
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                {tab}
              </button>
            ))}
          </div>
          {pipelineData && (
            <span className="text-xs font-mono" style={{ color: "var(--accent-cyan)" }}>
              {pipelineData.nodes?.length || 0} nodes
            </span>
          )}
        </div>

        <div className="flex-1">
          {rightTab === "visualization" ? (
            <PipelineCanvas pipelineData={pipelineData} />
          ) : (
            <LineageView pipelineData={pipelineData} />
          )}
        </div>
      </div>
    </div>
  );
}
