import { useState } from "react";
import { motion } from "framer-motion";
import { useSchema } from "../hooks/useSchema";
import { queryApi, costApi } from "../services/api";
import SchemaPanel from "../components/schema/SchemaPanel";
import SqlBlock from "../components/query/SqlBlock";
import ResultsTable from "../components/query/ResultsTable";
import ExplanationCard from "../components/query/ExplanationCard";
import QueryHistory from "../components/query/QueryHistory";
import OptimizerHints from "../components/query/OptimizerHints";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { fadeUpMotion } from "../lib/motion";
import { Zap } from "lucide-react";
import toast from "react-hot-toast";

const EXAMPLES = [
  "Show me top 10 product categories by total revenue",
  "Which Brazilian state has the most orders?",
  "What is the average review score per product category?",
  "List all sellers from São Paulo with more than 50 orders",
];

export default function QueryPage() {
  const { schema, semantic, generating, generateSemantic } = useSchema();
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("sql");
  const [hints, setHints] = useState([]);
  const [costData, setCostData] = useState(null);
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem("qm_query_history") || "[]"); } catch { return []; }
  });

  const handleQuery = async (q) => {
    const text = q || question;
    if (!text.trim() || loading) return;
    try {
      setLoading(true);
      setResult(null);
      setHints([]);
      setCostData(null);
      const res = await queryApi.ask(text.trim());
      setResult(res.data);
      setActiveTab("sql");
      toast.success("Query executed successfully");
      const entry = { id: Date.now(), question: text.trim(), sql: res.data.sql, row_count: res.data.row_count, execution_time_ms: res.data.execution_time_ms, timestamp: new Date().toISOString() };
      const updated = [entry, ...history].slice(0, 10);
      setHistory(updated);
      localStorage.setItem("qm_query_history", JSON.stringify(updated));
      try {
        const [hintRes, costRes] = await Promise.allSettled([
          queryApi.optimize(res.data.sql),
          costApi.estimate(res.data.sql),
        ]);
        if (hintRes.status === "fulfilled") setHints(hintRes.value.data.hints || []);
        if (costRes.status === "fulfilled") setCostData(costRes.value.data);
      } catch {}
    } catch (err) {
      toast.error(err.response?.data?.detail || "Query failed");
    } finally {
      setLoading(false);
    }
  };

  const tabs = ["sql", "results", "explanation"];

  return (
    <div className="flex gap-5" style={{ height: "calc(100vh - 100px)" }}>
      {/* Left — Schema */}
      <div
        className="w-[280px] min-w-[260px] flex flex-col overflow-hidden rounded-lg"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
        }}
      >
        <SchemaPanel schema={schema} semantic={semantic} generating={generating} onGenerate={generateSemantic} />
      </div>

      {/* Right — Query Workspace */}
      <div className="flex-1 overflow-auto">
        {/* Input area */}
        <div
          className="rounded-lg mb-6"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-default)",
          }}
        >
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleQuery(); } }}
            placeholder="Ask anything about your data in plain English..."
            rows={3}
            className="w-full text-sm leading-relaxed resize-none outline-none rounded-lg px-5 py-4"
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-primary)",
              fontFamily: "'Inter', sans-serif",
              minHeight: "70px",
            }}
          />
        </div>

        {/* Chips + Button row */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
          <div className="flex gap-2 flex-wrap flex-1">
            {EXAMPLES.map((ex, i) => (
              <button
                key={i}
                onClick={() => setQuestion(ex)}
                className="px-3 py-1.5 rounded-lg text-xs cursor-pointer whitespace-nowrap transition-all duration-150"
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-default)",
                  color: "var(--text-muted)",
                  fontFamily: "'Inter', sans-serif",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent-cyan)";
                  e.currentTarget.style.color = "var(--accent-cyan)";
                  e.currentTarget.style.background = "var(--accent-cyan-bg)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-default)";
                  e.currentTarget.style.color = "var(--text-muted)";
                  e.currentTarget.style.background = "var(--bg-surface)";
                }}
              >
                {ex}
              </button>
            ))}
          </div>
          <Button variant="primary" size="lg" icon={<Zap size={14} />} onClick={() => handleQuery()} disabled={!question.trim() || loading}>
            {loading ? "Running..." : "Run Query"}
          </Button>
        </div>

        {/* History */}
        <QueryHistory history={history} onRerun={(q) => { setQuestion(q); handleQuery(q); }} onClear={() => { setHistory([]); localStorage.removeItem("qm_query_history"); }} />

        {/* Results — with clear spacing */}
        {result && (
          <motion.div
            variants={fadeUpMotion}
            initial="hidden"
            animate="visible"
            className="mt-5"
          >
            {/* Tab bar */}
            <div
              className="flex gap-2 p-1.5 rounded-lg w-fit mb-6"
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
            >
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="px-4 py-2 rounded-md text-sm capitalize cursor-pointer transition-all duration-150"
                  style={{
                    border: "none",
                    fontWeight: activeTab === tab ? 600 : 400,
                    background: activeTab === tab ? "var(--bg-card)" : "transparent",
                    color: activeTab === tab ? "var(--text-primary)" : "var(--text-muted)",
                    boxShadow: activeTab === tab ? "var(--shadow-sm)" : "none",
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Content with spacing */}
            <div className="space-y-6">
              {activeTab === "sql" && (
                <>
                  <SqlBlock code={result.sql} />
                  {hints.length > 0 && <OptimizerHints hints={hints} />}
                </>
              )}
              {activeTab === "results" && <ResultsTable columns={result.columns} rows={result.rows} rowCount={result.row_count} />}
              {activeTab === "explanation" && <ExplanationCard question={result.question} explanation={result.explanation} executionTime={result.execution_time_ms} confidence={result.confidence} />}
            </div>

            {/* Stats bar */}
            <div className="flex gap-2.5 justify-end mt-6">
              <Badge type="default">⏱ {result.execution_time_ms}ms</Badge>
              <Badge type="blue">📊 {result.row_count} rows</Badge>
              <Badge type="teal">💯 {Math.round((result.confidence || 0.9) * 100)}%</Badge>
              {costData && (
                <Badge type={costData.cost_color === "green" ? "green" : costData.cost_color === "amber" ? "amber" : "red"}>
                  💰 {costData.cost_tier.toUpperCase()} · {costData.estimated_cloud_cost}
                </Badge>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
