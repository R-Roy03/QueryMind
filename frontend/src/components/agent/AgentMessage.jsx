import ReactMarkdown from "react-markdown";
import ThinkingSteps from "./ThinkingSteps";
import { Hexagon, User } from "lucide-react";

/**
 * AgentMessage — ChatGPT/Claude style: full-width, clean layout.
 * User messages: right-aligned bubble.
 * Agent messages: full-width with avatar, no box — just clean markdown.
 */
export default function AgentMessage({ message }) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end px-4 py-3">
        <div className="flex items-start gap-3 max-w-[70%]">
          <div
            className="px-5 py-3.5 text-white rounded-lg text-sm leading-relaxed"
            style={{
              background: "linear-gradient(135deg, var(--accent-cyan), var(--accent-azure))",
              borderBottomRightRadius: "4px",
            }}
          >
            {message.content}
          </div>
          <div
            className="w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
          >
            <User size={14} style={{ color: "var(--text-muted)" }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-4">
      {/* Agent header */}
      <div className="flex items-center gap-2.5 mb-4">
        <div
          className="w-7 h-7 flex-shrink-0 rounded-full flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, var(--accent-cyan), var(--accent-azure))" }}
        >
          <Hexagon size={12} color="white" />
        </div>
        <span
          className="text-xs font-semibold uppercase tracking-wide"
          style={{ color: "var(--text-muted)" }}
        >
          QueryMind Agent
        </span>
      </div>

      {/* Full-width markdown content — no box, no border */}
      <div
        className="agent-response pl-10"
        style={{
          borderLeft: message.isError ? "2px solid rgba(239,68,68,0.4)" : "none",
        }}
      >
        <div className="markdown-prose">
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
        {message.steps?.length > 0 && (
          <div className="mt-4">
            <ThinkingSteps steps={message.steps} />
          </div>
        )}
      </div>
    </div>
  );
}
