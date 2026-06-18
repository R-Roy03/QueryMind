import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "../ui/Badge";

export default function ThinkingSteps({ steps }) {
  const [expanded, setExpanded] = useState(false);
  if (!steps || steps.length === 0) return null;

  return (
    <div className="mt-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 bg-transparent border-none cursor-pointer text-xs py-1 transition-colors"
        style={{ color: "var(--text-muted)", fontFamily: "'Inter', sans-serif" }}
      >
        {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        🔍 Agent Reasoning ({steps.length} steps)
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className=""
          >
            <div
              className="mt-2 pl-3"
              style={{ borderLeft: "2px solid var(--accent-cyan-border)" }}
            >
              {steps.map((step, i) => (
                <div
                  key={i}
                  className="px-4 py-3 mb-1.5 rounded-lg"
                  style={{ background: "var(--bg-surface)" }}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Badge type="teal">Step {i + 1}</Badge>
                    {step.action && <Badge type="blue">{step.action}</Badge>}
                  </div>
                  {step.thought && (
                    <div className="text-xs italic mb-1" style={{ color: "var(--text-muted)" }}>
                      💭 {step.thought}
                    </div>
                  )}
                  {step.result && (
                    <div
                      className="font-mono text-xs max-h-[60px] rounded-lg p-2 mt-1"
                      style={{
                        color: "#94A3B8",
                        background: "#0F172A",
                      }}
                    >
                      {step.result.substring(0, 200)}{step.result.length > 200 && "..."}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
