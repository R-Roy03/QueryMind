import { useState, useRef, useEffect } from "react";
import { Send, Trash2, Hexagon } from "lucide-react";
import AgentMessage from "./AgentMessage";

const STARTERS = [
  "What are the key trends in Brazilian e-commerce orders?",
  "Which product categories have the lowest review scores?",
  "Give me an executive summary of seller performance by state",
];

const THINKING_MESSAGES = [
  "Fetching schema...",
  "Reasoning about your question...",
  "Running SQL queries...",
  "Analyzing results...",
  "Composing response...",
];

export default function AgentChat({ messages, loading, onSend, onClear }) {
  const [input, setInput] = useState("");
  const [thinkIdx, setThinkIdx] = useState(0);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  useEffect(() => {
    if (!loading) { setThinkIdx(0); return; }
    const interval = setInterval(() => setThinkIdx((i) => (i + 1) % THINKING_MESSAGES.length), 2200);
    return () => clearInterval(interval);
  }, [loading]);

  const handleSend = () => {
    if (!input.trim() || loading) return;
    onSend(input.trim());
    setInput("");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-auto py-4 px-2">
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full gap-5">
            <div
              className="w-16 h-16 rounded-lg flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, var(--accent-cyan-bg), var(--accent-azure-bg))",
                border: "1px solid var(--accent-cyan-border)",
              }}
            >
              <Hexagon size={28} style={{ color: "var(--accent-cyan)" }} />
            </div>
            <div className="text-center">
              <div
                className="text-xl font-bold mb-2"
                style={{ fontFamily: "'Sora', sans-serif", color: "var(--text-primary)" }}
              >
                QueryMind Agent
              </div>
              <div className="text-sm max-w-[420px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
                I can analyze your data, run queries, find trends, and suggest insights. Ask me anything about your database.
              </div>
            </div>
            <div className="flex flex-wrap gap-2.5 justify-center max-w-[560px] mt-2">
              {STARTERS.map((q, i) => (
                <button
                  key={i}
                  onClick={() => setInput(q)}
                  className="px-4 py-2 rounded-lg text-sm cursor-pointer transition-all duration-150"
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
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => <AgentMessage key={i} message={msg} />)}

        {/* Loading indicator */}
        {loading && (
          <div className="flex items-center gap-5 px-4 py-4">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, var(--accent-cyan), var(--accent-azure))" }}
            >
              <Hexagon size={16} color="white" />
            </div>
            <div
              className="rounded-lg px-5 py-4"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-default)",
              }}
            >
              <div className="text-sm font-medium mb-1.5" style={{ color: "var(--accent-cyan)" }}>
                {THINKING_MESSAGES[thinkIdx]}
              </div>
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full"
                    style={{
                      background: "var(--accent-cyan)",
                      animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar — bigger and cleaner */}
      <div
        className="sticky bottom-0 pt-3 pb-1"
        style={{ background: "linear-gradient(to top, var(--bg-primary) 80%, transparent)" }}
      >
        <div
          className="flex gap-5 items-end rounded-lg px-5 py-4"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-default)",
            boxShadow: "0 -2px 20px rgba(0,0,0,0.06)",
          }}
        >
          {messages.length > 0 && (
            <button
              onClick={onClear}
              title="Clear chat"
              className="flex-shrink-0 p-2.5 rounded-lg cursor-pointer transition-all duration-150 bg-transparent"
              style={{
                border: "1px solid var(--border-subtle)",
                color: "var(--text-muted)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--color-error)";
                e.currentTarget.style.borderColor = "rgba(239,68,68,0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--text-muted)";
                e.currentTarget.style.borderColor = "var(--border-subtle)";
              }}
            >
              <Trash2 size={16} />
            </button>
          )}
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask the agent a question..."
            rows={2}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            className="flex-1 bg-transparent border-none outline-none text-sm resize-none leading-relaxed"
            style={{
              color: "var(--text-primary)",
              fontFamily: "'Inter', sans-serif",
              minHeight: "48px",
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="flex-shrink-0 flex items-center justify-center rounded-lg cursor-pointer transition-all duration-200"
            style={{
              width: "44px",
              height: "44px",
              background: (!input.trim() || loading) ? "var(--bg-surface)" : "linear-gradient(135deg, var(--accent-cyan), var(--accent-azure))",
              border: "none",
              color: (!input.trim() || loading) ? "var(--text-muted)" : "white",
              opacity: (!input.trim() || loading) ? 0.5 : 1,
            }}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
